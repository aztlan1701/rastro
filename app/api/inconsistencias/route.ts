import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL, DATACIVICA } from "@/lib/config";
import { getInconsistencies } from "@/lib/search/inconsistencies";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") ?? "50", 10);
    const estadoId = searchParams.get("estadoId") ?? undefined;

    const entry = await withCache(
      `inconsistencias:${estadoId ?? "all"}:${limit}`,
      CACHE_TTL.vad,
      CACHE_STALE.vad,
      async () => {
        const result = await getInconsistencies(limit, estadoId);
        return {
          data: result,
          status: result.usedMock ? ("mock" as const) : ("live" as const),
          source: DATACIVICA.site,
        };
      },
    );

    return jsonResponse({
      ...entry.data,
      meta: buildMeta(entry.status, entry.fetchedAt, entry.source),
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Inconsistencias error" },
      { status: 500 },
    );
  }
}
