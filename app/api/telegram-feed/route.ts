import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL } from "@/lib/config";
import { fetchTelegramFeed } from "@/lib/feeds/telegram";

export async function GET() {
  try {
    const entry = await withCache(
      "telegram",
      CACHE_TTL.telegram,
      CACHE_STALE.telegram,
      async () => {
        const result = await fetchTelegramFeed();
        return {
          data: result,
          status: result.usedMock ? ("mock" as const) : ("live" as const),
          source: result.usedMock ? "none" : "t.me/s",
        };
      },
    );

    return jsonResponse({
      posts: entry.data.posts,
      meta: buildMeta(entry.status, entry.fetchedAt, entry.source),
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Telegram error" },
      { status: 500 },
    );
  }
}
