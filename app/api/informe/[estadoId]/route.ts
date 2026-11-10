import { getRnpdnoCached } from "@/lib/aggregators/rnpdno";
import { fetchVadSummaryDefault } from "@/lib/aggregators/volver-a-desaparecer";
import { NO_INDEX_HEADERS } from "@/lib/api-response";
import { buildEstadoReportHtml } from "@/lib/export/report";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { STATE_CATALOG } from "@/lib/state-catalog";

export async function GET(
  request: Request,
  context: { params: Promise<{ estadoId: string }> },
) {
  if (!checkRateLimit(`informe:${clientKey(request)}`, 10, 60_000)) {
    return new Response("Demasiados informes solicitados. Intente de nuevo en un minuto.", {
      status: 429,
      headers: { "Retry-After": "60", ...NO_INDEX_HEADERS },
    });
  }

  const { estadoId } = await context.params;
  const catalog = STATE_CATALOG.find((item) => item.id === estadoId);
  if (!catalog) {
    return new Response("Estado no encontrado", { status: 404, headers: NO_INDEX_HEADERS });
  }

  // The aggregator falls back to simulated data when the CSV is unreachable;
  // the report says so instead of presenting those figures as official.
  const { data: rnpdno } = await getRnpdnoCached();
  const estado = rnpdno.estados.find((item) => item.id === estadoId) ?? {
    id: catalog.id,
    nombre: catalog.nombre,
    lat: catalog.lat,
    lng: catalog.lng,
    total: 0,
    nuevos30d: 0,
    localizados: 0,
    mujeres: 0,
    hombres: 0,
    municipioAlto: "—",
  };

  let vad = null;
  try {
    vad = (await fetchVadSummaryDefault()).summary;
  } catch {
    vad = null;
  }

  const html = buildEstadoReportHtml({ estado, vad, simulated: rnpdno.usedMock });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="rastro-informe-${catalog.id}.html"`,
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
      ...NO_INDEX_HEADERS,
    },
  });
}
