import {
  DATACIVICA,
  RECONSTRUCCION_AGGREGADOS_URL,
  RNPDNO_CSV_URL,
  VAD_BORRADOS_CSV_URL,
  VAD_DATASETS,
} from "@/lib/config";
import { parseRnpdnoCsv } from "@/lib/aggregators/rnpdno";
import { normalizeStateName, STATE_CATALOG } from "@/lib/state-catalog";
import type { ReconstruccionAgregados, VadEstadoCount, VadSummary } from "@/lib/types";

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
  }
  return -1;
}

function isEliminadoPlaceholder(value: string): boolean {
  return value.trim().toUpperCase().startsWith("ELIMINADO");
}

async function fetchCsvText(url: string): Promise<string> {
  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { Accept: "text/csv,text/plain,*/*" },
  });
  if (!response.ok) throw new Error(`CSV fetch failed: ${response.status}`);
  const text = await response.text();
  if (text.includes("<!DOCTYPE html")) {
    throw new Error("CSV fetch returned HTML instead of data");
  }
  return text;
}

function countEliminadosEnPublico(csvText: string): {
  totalRegistros: number;
  totalEliminados: number;
} {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { totalRegistros: 0, totalEliminados: 0 };

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const nombreCol = findColumn(headers, ["nombre"]);
  if (nombreCol < 0) return { totalRegistros: lines.length - 1, totalEliminados: 0 };

  let totalEliminados = 0;
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    if (isEliminadoPlaceholder(cols[nombreCol] ?? "")) totalEliminados += 1;
  }

  return { totalRegistros: lines.length - 1, totalEliminados };
}

function aggregateBorrados(csvText: string): {
  totalBorrados: number;
  borradosConEstado: number;
  porEstado: VadEstadoCount[];
} {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { totalBorrados: 0, borradosConEstado: 0, porEstado: [] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const entidadCol = findColumn(headers, ["entidad_hechos", "entidad", "estado"]);
  if (entidadCol < 0) {
    return { totalBorrados: lines.length - 1, borradosConEstado: 0, porEstado: [] };
  }

  const buckets = new Map<string, number>();
  for (const state of STATE_CATALOG) buckets.set(state.id, 0);

  let borradosConEstado = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const entidadRaw = cols[entidadCol] ?? "";
    if (!entidadRaw || entidadRaw.toUpperCase() === "SE DESCONOCE") continue;

    const state = normalizeStateName(entidadRaw);
    if (!state) continue;

    borradosConEstado += 1;
    buckets.set(state.id, (buckets.get(state.id) ?? 0) + 1);
  }

  const porEstado = STATE_CATALOG.map((state) => ({
    estadoId: state.id,
    nombre: state.nombre,
    borrados: buckets.get(state.id) ?? 0,
  }))
    .filter((item) => item.borrados > 0)
    .sort((a, b) => b.borrados - a.borrados);

  return {
    totalBorrados: lines.length - 1,
    borradosConEstado,
    porEstado,
  };
}

function buildDatasetList() {
  return VAD_DATASETS.map((dataset) => ({
    ...dataset,
    usedInRastro:
      dataset.id === "reconstruccion_2017_2024" ? true : dataset.usedInRastro,
  }));
}

async function loadReconstruccionAgregados(): Promise<ReconstruccionAgregados | null> {
  try {
    if (RECONSTRUCCION_AGGREGADOS_URL.startsWith("http")) {
      const response = await fetch(RECONSTRUCCION_AGGREGADOS_URL, {
        next: { revalidate: 86400 },
      });
      if (!response.ok) throw new Error("Reconstruccion agregados unavailable");
      return (await response.json()) as ReconstruccionAgregados;
    }

    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    const filePath = join(process.cwd(), "public", RECONSTRUCCION_AGGREGADOS_URL.replace(/^\//, ""));
    const text = await readFile(filePath, "utf-8");
    return JSON.parse(text) as ReconstruccionAgregados;
  } catch {
    return null;
  }
}

export function getMockVadSummary(): VadSummary {
  return {
    totalBorrados: 10953,
    borradosConEstado: 10666,
    totalEliminadosEnPublico: 37459,
    totalRegistrosPublico: 116945,
    porEstado: [
      { estadoId: "MX-CDM", nombre: "Ciudad de México", borrados: 1530 },
      { estadoId: "MX-MEX", nombre: "Estado de México", borrados: 1155 },
      { estadoId: "MX-VER", nombre: "Veracruz", borrados: 854 },
      { estadoId: "MX-TAM", nombre: "Tamaulipas", borrados: 683 },
      { estadoId: "MX-MIC", nombre: "Michoacán", borrados: 632 },
      { estadoId: "MX-NLE", nombre: "Nuevo León", borrados: 613 },
      { estadoId: "MX-GRO", nombre: "Guerrero", borrados: 550 },
      { estadoId: "MX-SIN", nombre: "Sinaloa", borrados: 480 },
    ],
    datasets: buildDatasetList(),
    platformUrl: DATACIVICA.site,
    buscadorUrl: DATACIVICA.buscador,
    reconstruccion2017_2024: {
      publishedAt: "2024-03-19",
      source: "Data Cívica (referencial)",
      note: "Agregados de referencia para comparación.",
      totalRegistros: 139000,
      porEstado: STATE_CATALOG.slice(0, 8).map((state, index) => ({
        estadoId: state.id,
        nombre: state.nombre,
        total: 15000 - index * 900,
      })),
    },
  };
}

export async function fetchVadSummary(
  borradosUrl: string,
  rnpdnoUrl: string,
): Promise<{ summary: VadSummary; usedMock: boolean }> {
  try {
    const [borradosText, publicoText] = await Promise.all([
      fetchCsvText(borradosUrl),
      fetchCsvText(rnpdnoUrl),
    ]);

    const borrados = aggregateBorrados(borradosText);
    if (borrados.totalBorrados === 0) {
      throw new Error("Borrados CSV parse returned 0 records");
    }

    const publico = countEliminadosEnPublico(publicoText);
    const records = parseRnpdnoCsv(publicoText);
    if (records.length === 0) {
      throw new Error("RNPDNO CSV parse returned 0 records for VAD cross-check");
    }

    const reconstruccion2017_2024 = await loadReconstruccionAgregados();

    return {
      summary: {
        ...borrados,
        totalEliminadosEnPublico: publico.totalEliminados,
        totalRegistrosPublico: publico.totalRegistros,
        datasets: buildDatasetList(),
        platformUrl: DATACIVICA.site,
        buscadorUrl: DATACIVICA.buscador,
        reconstruccion2017_2024: reconstruccion2017_2024 ?? undefined,
      },
      usedMock: false,
    };
  } catch {
    return { summary: getMockVadSummary(), usedMock: true };
  }
}

export async function fetchVadSummaryDefault(): Promise<{
  summary: VadSummary;
  usedMock: boolean;
}> {
  return fetchVadSummary(VAD_BORRADOS_CSV_URL, RNPDNO_CSV_URL);
}
