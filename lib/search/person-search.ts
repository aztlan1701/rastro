import { RNPDNO_CSV_URL, VAD_BORRADOS_CSV_URL } from "@/lib/config";
import { normalizeStateName } from "@/lib/state-catalog";
import type { PersonSearchFilters, PersonSearchResult } from "@/lib/types";

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

interface IndexedPerson {
  id: string;
  source: PersonSearchResult["source"];
  nombreCompleto: string;
  edad: string;
  sexo: string;
  entidad: string;
  estadoId?: string;
  fecha: string;
  eliminado: boolean;
  searchText: string;
}

export interface PersonSearchResponse {
  results: PersonSearchResult[];
  total: number;
  query: string;
  usedMock: boolean;
}

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
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const exact = headers.indexOf(candidate);
    if (exact >= 0) return exact;

    const partial = headers.findIndex(
      (header) => header.startsWith(candidate) || header.includes(candidate),
    );
    if (partial >= 0) return partial;
  }
  return -1;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeQuery(query: string): string[] {
  return normalizeSearchText(query)
    .split(" ")
    .filter((token) => token.length >= MIN_QUERY_LENGTH);
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

function parsePublicPersons(csvText: string): IndexedPerson[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const nombreCol = findColumn(headers, ["nombre"]);
  const apellido1Col = findColumn(headers, ["primer_apellido"]);
  const apellido2Col = findColumn(headers, ["segundo_apellido"]);
  const edadCol = findColumn(headers, ["edad"]);
  const sexoCol = findColumn(headers, ["sexo"]);
  const entidadCol = findColumn(headers, ["entidad_de_desaparici", "entidad", "estado"]);
  const fechaCol = findColumn(headers, ["fecha_de_desaparici", "fecha"]);
  const consecutivoCol = findColumn(headers, ["consecutivo_registro", "consecutivo"]);

  if (nombreCol < 0) return [];

  const people: IndexedPerson[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const nombre = cols[nombreCol] ?? "";
    const primerApellido = apellido1Col >= 0 ? cols[apellido1Col] ?? "" : "";
    const segundoApellido = apellido2Col >= 0 ? cols[apellido2Col] ?? "" : "";
    const eliminado = isEliminadoPlaceholder(nombre);
    const nombreCompleto = eliminado
      ? "Registro enmascarado (ELIMINADO)"
      : [nombre, primerApellido, segundoApellido].filter(Boolean).join(" ").trim();

    if (!nombreCompleto) continue;

    const entidadRaw = entidadCol >= 0 ? cols[entidadCol] ?? "" : "";
    const state = entidadRaw ? normalizeStateName(entidadRaw) : null;
    const searchText = normalizeSearchText(
      eliminado ? "eliminado enmascarado registro" : nombreCompleto,
    );

    people.push({
      id: `rnpdno-${cols[consecutivoCol] ?? i}`,
      source: "rnpdno_publico",
      nombreCompleto,
      edad: edadCol >= 0 ? cols[edadCol] ?? "" : "",
      sexo: sexoCol >= 0 ? cols[sexoCol] ?? "" : "",
      entidad: state?.nombre ?? entidadRaw,
      estadoId: state?.id,
      fecha: fechaCol >= 0 ? cols[fechaCol] ?? "" : "",
      eliminado,
      searchText,
    });
  }

  return people;
}

function parseBorradosPersons(csvText: string): IndexedPerson[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const nombresCol = findColumn(headers, ["nombres", "nombre"]);
  const entidadCol = findColumn(headers, ["entidad_hechos", "entidad"]);
  const sexoCol = findColumn(headers, ["sexo"]);
  const fechaCol = findColumn(headers, ["fecha_hechos", "fecha"]);
  const edadCol = findColumn(headers, ["edad"]);
  const consecutivoCol = findColumn(headers, ["consecutivo_json", "consecutivo"]);

  if (nombresCol < 0) return [];

  const people: IndexedPerson[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const nombreCompleto = (cols[nombresCol] ?? "").trim();
    if (!nombreCompleto) continue;

    const entidadRaw = entidadCol >= 0 ? cols[entidadCol] ?? "" : "";
    const state =
      entidadRaw && entidadRaw.toUpperCase() !== "SE DESCONOCE"
        ? normalizeStateName(entidadRaw)
        : null;

    people.push({
      id: `borrado-${cols[consecutivoCol] ?? i}`,
      source: "nombre_borrado",
      nombreCompleto,
      edad: edadCol >= 0 ? cols[edadCol] ?? "" : "",
      sexo: sexoCol >= 0 ? cols[sexoCol] ?? "" : "",
      entidad: state?.nombre ?? (entidadRaw || "Se desconoce"),
      estadoId: state?.id,
      fecha: fechaCol >= 0 ? cols[fechaCol] ?? "" : "",
      eliminado: false,
      searchText: normalizeSearchText(nombreCompleto),
    });
  }

  return people;
}

function getMockIndex(): { people: IndexedPerson[]; usedMock: true } {
  const people: IndexedPerson[] = [
    {
      id: "mock-rnpdno-1",
      source: "rnpdno_publico",
      nombreCompleto: "SOFIA RAMIREZ MARTINEZ",
      edad: "14",
      sexo: "MUJER",
      entidad: "Jalisco",
      estadoId: "MX-JAL",
      fecha: "05/06/2026",
      eliminado: false,
      searchText: normalizeSearchText("SOFIA RAMIREZ MARTINEZ"),
    },
    {
      id: "mock-borrado-1",
      source: "nombre_borrado",
      nombreCompleto: "MELCHOR BENITEZ ONOFRE",
      edad: "",
      sexo: "HOMBRE",
      entidad: "Se desconoce",
      fecha: "",
      eliminado: false,
      searchText: normalizeSearchText("MELCHOR BENITEZ ONOFRE"),
    },
    {
      id: "mock-borrado-2",
      source: "nombre_borrado",
      nombreCompleto: "LUZ ADRIANA NORIEGA NEGRETE",
      edad: "18",
      sexo: "INDETERMINADO",
      entidad: "Se desconoce",
      fecha: "",
      eliminado: false,
      searchText: normalizeSearchText("LUZ ADRIANA NORIEGA NEGRETE"),
    },
  ];

  return { people, usedMock: true };
}

let indexPromise: Promise<{ people: IndexedPerson[]; usedMock: boolean }> | null = null;

async function loadSearchIndex(): Promise<{ people: IndexedPerson[]; usedMock: boolean }> {
  if (!indexPromise) {
    indexPromise = (async () => {
      try {
        const [publicoText, borradosText] = await Promise.all([
          fetchCsvText(RNPDNO_CSV_URL),
          fetchCsvText(VAD_BORRADOS_CSV_URL),
        ]);

        const people = [...parsePublicPersons(publicoText), ...parseBorradosPersons(borradosText)];
        if (people.length === 0) throw new Error("Search index empty");

        return { people, usedMock: false };
      } catch {
        return getMockIndex();
      }
    })();
  }

  return indexPromise;
}

export async function getSearchIndex() {
  return loadSearchIndex();
}

function matchesFilters(person: IndexedPerson, filters?: PersonSearchFilters): boolean {
  if (!filters) return true;

  if (filters.source && filters.source !== "all") {
    if (filters.source === "eliminado" && !person.eliminado) return false;
    if (filters.source !== "eliminado" && person.source !== filters.source) return false;
  }

  if (filters.estadoId && person.estadoId !== filters.estadoId) return false;

  if (filters.sexo) {
    const needle = filters.sexo.toLowerCase();
    if (!person.sexo.toLowerCase().includes(needle)) return false;
  }

  return true;
}

function toResult(person: IndexedPerson): PersonSearchResult {
  return {
    id: person.id,
    source: person.source,
    nombreCompleto: person.nombreCompleto,
    edad: person.edad || undefined,
    sexo: person.sexo || undefined,
    entidad: person.entidad || undefined,
    estadoId: person.estadoId,
    fecha: person.fecha || undefined,
    eliminado: person.eliminado || undefined,
  };
}

function rankMatch(person: IndexedPerson, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  let score = 0;
  for (const token of tokens) {
    if (person.searchText.startsWith(token)) score += 3;
    else if (person.searchText.includes(` ${token}`)) score += 2;
    else if (person.searchText.includes(token)) score += 1;
  }

  if (person.source === "nombre_borrado") score += 0.5;
  return score;
}

export async function searchPersonRecords(
  query: string,
  limit = DEFAULT_LIMIT,
  filters?: PersonSearchFilters,
): Promise<PersonSearchResponse> {
  const tokens = tokenizeQuery(query);
  const cappedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

  if (tokens.length === 0) {
    return { results: [], total: 0, query, usedMock: false };
  }

  const { people, usedMock } = await loadSearchIndex();

  const matches = people
    .filter((person) => matchesFilters(person, filters))
    .map((person) => ({ person, score: rankMatch(person, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.person.nombreCompleto.localeCompare(b.person.nombreCompleto));

  return {
    results: matches.slice(0, cappedLimit).map((item) => toResult(item.person)),
    total: matches.length,
    query,
    usedMock,
  };
}

export { MIN_QUERY_LENGTH, DEFAULT_LIMIT, MAX_LIMIT };
