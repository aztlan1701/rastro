import { readFile } from "node:fs/promises";
import path from "node:path";
import { STATE_CATALOG, normalizeStateName } from "@/lib/state-catalog";
import type { EstadoData } from "@/lib/types";

/**
 * Snapshot de agregados del tablero estadístico público del RNPDNO (CNB).
 * Generado por `scripts/rnpdno_ingest.py`. Solo agregados — no microdatos nominales.
 *
 * Campos que el tablero no entrega (p. ej. `nuevos30d`, `municipioAlto`) se dejan
 * en valores honestos (0 / "") en lugar de inventar cifras.
 */

export const RNPDNO_AGREGADOS_PATH = path.join(
  process.cwd(),
  "public/data/rnpdno-agregados.json",
);

export const RNPDNO_AGREGADOS_PUBLIC_URL = "/data/rnpdno-agregados.json";

const INEGI_TO_STATE_ID: Record<string, string> = {
  "01": "MX-AGU",
  "02": "MX-BCN",
  "03": "MX-BCS",
  "04": "MX-CAM",
  "05": "MX-COA",
  "06": "MX-COL",
  "07": "MX-CHP",
  "08": "MX-CHH",
  "09": "MX-CDM",
  "10": "MX-DUR",
  "11": "MX-GUA",
  "12": "MX-GRO",
  "13": "MX-HID",
  "14": "MX-JAL",
  "15": "MX-MEX",
  "16": "MX-MIC",
  "17": "MX-MOR",
  "18": "MX-NAY",
  "19": "MX-NLE",
  "20": "MX-OAX",
  "21": "MX-PUE",
  "22": "MX-QUE",
  "23": "MX-ROO",
  "24": "MX-SLP",
  "25": "MX-SIN",
  "26": "MX-SON",
  "27": "MX-TAB",
  "28": "MX-TAM",
  "29": "MX-TLA",
  "30": "MX-VER",
  "31": "MX-YUC",
  "32": "MX-ZAC",
};

export interface RnpdnoAgregadosProcedencia {
  fuente: string;
  proveedor: string;
  url: string;
  metodo: string;
  consultado_utc: string;
  desfase_declarado_por_la_fuente: string;
  alcance: string;
  peticiones_realizadas: number;
}

export interface SeriePorCategoria {
  serie: string;
  valores: Array<{ categoria: string; personas: number | null }>;
}

/** Universo de un bloque del snapshot: quiénes cuentan en sus cifras. */
export type UniversoRnpdno = "desaparecidas_y_no_localizadas" | "todos_los_registros";

export interface RnpdnoAgregadosSnapshot {
  procedencia: RnpdnoAgregadosProcedencia;
  datos: {
    totales?: Record<string, number | null>;
    por_entidad?: Array<{
      clave_inegi: string | null;
      clave_tablero: string;
      entidad: string;
      personas: number | null;
    }>;
    /** Todos los registros de la entidad, incluidas las personas localizadas. */
    por_entidad_y_sexo?: SeriePorCategoria[];
    /** Solo personas desaparecidas y no localizadas (ingestas posteriores a nov. 2026). */
    por_entidad_y_sexo_desaparecidas?: SeriePorCategoria[];
    por_anio_y_sexo?: unknown;
    por_rango_edad_y_sexo?: unknown;
    por_municipio?: Array<{
      clave_inegi: string;
      id_tablero_estado: string;
      entidad: string;
      municipios: Array<{
        nombre: string;
        personas: number | null;
        cvegeo: string | null;
      }>;
      sin_match?: string[];
      nota?: string;
      /** Ausente en snapshots antiguos, que se pidieron sin filtro de estatus. */
      universo?: UniversoRnpdno;
    }>;
  };
  bloques_no_obtenidos?: Record<string, string>;
}

export interface RnpdnoLiveResult {
  estados: EstadoData[];
  totales: Record<string, number | null>;
  procedencia: RnpdnoAgregadosProcedencia;
  usedMock: boolean;
}

