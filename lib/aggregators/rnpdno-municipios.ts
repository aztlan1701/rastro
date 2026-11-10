import { parseRnpdnoCsv } from "@/lib/aggregators/rnpdno";
import {
  loadRnpdnoAgregadosSnapshot,
  type RnpdnoAgregadosSnapshot,
} from "@/lib/aggregators/rnpdno-live";
import { RNPDNO_CSV_URL } from "@/lib/config";
import {
  buildMunicipioNameIndex,
  loadMunicipioCatalog,
  normalizeMunicipioName,
  type MunicipioCatalogEntry,
} from "@/lib/geo/municipio-catalog";
import { INEGI_TO_STATE_ID, resolveEstadoToCveEnt } from "@/lib/inegi-codes";
import type { MunicipioAgg, RnpdnoRecord } from "@/lib/types";

const UNKNOWN_MUNICIPIO = new Set([
  "",
  "se desconoce",
  "no especificado",
  "no especifica",
  "sin dato",
  "sin informacion",
  "sin municipio de referencia",
  "n d",
  "nd",
  "na",
]);

export const MUNICIPIOS_FUENTE_CSV = "csv-2023" as const;
export const MUNICIPIOS_FUENTE_CNB = "cnb-tablero" as const;
export const MUNICIPIOS_CORTE_CSV = "2023-09" as const;

/** @deprecated use MUNICIPIOS_FUENTE_CSV */
export const MUNICIPIOS_FUENTE = MUNICIPIOS_FUENTE_CSV;
/** @deprecated use MUNICIPIOS_CORTE_CSV */
export const MUNICIPIOS_CORTE = MUNICIPIOS_CORTE_CSV;

export type MunicipiosFuente =
  | typeof MUNICIPIOS_FUENTE_CSV
  | typeof MUNICIPIOS_FUENTE_CNB
  | "cnb+csv";

export interface MunicipiosAggResult {
  estadoId: string;
  cveEnt: string;
  municipios: MunicipioAgg[];
  matchedRecords: number;
  unmatchedRecords: number;
  unmatchedSamples: string[];
  fuente: MunicipiosFuente;
  corte: string;
  nota?: string;
}

function isUnknownMunicipio(name: string): boolean {
  return UNKNOWN_MUNICIPIO.has(normalizeMunicipioName(name));
}

export function resolveMunicipioCvegeo(
  index: Map<string, MunicipioCatalogEntry>,
  rawName: string,
): MunicipioCatalogEntry | null {
  const key = normalizeMunicipioName(rawName);
  if (!key || UNKNOWN_MUNICIPIO.has(key)) return null;
  const exact = index.get(key);
  if (exact) return exact;

  const hits: MunicipioCatalogEntry[] = [];
  for (const [nombre, entry] of index) {
    if (key.includes(nombre) || nombre.includes(key)) hits.push(entry);
  }
  return hits.length === 1 ? hits[0] : null;
}

