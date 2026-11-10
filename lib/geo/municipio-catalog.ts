import { readFile } from "node:fs/promises";
import path from "node:path";

export interface MunicipioCatalogEntry {
  cvegeo: string;
  nombre: string;
  cve_ent: string;
}

export interface MunicipioCatalogFile {
  fuente: string;
  url: string;
  simplify_tolerance_deg?: number;
  total: number;
  municipios: MunicipioCatalogEntry[];
}

export const MUNICIPIOS_CATALOGO_PATH = path.join(
  process.cwd(),
  "public/data/municipios-catalogo.json",
);

export function normalizeMunicipioName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(municipio|alcaldia|delegacion)\s+(de\s+)?/g, "")
    .replace(/\b(cd\.?|ciudad)\s+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function loadMunicipioCatalog(): Promise<MunicipioCatalogFile> {
  const text = await readFile(MUNICIPIOS_CATALOGO_PATH, "utf8");
  return JSON.parse(text) as MunicipioCatalogFile;
}

/** Índice nombre normalizado → entrada, limitado a una entidad. */
export function buildMunicipioNameIndex(
  catalog: MunicipioCatalogEntry[],
  cveEnt: string,
): Map<string, MunicipioCatalogEntry> {
  const index = new Map<string, MunicipioCatalogEntry>();
  for (const entry of catalog) {
    if (entry.cve_ent !== cveEnt) continue;
    const key = normalizeMunicipioName(entry.nombre);
    if (!key) continue;
    // Primera coincidencia gana; nombres duplicados dentro de entidad son raros.
    if (!index.has(key)) index.set(key, entry);
  }
  return index;
}
