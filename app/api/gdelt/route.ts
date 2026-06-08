import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL } from "@/lib/config";
import { fetchGdeltNews } from "@/lib/feeds/gdelt";

export async function GET() {
  try {
    const entry = await withCache(
      "gdelt",
      CACHE_TTL.gdelt,
      CACHE_STALE.gdelt,
      async () => {
        const result = await fetchGdeltNews();
        return {
          data: result,
          status: result.usedMock ? ("mock" as const) : ("live" as const),
          source: result.usedMock ? "none" : "gdeltproject.org",
        };
      },
    );

    return jsonResponse({
      noticias: entry.data.items,
      meta: buildMeta(entry.status, entry.fetchedAt, entry.source),
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "GDELT error" },
      { status: 500 },
    );
  }
}