export function aggregateMunicipiosForEstado(
  records: RnpdnoRecord[],
  catalog: MunicipioCatalogEntry[],
  cveEnt: string,
): Omit<MunicipiosAggResult, "fuente" | "corte" | "nota"> {
  const estadoId = INEGI_TO_STATE_ID[cveEnt];
  if (!estadoId) {
    return {
      estadoId: "",
      cveEnt,
      municipios: [],
      matchedRecords: 0,
      unmatchedRecords: 0,
      unmatchedSamples: [],
    };
  }

  const index = buildMunicipioNameIndex(catalog, cveEnt);
  const totals = new Map<string, { nombre: string; total: number }>();
  let matchedRecords = 0;
  let unmatchedRecords = 0;
  const unmatchedSamples: string[] = [];

  for (const record of records) {
    if (record.estadoId !== estadoId) continue;
    if (isUnknownMunicipio(record.municipio)) {
      unmatchedRecords += 1;
      continue;
    }

    const entry = resolveMunicipioCvegeo(index, record.municipio);
    if (!entry) {
      unmatchedRecords += 1;
      if (unmatchedSamples.length < 12 && !unmatchedSamples.includes(record.municipio)) {
        unmatchedSamples.push(record.municipio);
      }
      continue;
    }

    matchedRecords += 1;
    const existing = totals.get(entry.cvegeo);
    if (existing) {
      existing.total += 1;
    } else {
      totals.set(entry.cvegeo, { nombre: entry.nombre, total: 1 });
    }
  }

  const municipios: MunicipioAgg[] = [...totals.entries()]
    .map(([cvegeo, row]) => ({
      cvegeo,
      nombre: row.nombre,
      estadoId,
      total: row.total,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    estadoId,
    cveEnt,
    municipios,
    matchedRecords,
    unmatchedRecords,
    unmatchedSamples,
  };
}

export function mapLiveMunicipiosFromSnapshot(
  snapshot: RnpdnoAgregadosSnapshot,
  cveEnt: string,
  catalog: MunicipioCatalogEntry[],
): MunicipiosAggResult | null {
  const estadoId = INEGI_TO_STATE_ID[cveEnt];
  if (!estadoId) return null;

  const bloque = snapshot.datos.por_municipio?.find((row) => row.clave_inegi === cveEnt);
  if (!bloque) return null;

  const index = buildMunicipioNameIndex(catalog, cveEnt);
  const municipios: MunicipioAgg[] = [];
  const unmatchedSamples: string[] = [...(bloque.sin_match ?? [])];
  let matchedRecords = 0;
  let unmatchedRecords = 0;

  for (const fila of bloque.municipios) {
    if (isUnknownMunicipio(fila.nombre)) {
      unmatchedRecords += 1;
      continue;
    }
    const resolved =
      (fila.cvegeo
        ? catalog.find((row) => row.cvegeo === fila.cvegeo)
        : null) ?? resolveMunicipioCvegeo(index, fila.nombre);
    if (!resolved) {
      unmatchedRecords += 1;
      if (unmatchedSamples.length < 12 && !unmatchedSamples.includes(fila.nombre)) {
        unmatchedSamples.push(fila.nombre);
      }
      continue;
    }
    matchedRecords += 1;
    municipios.push({
      cvegeo: resolved.cvegeo,
      nombre: resolved.nombre,
      estadoId,
      total: fila.personas ?? 0,
    });
  }

  municipios.sort((a, b) => b.total - a.total);

  return {
    estadoId,
    cveEnt,
    municipios,
    matchedRecords,
    unmatchedRecords,
    unmatchedSamples,
    fuente: MUNICIPIOS_FUENTE_CNB,
    corte: snapshot.procedencia.consultado_utc.slice(0, 10),
    nota: bloque.nota,
  };
}

/**
 * Preferencia: snapshot CNB (`por_municipio`) → CSV 2023 como respaldo.
 * Si hay CNB, se usan esos totales (más actuales); el CSV solo si no hay bloque.
 */
export async function fetchMunicipiosAggForEstado(
  estadoParam: string,
): Promise<MunicipiosAggResult | null> {
  const cveEnt = resolveEstadoToCveEnt(estadoParam);
  if (!cveEnt) return null;

  const catalogFile = await loadMunicipioCatalog();

  try {
    const snapshot = await loadRnpdnoAgregadosSnapshot();
    const live = mapLiveMunicipiosFromSnapshot(snapshot, cveEnt, catalogFile.municipios);
    if (live && live.municipios.length > 0) {
      return live;
    }
  } catch {
    // sin snapshot municipal → CSV
  }

  const response = await fetch(RNPDNO_CSV_URL, {
    next: { revalidate: 3600 },
    headers: { Accept: "text/csv,text/plain,*/*" },
  });
  if (!response.ok) {
    throw new Error(`RNPDNO CSV fetch failed: ${response.status}`);
  }

  const records = parseRnpdnoCsv(await response.text());
  const agg = aggregateMunicipiosForEstado(records, catalogFile.municipios, cveEnt);

  return {
    ...agg,
    fuente: MUNICIPIOS_FUENTE_CSV,
    corte: MUNICIPIOS_CORTE_CSV,
  };
}
