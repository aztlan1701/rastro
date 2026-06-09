import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL, DATACIVICA } from "@/lib/config";
import { checkRateLimit } from "@/lib/rate-limit";
import type { PersonSearchFilters } from "@/lib/types";
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_QUERY_LENGTH,
  searchPersonRecords,
} from "@/lib/search/person-search";

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function GET(request: Request) {
  try {
    if (!checkRateLimit(`buscar:${clientKey(request)}`, 30, 60_000)) {
      return jsonResponse({ error: "Demasiadas búsquedas. Intente de nuevo en un minuto." }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") ?? "").trim();
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const filters: PersonSearchFilters = {
      source: (searchParams.get("source") as PersonSearchFilters["source"]) ?? "all",
      estadoId: searchParams.get("estadoId") ?? undefined,
      sexo: searchParams.get("sexo") ?? undefined,
    };

    if (query.length < MIN_QUERY_LENGTH) {
      return jsonResponse({
        results: [],
        total: 0,
        query,
        meta: buildMeta("live", Date.now(), DATACIVICA.site),
        error: `La búsqueda requiere al menos ${MIN_QUERY_LENGTH} caracteres`,
      });
    }

    const cacheKey = `buscar:${query.toLowerCase()}:${limit}:${JSON.stringify(filters)}`;

    const entry = await withCache(
      cacheKey,
      CACHE_TTL.rnpdno,
      CACHE_STALE.rnpdno,
      async () => {
        const result = await searchPersonRecords(query, limit, filters);
        return {
          data: result,
          status: result.usedMock ? ("mock" as const) : ("live" as const),
          source: result.usedMock ? "mock-data" : DATACIVICA.site,
        };
      },
    );

    const { results, total, query: normalizedQuery, usedMock } = entry.data;

    return jsonResponse({
      results,
      total,
      query: normalizedQuery,
      meta: buildMeta(entry.status, entry.fetchedAt, entry.source),
      mock: usedMock,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Search error" },
      { status: 500 },
    );
  }
}
