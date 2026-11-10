import { jsonResponse } from "@/lib/api-response";
import { MONITOR_TOKEN } from "@/lib/config";
import { runMonitorCheck } from "@/lib/monitoring/alerts";
import { checkRateLimit } from "@/lib/rate-limit";

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/** Lee el token del header Authorization: Bearer o del parámetro ?token=. */
function providedToken(request: Request, searchParams: URLSearchParams): string {
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return bearer || (searchParams.get("token") ?? "");
}

export async function GET(request: Request) {
  try {
    // Esta ruta dispara fetches salientes y, potencialmente, un webhook.
    // La limitamos para evitar abuso/amplificación desde peticiones anónimas.
    if (!(await checkRateLimit(`monitor:${clientKey(request)}`, 6, 60_000))) {
      return jsonResponse(
        { error: "Demasiadas solicitudes. Intente de nuevo en un minuto." },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);

    // El webhook solo se dispara si hay un token configurado y coincide. Sin
    // token configurado, nunca se dispara desde una petición pública.
    const authorized =
      MONITOR_TOKEN.length > 0 && providedToken(request, searchParams) === MONITOR_TOKEN;
    const wantsWebhook = searchParams.get("webhook") !== "false";
    const sendWebhook = authorized && wantsWebhook;

    const result = await runMonitorCheck(sendWebhook);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Monitor error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
