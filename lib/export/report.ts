import { rowsToCsv } from "@/lib/export/csv";
import { SOURCE_CATALOG, USAGE_DISCLAIMER } from "@/lib/source-catalog";
import type { EstadoData, PersonSearchResult, VadSummary } from "@/lib/types";
import { formatNum, formatNumOrDash } from "@/lib/utils";

/** Escapa texto que se interpola en el HTML del informe para evitar inyección. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EstadoReportInput {
  estado: EstadoData;
  vad?: VadSummary | null;
  noticiasCount?: number;
  /** True cuando las cifras del RNPDNO provienen de datos simulados de desarrollo. */
  simulated?: boolean;
}

export function buildEstadoReportHtml({
  estado,
  vad,
  noticiasCount = 0,
  simulated = false,
}: EstadoReportInput): string {
  const borrados = vad?.porEstado.find((item) => item.estadoId === estado.id)?.borrados ?? 0;
  const sexoNota = estado.sexoUniverso === "todos" ? " *" : "";
  const generatedAt = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>RASTRO — Informe ${escapeHtml(estado.nombre)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 2rem auto; color: #111; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #555; font-size: 0.85rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; font-size: 0.9rem; }
    th { background: #f5f5f5; }
    .disclaimer { font-size: 0.8rem; color: #666; border-top: 1px solid #ddd; padding-top: 1rem; margin-top: 2rem; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>Informe territorial — ${escapeHtml(estado.nombre)}</h1>
  <p class="meta">Generado por RASTRO · ${generatedAt} · Inteligencia de datos abiertos</p>

${
  simulated
    ? `  <p style="border:1px solid #b45309;background:#fffbeb;color:#7c2d12;padding:0.75rem;font-size:0.9rem"><strong>Datos simulados.</strong> No fue posible leer los agregados del RNPDNO al generar este informe; las cifras de la primera tabla son de desarrollo y no deben citarse.</p>\n`
    : ""
}  <h2>RNPDNO (${simulated ? "datos simulados" : "agregados tablero CNB"})</h2>
  <table>
    <tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Personas desaparecidas y no localizadas</td><td>${formatNum(estado.total)}</td></tr>
    <tr><td>Personas localizadas</td><td>${formatNumOrDash(estado.localizados)}</td></tr>
    <tr><td>Mujeres${sexoNota}</td><td>${formatNum(estado.mujeres)}</td></tr>
    <tr><td>Hombres${sexoNota}</td><td>${formatNum(estado.hombres)}</td></tr>
    <tr><td>Sexo no especificado${sexoNota}</td><td>${formatNum(estado.noEspecificado)}</td></tr>
  </table>
  <p class="meta">Nota: “localizadas” se obtiene restando las personas desaparecidas y no localizadas a todos los registros de la entidad; una raya indica que no pudo calcularse.${
    sexoNota
      ? " * El desglose por sexo cuenta todos los registros de la entidad, incluidas las personas localizadas, por lo que no suma el total de desaparecidas."
      : ""
  } El tablero agregado no publica “nuevos 30 días” ni municipio con más registros. La búsqueda por nombre sigue usando el CSV público sep 2023.</p>

  <h2>Data Cívica — Volver a Desaparecer</h2>
  <table>
    <tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Nombres borrados (estado)</td><td>${formatNum(borrados)}</td></tr>
    <tr><td>Nombres borrados (nacional)</td><td>${formatNum(vad?.totalBorrados ?? 0)}</td></tr>
    <tr><td>Registros ELIMINADO (nacional)</td><td>${formatNum(vad?.totalEliminadosEnPublico ?? 0)}</td></tr>
  </table>

  <h2>Contexto situacional</h2>
  <table>
    <tr><th>Señal</th><th>Valor</th></tr>
    <tr><td>Noticias geo recientes (feed)</td><td>${noticiasCount}</td></tr>
  </table>

  <h2>Fuentes</h2>
  <ul>
    <li>${SOURCE_CATALOG.rnpdno.label} · corte ${SOURCE_CATALOG.rnpdno.cutDate}</li>
    <li>${SOURCE_CATALOG.vad.label} · corte ${SOURCE_CATALOG.vad.cutDate}</li>
    <li>${SOURCE_CATALOG.mapa.label}</li>
  </ul>

  <p class="disclaimer">${USAGE_DISCLAIMER}</p>
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
    "desaparecidas_y_no_localizadas",
    "nuevos_30d",
    "mujeres",
    "hombres",
    "no_especificado",
    "universo_sexo",
    "localizadas",
    "pct_localizadas_sobre_registros",
  ];
  const rows = estados.map((estado) => [
    estado.nombre,
    estado.total,
    estado.nuevos30d ?? "",
    estado.mujeres,
    estado.hombres,
    estado.noEspecificado,
    estado.sexoUniverso === "todos" ? "todos_los_registros" : "desaparecidas_y_no_localizadas",
    estado.localizados ?? "",
    estado.localizados !== null && estado.total + estado.localizados > 0
      ? ((estado.localizados / (estado.total + estado.localizados)) * 100).toFixed(1)
      : "",
  ]);
  return rowsToCsv(headers, rows);
}
