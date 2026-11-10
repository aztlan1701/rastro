import { buildMeta, jsonResponseNoIndex as jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL, DATACIVICA } from "@/lib/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { getInconsistencies } from "@/lib/search/inconsistencies";
import { STATE_CATALOG } from "@/lib/state-catalog";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function GET(request: Request) {
  try {
    const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (!(await checkRateLimit(`inconsistencias:${client}`, 30, 60_000))) {
      return jsonResponse(
        { error: "Demasiadas consultas. Intente de nuevo en un minuto." },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    // Clamp para evitar respuestas gigantes (DoS) y claves de caché ilimitadas.
    const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;
    // Solo aceptar estadoId del catálogo para acotar las claves de caché.
    const estadoIdParam = searchParams.get("estadoId") ?? undefined;
    const estadoId =
      estadoIdParam && STATE_CATALOG.some((state) => state.id === estadoIdParam)
        ? estadoIdParam
        : undefined;

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
