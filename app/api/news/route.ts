import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL } from "@/lib/config";
import { fetchRssNews } from "@/lib/feeds/rss";

export async function GET() {
  try {
    const entry = await withCache(
      "news",
      CACHE_TTL.news,
      CACHE_STALE.news,
      async () => {
        const result = await fetchRssNews();
        return {
          data: result,
          status: result.usedMock ? ("mock" as const) : ("live" as const),
          source: result.usedMock ? "mock-data" : "rss",
        };
      },
    );

    return jsonResponse({
      noticias: entry.data.items,
      meta: buildMeta(entry.status, entry.fetchedAt, entry.source),
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "News error" },
      { status: 500 },
    );
  }
}
