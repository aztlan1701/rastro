import { buildMeta, jsonResponse, NO_INDEX_HEADERS, tooManyRequests } from "@/lib/api-response";
import { DATACIVICA } from "@/lib/config";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import type { PersonSearchFilters } from "@/lib/types";
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  MIN_QUERY_LENGTH,
  searchPersonRecords,
} from "@/lib/search/person-search";

export async function GET(request: Request) {
  try {
    if (!checkRateLimit(`buscar:${clientKey(request)}`, 30, 60_000)) {
      return tooManyRequests("Demasiadas búsquedas. Intente de nuevo en un minuto.");
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
      }, { headers: NO_INDEX_HEADERS });
    }

    // Queries are answered from the in-memory index and never cached or logged.
    const { results, total, query: normalizedQuery, usedMock } = await searchPersonRecords(
      query,
      limit,
      filters,
    );

    return jsonResponse({
      results,
      total,
      query: normalizedQuery,
      meta: buildMeta(usedMock ? "mock" : "live", Date.now(), usedMock ? "mock-data" : DATACIVICA.site),
      mock: usedMock,
    }, { headers: NO_INDEX_HEADERS });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Search error" },
      { status: 500, headers: NO_INDEX_HEADERS },
    );
  }
}
