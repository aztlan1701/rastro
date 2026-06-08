import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL } from "@/lib/config";
import { fetchAmberAlerts } from "@/lib/feeds/amber";

export async function GET() {
  try {
    const entry = await withCache(
      "amber",
      CACHE_TTL.amber,
      CACHE_STALE.amber,
      async () => {
        const result = await fetchAmberAlerts();
        return {
          data: result,
          status: result.usedMock ? ("mock" as const) : ("live" as const),
          source: result.usedMock ? "mock-data" : "alertaamber.fgr.org.mx",
        };
      },
    );

    return jsonResponse({
      alertas: entry.data.alertas,
      meta: buildMeta(entry.status, entry.fetchedAt, entry.source),
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "AMBER error" },
      { status: 500 },
    );
  }
}
