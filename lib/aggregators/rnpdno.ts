import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL, RNPDNO_CSV_URL } from "@/lib/config";
import { ESTADOS_DATA } from "@/lib/mock-data";
import { normalizeStateName, STATE_CATALOG } from "@/lib/state-catalog";
import type { EstadoData, RnpdnoRecord } from "@/lib/types";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const index = headers.indexOf(candidate);
    if (index >= 0) return index;

    const partial = headers.findIndex(
      (header) => header.startsWith(candidate) || header.includes(candidate),
    );
    if (partial >= 0) return partial;
  }
  return -1;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00Z`);
  const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return new Date(`${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}T12:00:00Z`);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isLocalized(status: string): boolean {
  const key = status.toLowerCase();
  return key.includes("localiz") || key.includes("encontrad") || key.includes("localizado");
}

function isFemale(sex: string): boolean {
  const key = sex.toLowerCase();
  return key.startsWith("f") || key.includes("mujer");
}

export function parseRnpdnoCsv(csvText: string): RnpdnoRecord[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const stateCol = findColumn(headers, [
    "entidad_federativa_de_ocurrencia",
    "entidad_federativa",
    "entidad_de_desaparici",
    "entidad",
    "estado",
  ]);
  const municipioCol = findColumn(headers, [
    "municipio_de_ocurrencia",
    "municipio",
  ]);
  const dateCol = findColumn(headers, [
    "fecha_de_desaparicion",
    "fecha_desaparicion",
    "fecha",
  ]);
  const statusCol = findColumn(headers, ["estatus", "status", "situacion"]);
  const sexCol = findColumn(headers, ["sexo", "genero"]);

  if (stateCol < 0) return [];

  const records: RnpdnoRecord[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const estadoRaw = cols[stateCol] ?? "";
    const state = normalizeStateName(estadoRaw);
    if (!state) continue;

    records.push({
      estadoId: state.id,
      estado: state.nombre,
      municipio: municipioCol >= 0 ? cols[municipioCol] ?? "" : "",
      fechaDesaparicion: dateCol >= 0 ? cols[dateCol] ?? "" : "",
      estatus: statusCol >= 0 ? cols[statusCol] ?? "" : "",
      sexo: sexCol >= 0 ? cols[sexCol] ?? "" : "",
    });
  }

  return records;
}

export function aggregateEstados(records: RnpdnoRecord[]): EstadoData[] {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const buckets = new Map<
    string,
    {
      total: number;
      nuevos30d: number;
      localizados: number;
      mujeres: number;
      hombres: number;
      municipios: Map<string, number>;
    }
  >();

  for (const state of STATE_CATALOG) {
    buckets.set(state.id, {
      total: 0,
      nuevos30d: 0,
      localizados: 0,
      mujeres: 0,
      hombres: 0,
      municipios: new Map(),
    });
  }

  for (const record of records) {
    const bucket = buckets.get(record.estadoId);
    if (!bucket) continue;

    bucket.total += 1;
    if (isLocalized(record.estatus)) bucket.localizados += 1;
    if (isFemale(record.sexo)) bucket.mujeres += 1;
    else bucket.hombres += 1;

    const date = parseDate(record.fechaDesaparicion);
    if (date && date >= thirtyDaysAgo) bucket.nuevos30d += 1;

    if (record.municipio) {
      bucket.municipios.set(
        record.municipio,
        (bucket.municipios.get(record.municipio) ?? 0) + 1,
      );
    }
  }

  return STATE_CATALOG.map((state) => {
    const bucket = buckets.get(state.id)!;
    const municipioAlto =
      [...bucket.municipios.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "—";

    return {
      id: state.id,
      nombre: state.nombre,
      lat: state.lat,
      lng: state.lng,
      total: bucket.total,
      nuevos30d: bucket.nuevos30d,
      localizados: bucket.localizados,
      mujeres: bucket.mujeres,
      hombres: bucket.hombres,
      municipioAlto,
    };
  }).filter((estado) => estado.total > 0);
}

export function getMockEstados(): EstadoData[] {
  return ESTADOS_DATA;
}

export async function fetchRnpdnoEstados(csvUrl: string): Promise<{
  estados: EstadoData[];
  records: RnpdnoRecord[];
  usedMock: boolean;
}> {
  try {
    const response = await fetch(csvUrl, {
      next: { revalidate: 3600 },
      headers: { Accept: "text/csv,text/plain,*/*" },
    });

    if (!response.ok) throw new Error(`RNPDNO fetch failed: ${response.status}`);

    const csvText = await response.text();
    const records = parseRnpdnoCsv(csvText);

    if (records.length === 0) throw new Error("RNPDNO CSV parse returned 0 records");

    const estados = aggregateEstados(records);
    if (estados.length === 0) throw new Error("RNPDNO aggregation returned 0 states");

    return { estados, records, usedMock: false };
  } catch {
    return {
      estados: getMockEstados(),
      records: [],
      usedMock: true,
    };
  }
}

/** RNPDNO aggregates shared by every route, so the CSV is downloaded once per cache window. */
export function getRnpdnoCached() {
  return withCache("rnpdno", CACHE_TTL.rnpdno, CACHE_STALE.rnpdno, async () => {
    const result = await fetchRnpdnoEstados(RNPDNO_CSV_URL);
    return {
      data: result,
      status: result.usedMock ? ("mock" as const) : ("live" as const),
      source: result.usedMock ? "mock-data" : RNPDNO_CSV_URL,
    };
  });
}
