import { rowsToCsv } from "@/lib/export/csv";
import { SOURCE_CATALOG, USAGE_DISCLAIMER } from "@/lib/source-catalog";
import type { EstadoData, PersonSearchResult, VadSummary } from "@/lib/types";
import { formatNum } from "@/lib/utils";

export interface EstadoReportInput {
  estado: EstadoData;
  vad?: VadSummary | null;
  noticiasCount?: number;
  amberActivas?: number;
}

export function buildEstadoReportHtml({
  estado,
  vad,
  noticiasCount = 0,
  amberActivas = 0,
}: EstadoReportInput): string {
  const borrados = vad?.porEstado.find((item) => item.estadoId === estado.id)?.borrados ?? 0;
  const generatedAt = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>RASTRO — Informe ${estado.nombre}</title>
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
  <h1>Informe territorial — ${estado.nombre}</h1>
  <p class="meta">Generado por RASTRO · ${generatedAt} · Inteligencia de datos abiertos</p>

  <h2>RNPDNO (versión pública sep 2023)</h2>
  <table>
    <tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Total registradas</td><td>${formatNum(estado.total)}</td></tr>
    <tr><td>Nuevas (30 días)</td><td>+${formatNum(estado.nuevos30d)}</td></tr>
    <tr><td>Mujeres</td><td>${formatNum(estado.mujeres)}</td></tr>
    <tr><td>Hombres</td><td>${formatNum(estado.hombres)}</td></tr>
    <tr><td>Localizadas</td><td>${formatNum(estado.localizados)}</td></tr>
    <tr><td>Municipio con más registros</td><td>${estado.municipioAlto}</td></tr>
  </table>

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
    <tr><td>Alertas AMBER demo activas (estado)</td><td>${amberActivas}</td></tr>
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
