import { fetchRnpdnoEstados } from "@/lib/aggregators/rnpdno";
import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL, RNPDNO_CSV_URL } from "@/lib/config";
import { buildMunicipioPoints } from "@/lib/geo/choropleth";

export async function GET() {
  try {
    const entry = await withCache(
      "rnpdno",
      CACHE_TTL.rnpdno,
      CACHE_STALE.rnpdno,
      async () => {
        const result = await fetchRnpdnoEstados(RNPDNO_CSV_URL);
        return {
          data: result,
          status: result.usedMock ? ("mock" as const) : ("live" as const),
          source: result.usedMock ? "mock-data" : RNPDNO_CSV_URL,
        };
      },
    );

    const { estados, records, usedMock } = entry.data;
    const municipios = buildMunicipioPoints(records);

    return jsonResponse({
      estados,
      municipios,
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
