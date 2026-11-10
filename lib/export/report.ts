import { rowsToCsv } from "@/lib/export/csv";
import { escapeHtml } from "@/lib/export/escape";
import { SOURCE_CATALOG, USAGE_DISCLAIMER } from "@/lib/source-catalog";
import type { EstadoData, PersonSearchResult, VadSummary } from "@/lib/types";
import { formatNum } from "@/lib/utils";

export interface EstadoReportInput {
  estado: EstadoData;
  vad?: VadSummary | null;
  noticiasCount?: number;
  /** True when the RNPDNO figures come from development fallback data. */
  simulated?: boolean;
}

export function buildEstadoReportHtml({
  estado,
  vad,
  noticiasCount = 0,
  simulated = false,
}: EstadoReportInput): string {
  const borrados = vad?.porEstado.find((item) => item.estadoId === estado.id)?.borrados ?? 0;
  const generatedAt = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
  // Every interpolated value goes through escapeHtml so the browser reads it as text.
  const e = escapeHtml;
  const nombre = e(estado.nombre);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex, nofollow" />
  <title>RASTRO — Informe ${nombre}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 2rem auto; color: #111; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #555; font-size: 0.85rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; font-size: 0.9rem; }
    th { background: #f5f5f5; }
    .warning { border: 1px solid #b45309; background: #fffbeb; color: #7c2d12; padding: 0.75rem; font-size: 0.9rem; }
    .disclaimer { font-size: 0.8rem; color: #666; border-top: 1px solid #ddd; padding-top: 1rem; margin-top: 2rem; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>Informe territorial — ${nombre}</h1>
  <p class="meta">Generado por RASTRO · ${e(generatedAt)} · Inteligencia de datos abiertos</p>
${
  simulated
    ? `  <p class="warning"><strong>Datos simulados.</strong> No fue posible obtener el CSV del RNPDNO al generar este informe; las cifras de la primera tabla son de desarrollo y no deben citarse.</p>\n`
    : ""
}
  <h2>RNPDNO (${simulated ? "datos simulados" : "versión pública sep 2023"})</h2>
  <table>
    <tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Total registradas</td><td>${e(formatNum(estado.total))}</td></tr>
    <tr><td>Nuevas (30 días previos a la consulta)</td><td>+${e(formatNum(estado.nuevos30d))}</td></tr>
    <tr><td>Mujeres</td><td>${e(formatNum(estado.mujeres))}</td></tr>
    <tr><td>Hombres</td><td>${e(formatNum(estado.hombres))}</td></tr>
    <tr><td>Localizadas</td><td>${e(formatNum(estado.localizados))}</td></tr>
    <tr><td>Municipio con más registros</td><td>${e(estado.municipioAlto)}</td></tr>
  </table>

  <h2>Data Cívica — Volver a Desaparecer</h2>
  <table>
    <tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Nombres borrados (estado)</td><td>${e(formatNum(borrados))}</td></tr>
    <tr><td>Nombres borrados (nacional)</td><td>${e(formatNum(vad?.totalBorrados ?? 0))}</td></tr>
    <tr><td>Registros ELIMINADO (nacional)</td><td>${e(formatNum(vad?.totalEliminadosEnPublico ?? 0))}</td></tr>
  </table>

  <h2>Contexto situacional</h2>
  <table>
    <tr><th>Señal</th><th>Valor</th></tr>
    <tr><td>Noticias geo recientes (feed)</td><td>${e(noticiasCount)}</td></tr>
  </table>

  <h2>Fuentes</h2>
  <ul>
    <li>${e(SOURCE_CATALOG.rnpdno.label)} · corte ${e(SOURCE_CATALOG.rnpdno.cutDate)}</li>
    <li>${e(SOURCE_CATALOG.vad.label)} · corte ${e(SOURCE_CATALOG.vad.cutDate)}</li>
    <li>${e(SOURCE_CATALOG.mapa.label)}</li>
  </ul>

  <p class="disclaimer">${e(USAGE_DISCLAIMER)}</p>
</body>
</html>`;
}

export function buildSearchResultsCsv(results: PersonSearchResult[]): string {
  const headers = ["nombre", "fuente", "entidad", "sexo", "edad", "fecha", "eliminado"];
  const rows = results.map((item) => [
    item.nombreCompleto,
    item.source,
    item.entidad ?? "",
    item.sexo ?? "",
    item.edad ?? "",
    item.fecha ?? "",
    item.eliminado ? "si" : "no",
  ]);
  return rowsToCsv(headers, rows);
}

export function buildEstadosTableCsv(estados: EstadoData[]): string {
  const headers = [
    "estado",
    "total",
    "nuevos_30d",
    "mujeres",
    "hombres",
    "localizados",
    "pct_localizados",
  ];
  const rows = estados.map((estado) => [
    estado.nombre,
    estado.total,
    estado.nuevos30d,
    estado.mujeres,
    estado.hombres,
    estado.localizados,
    estado.total > 0 ? ((estado.localizados / estado.total) * 100).toFixed(1) : "0",
  ]);
  return rowsToCsv(headers, rows);
}
