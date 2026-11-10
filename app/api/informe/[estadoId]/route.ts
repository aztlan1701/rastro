import { fetchRnpdnoLiveEstados } from "@/lib/aggregators/rnpdno-live";
import { NOINDEX_HEADERS } from "@/lib/api-response";
import { fetchVadSummaryDefault } from "@/lib/aggregators/volver-a-desaparecer";
import { buildEstadoReportHtml } from "@/lib/export/report";
import { STATE_CATALOG } from "@/lib/state-catalog";
import { ESTADOS_DATA } from "@/lib/mock-data";
import { checkRateLimit } from "@/lib/rate-limit";
import type { EstadoData } from "@/lib/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ estadoId: string }> },
) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await checkRateLimit(`informe:${client}`, 10, 60_000))) {
    return new Response("Demasiados informes solicitados. Intente de nuevo en un minuto.", {
      status: 429,
      headers: { ...NOINDEX_HEADERS, "Retry-After": "60" },
    });
  }

  const { estadoId } = await context.params;
  const catalog = STATE_CATALOG.find((item) => item.id === estadoId);
  if (!catalog) {
    return new Response("Estado no encontrado", { status: 404, headers: NOINDEX_HEADERS });
  }

  // Primero los agregados reales; los datos simulados solo como último recurso,
  // y el informe lo declara en lugar de presentarlos como cifras oficiales.
  let estado: EstadoData | null = null;
  let simulated = false;
  try {
    const rnpdno = await fetchRnpdnoLiveEstados();
    estado = rnpdno.estados.find((item) => item.id === estadoId) ?? null;
  } catch {
    estado = null;
  }

  if (!estado) {
    estado = ESTADOS_DATA.find((item) => item.id === estadoId) ?? null;
    simulated = estado !== null;
  }

  if (!estado) {
    estado = {
      id: catalog.id,
      nombre: catalog.nombre,
      lat: catalog.lat,
      lng: catalog.lng,
      total: 0,
      nuevos30d: 0,
      localizados: 0,
      mujeres: 0,
      hombres: 0,
      noEspecificado: 0,
      municipioAlto: "—",
    };
  }

  let vad = null;
  try {
    vad = (await fetchVadSummaryDefault()).summary;
  } catch {
    vad = null;
  }

  const html = buildEstadoReportHtml({ estado, vad, simulated });

  return new Response(html, {
    headers: {
      ...NOINDEX_HEADERS,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="rastro-informe-${catalog.id}.html"`,
    },
  });
}
