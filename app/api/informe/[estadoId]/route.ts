import { fetchRnpdnoEstados } from "@/lib/aggregators/rnpdno";
import { fetchVadSummaryDefault } from "@/lib/aggregators/volver-a-desaparecer";
import { buildEstadoReportHtml } from "@/lib/export/report";
import { RNPDNO_CSV_URL } from "@/lib/config";
import { STATE_CATALOG } from "@/lib/state-catalog";
import { ESTADOS_DATA } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ estadoId: string }> },
) {
  const { estadoId } = await context.params;
  const catalog = STATE_CATALOG.find((item) => item.id === estadoId);

  let estado = ESTADOS_DATA.find((item) => item.id === estadoId) ?? null;

  if (!estado) {
    try {
      const rnpdno = await fetchRnpdnoEstados(RNPDNO_CSV_URL);
      estado = rnpdno.estados.find((item) => item.id === estadoId) ?? null;
    } catch {
      estado = null;
    }
  }

  if (!estado && catalog) {
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
      municipioAlto: "—",
    };
  }

  if (!estado) {
    return new Response("Estado no encontrado", { status: 404 });
  }

  let vad = null;
  try {
    vad = (await fetchVadSummaryDefault()).summary;
  } catch {
    vad = null;
  }

  const html = buildEstadoReportHtml({ estado, vad });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="rastro-informe-${estadoId}.html"`,
    },
  });
}
