import { getRnpdnoCached } from "@/lib/aggregators/rnpdno";
import { buildMeta, jsonResponse } from "@/lib/api-response";
import { buildMunicipioPoints } from "@/lib/geo/choropleth";

export async function GET() {
  try {
    const entry = await getRnpdnoCached();

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
