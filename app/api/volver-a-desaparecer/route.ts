import { fetchVadSummaryDefault } from "@/lib/aggregators/volver-a-desaparecer";
import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL, DATACIVICA } from "@/lib/config";

export async function GET() {
  try {
    const entry = await withCache(
      "vad",
      CACHE_TTL.vad,
      CACHE_STALE.vad,
      async () => {
        const result = await fetchVadSummaryDefault();
        return {
          data: result,
          status: result.usedMock ? ("mock" as const) : ("live" as const),
          source: result.usedMock ? "mock-data" : DATACIVICA.site,
        };
      },
    );

    const { summary, usedMock } = entry.data;

    return jsonResponse({
      summary,
      meta: buildMeta(entry.status, entry.fetchedAt, entry.source),
      mock: usedMock,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "VAD error" },
      { status: 500 },
    );
  }
}
