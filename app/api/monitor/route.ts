import { timingSafeEqual } from "node:crypto";
import { jsonResponse, NO_INDEX_HEADERS, tooManyRequests } from "@/lib/api-response";
import { MONITOR_TOKEN } from "@/lib/config";
import { runMonitorCheck } from "@/lib/monitoring/alerts";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

function presentedToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  return request.headers.get("x-rastro-token")?.trim() ?? "";
}

/**
 * The webhook only fires when RASTRO_MONITOR_TOKEN is configured and the request
 * presents it. Without a configured token no request can trigger it.
 */
function mayTriggerWebhook(request: Request): boolean {
  if (!MONITOR_TOKEN) return false;
  const expected = Buffer.from(MONITOR_TOKEN);
  const received = Buffer.from(presentedToken(request));
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  try {
    if (!checkRateLimit(`monitor:${clientKey(request)}`, 6, 60_000)) {
      return tooManyRequests("Demasiadas consultas al monitor. Intente de nuevo en un minuto.");
    }

    const { searchParams } = new URL(request.url);
    const sendWebhook = searchParams.get("webhook") !== "false" && mayTriggerWebhook(request);
    const result = await runMonitorCheck(sendWebhook);
    return jsonResponse(result, { headers: NO_INDEX_HEADERS });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Monitor error" },
      { status: 500, headers: NO_INDEX_HEADERS },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
