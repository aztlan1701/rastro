import { cell, findColumn, normalizeHeader, parseCsv } from "@/lib/csv";
import { ESTADOS_DATA } from "@/lib/mock-data";
import { normalizeStateName, STATE_CATALOG } from "@/lib/state-catalog";
import type { EstadoData, RnpdnoRecord } from "@/lib/types";

/** Ventana (en días) usada para el indicador de registros recientes. */
const RECENT_WINDOW_DAYS = 30;

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
  return key.includes("localiz") || key.includes("encontrad");
}

type Sexo = "mujer" | "hombre" | "no_especificado";

/**
 * Clasifica el sexo en tres categorías. Antes, cualquier valor que no fuera
 * "mujer" se contaba como hombre, lo que inflaba el conteo de hombres con
 * registros vacíos, "indeterminado" o "se ignora". Ahora esos casos van a una
 * categoría propia para no sesgar las cifras.
 */
function classifySexo(sex: string): Sexo {
  const key = sex
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (!key) return "no_especificado";
  if (key.startsWith("f") || key.includes("mujer") || key.includes("femen")) return "mujer";
  if (key.startsWith("h") || key.includes("hombre") || key.includes("masc") || key.startsWith("m"))
    return "hombre";
  return "no_especificado";
}

export function parseRnpdnoCsv(csvText: string): RnpdnoRecord[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const stateCol = findColumn(headers, [
    "entidad_federativa_de_ocurrencia",
    "entidad_federativa",
    "entidad_de_desaparici",
    "entidad",
    "estado",
  ]);
  const municipioCol = findColumn(headers, ["municipio_de_ocurrencia", "municipio"]);
  const dateCol = findColumn(headers, [
    "fecha_de_desaparicion",
    "fecha_desaparicion",
    "fecha",
  ]);
  const statusCol = findColumn(headers, ["estatus", "status", "situacion"]);
  const sexCol = findColumn(headers, ["sexo", "genero"]);

  if (stateCol < 0) return [];

  const records: RnpdnoRecord[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const cols = rows[i];
    const estadoRaw = cell(cols, stateCol);
    const state = normalizeStateName(estadoRaw);
    if (!state) continue;

    records.push({
      estadoId: state.id,
      estado: state.nombre,
      municipio: cell(cols, municipioCol),
      fechaDesaparicion: cell(cols, dateCol),
      estatus: cell(cols, statusCol),
      sexo: cell(cols, sexCol),
    });
  }

  return records;
}

/**
 * Fecha de referencia para el indicador de "recientes". Usamos la fecha más
 * nueva presente en el dataset y no `Date.now()`: las versiones públicas del
 * RNPDNO son cortes estáticos (p. ej. sep-2023), así que medir contra "hoy"
 * daría casi siempre 0 y sería engañoso. Medir contra el corte del dataset
 * devuelve los registros del último mes contenido en los datos.
 */
function referenceDate(records: RnpdnoRecord[]): Date {
  let max = 0;
  for (const record of records) {
    const date = parseDate(record.fechaDesaparicion);
    if (date) max = Math.max(max, date.getTime());
  }
  return max > 0 ? new Date(max) : new Date();
}

export function aggregateEstados(records: RnpdnoRecord[]): EstadoData[] {
  const reference = referenceDate(records);
  const windowStart = new Date(reference);
  windowStart.setDate(windowStart.getDate() - RECENT_WINDOW_DAYS);

  const buckets = new Map<
    string,
    {
      total: number;
      nuevos30d: number;
      localizados: number;
      mujeres: number;
      hombres: number;
      noEspecificado: number;
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
      noEspecificado: 0,
      municipios: new Map(),
    });
  }

  for (const record of records) {
    const bucket = buckets.get(record.estadoId);
    if (!bucket) continue;

    bucket.total += 1;
    if (isLocalized(record.estatus)) bucket.localizados += 1;

    const sexo = classifySexo(record.sexo);
    if (sexo === "mujer") bucket.mujeres += 1;
    else if (sexo === "hombre") bucket.hombres += 1;
    else bucket.noEspecificado += 1;

    const date = parseDate(record.fechaDesaparicion);
    if (date && date >= windowStart && date <= reference) bucket.nuevos30d += 1;

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
      [...bucket.municipios.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

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
      noEspecificado: bucket.noEspecificado,
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
