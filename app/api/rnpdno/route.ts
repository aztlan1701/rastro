import { fetchRnpdnoLiveEstados } from "@/lib/aggregators/rnpdno-live";
import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL } from "@/lib/config";

/**
 * Agregados territoriales del RNPDNO.
 *
 * Capa viva: snapshot del tablero estadístico CNB (`public/data/rnpdno-agregados.json`),
 * regenerable con `scripts/rnpdno_ingest.py`.
 *
 * Municipios: ver `GET /api/rnpdno/municipios?estado=` (CSV sep-2023 + CVEGEO).
 * Esta ruta mantiene `municipios: []` a propósito.
 */
export async function GET() {
  try {
    const entry = await withCache(
      "rnpdno-live",
      CACHE_TTL.rnpdno,
      CACHE_STALE.rnpdno,
      async () => {
        const result = await fetchRnpdnoLiveEstados();
        return {
          data: result,
          status: result.usedMock ? ("mock" as const) : ("live" as const),
          source: result.usedMock
            ? "mock-data"
            : `cnb-tablero-agregados@${result.procedencia.consultado_utc}`,
        };
      },
    );

    const { estados, totales, procedencia, usedMock } = entry.data;

    return jsonResponse({
      estados,
      /** El snapshot de agregados no incluye municipios; la capa queda vacía a propósito. */
      municipios: [],
      totales,
      procedencia,
      meta: buildMeta(entry.status, entry.fetchedAt, entry.source),
      mock: usedMock,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "RNPDNO error" },
      { status: 500 },
    );
  }
}
