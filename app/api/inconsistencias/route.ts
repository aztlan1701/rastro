import { buildMeta, jsonResponse, NO_INDEX_HEADERS, tooManyRequests } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL, DATACIVICA } from "@/lib/config";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { getInconsistencies } from "@/lib/search/inconsistencies";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
    if (!checkRateLimit(`inconsistencias:${clientKey(request)}`, 30, 60_000)) {
      return tooManyRequests("Demasiadas consultas. Intente de nuevo en un minuto.");
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;
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

    return jsonResponse(
      {
        ...entry.data,
        meta: buildMeta(entry.status, entry.fetchedAt, entry.source),
      },
      { headers: NO_INDEX_HEADERS },
    );
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Inconsistencias error" },
      { status: 500, headers: NO_INDEX_HEADERS },
    );
  }
}