function sexoMapFromSeries(
  series: RnpdnoAgregadosSnapshot["datos"]["por_entidad_y_sexo"],
): Map<string, { mujeres: number; hombres: number; noEspecificado: number }> {
  const map = new Map<string, { mujeres: number; hombres: number; noEspecificado: number }>();

  if (!series) return map;

  for (const serie of series) {
    const name = (serie.serie ?? "").toLowerCase();
    const field =
      name.includes("mujer") || name.includes("femen")
        ? "mujeres"
        : name.includes("hombre") || name.includes("mascul")
          ? "hombres"
          : "noEspecificado";

    for (const valor of serie.valores ?? []) {
      const state = normalizeStateName(valor.categoria ?? "");
      if (!state) continue;
      const current = map.get(state.id) ?? { mujeres: 0, hombres: 0, noEspecificado: 0 };
      current[field] += valor.personas ?? 0;
      map.set(state.id, current);
    }
  }

  return map;
}

export function mapAgregadosToEstados(snapshot: RnpdnoAgregadosSnapshot): EstadoData[] {
  // Dos universos distintos: `por_entidad` cuenta personas desaparecidas y no
  // localizadas; `por_entidad_y_sexo` cuenta todos los registros (incluye
  // localizadas). No deben mezclarse sin rotularlos.
  const sexoTodos = sexoMapFromSeries(snapshot.datos.por_entidad_y_sexo);
  const sexoDesaparecidas = sexoMapFromSeries(snapshot.datos.por_entidad_y_sexo_desaparecidas);
  const haySexoDesaparecidas = sexoDesaparecidas.size > 0;
  const sexoPorEstado = haySexoDesaparecidas ? sexoDesaparecidas : sexoTodos;
  const estados: EstadoData[] = [];

  for (const fila of snapshot.datos.por_entidad ?? []) {
    if (!fila.clave_inegi) continue;
    const stateId = INEGI_TO_STATE_ID[fila.clave_inegi];
    const catalog = STATE_CATALOG.find((item) => item.id === stateId);
    if (!catalog) continue;

    const sexo = sexoPorEstado.get(catalog.id) ?? {
      mujeres: 0,
      hombres: 0,
      noEspecificado: 0,
    };

    const total = fila.personas ?? 0;

    // Localizadas = todos los registros de la entidad − desaparecidas y no
    // localizadas. A nivel nacional la resta reproduce el total que publica el
    // tablero; si falta el bloque o la resta no es coherente, queda sin dato.
    const todos = sexoTodos.get(catalog.id);
    const registros = todos ? todos.mujeres + todos.hombres + todos.noEspecificado : null;
    const localizados = registros !== null && registros >= total ? registros - total : null;

    estados.push({
      id: catalog.id,
      nombre: catalog.nombre,
      lat: catalog.lat,
      lng: catalog.lng,
      total,
      // El tablero agregado no publica “nuevos 30 días” ni municipio alto.
      nuevos30d: null,
      localizados,
      mujeres: sexo.mujeres,
      hombres: sexo.hombres,
      noEspecificado: sexo.noEspecificado,
      sexoUniverso: haySexoDesaparecidas ? "desaparecidas" : "todos",
      municipioAlto: "",
    });
  }

  return estados.sort((a, b) => b.total - a.total);
}

export async function loadRnpdnoAgregadosSnapshot(): Promise<RnpdnoAgregadosSnapshot> {
  const raw = await readFile(RNPDNO_AGREGADOS_PATH, "utf8");
  return JSON.parse(raw) as RnpdnoAgregadosSnapshot;
}

export async function fetchRnpdnoLiveEstados(): Promise<RnpdnoLiveResult> {
  try {
    const snapshot = await loadRnpdnoAgregadosSnapshot();
    const estados = mapAgregadosToEstados(snapshot);
    if (estados.length === 0) {
      throw new Error("RNPDNO live snapshot produced 0 states");
    }

    return {
      estados,
      totales: snapshot.datos.totales ?? {},
      procedencia: snapshot.procedencia,
      usedMock: false,
    };
  } catch {
    const { ESTADOS_DATA } = await import("@/lib/mock-data");
    return {
      estados: ESTADOS_DATA,
      totales: {},
      procedencia: {
        fuente: "mock-data",
        proveedor: "RASTRO",
        url: RNPDNO_AGREGADOS_PUBLIC_URL,
        metodo: "Fallback mock (snapshot de agregados no disponible)",
        consultado_utc: new Date(0).toISOString(),
        desfase_declarado_por_la_fuente: "n/a",
        alcance: "Mock",
        peticiones_realizadas: 0,
      },
      usedMock: true,
    };
  }
}
