export const DATACIVICA = {
  site: "https://volveradesaparecer.datacivica.org",
  datosAbiertos: "https://volveradesaparecer.datacivica.org/datos-abiertos",
  buscador: "https://volveradesaparecer.datacivica.org/buscador",
} as const;

function driveDownload(id: string, large = false): string {
  const confirm = large ? "&confirm=t" : "";
  return `https://drive.google.com/uc?export=download${confirm}&id=${id}`;
}

export const RNPDNO_CSV_URL =
  process.env.RASTRO_RNPDNO_CSV_URL ??
  driveDownload("13GK5Vt9WjB_G4vkCpymmMH1QwkQobJGa");

export const VAD_BORRADOS_CSV_URL =
  process.env.RASTRO_VAD_BORRADOS_CSV_URL ??
  driveDownload("1wuo-bsRoVGhuQIIpC-u_KdcdICyDgwqw");

export const VAD_DATASETS = [
  {
    id: "rnpdno_publico",
    name: "RNPDNO versión pública (sep 2023)",
    description:
      "Versión pública de 11 variables del RNPDNO publicada por la Comisión Nacional de Búsqueda.",
    publishedAt: "2023-09-22",
    downloadUrl:
      "https://drive.google.com/file/d/13GK5Vt9WjB_G4vkCpymmMH1QwkQobJGa/view?usp=drive_link",
    format: "csv",
    usedInRastro: true,
  },
  {
    id: "reconstruccion_2017_2024",
    name: "Personas desaparecidas: registros de 2017 a 2024",
    description:
      "Reconstrucción por Data Cívica de registros del RNPED, versiones públicas del RNPDNO y búsqueda generalizada.",
    publishedAt: "2024-03-19",
    downloadUrl:
      "https://drive.google.com/file/d/165KwBF1hmnAfk8fqiQUmh6RAACROUmuO/view?usp=drive_link",
    format: "csv",
    usedInRastro: false,
  },
  {
    id: "nombres_borrados",
    name: "Nombres borrados (ago–dic 2023)",
    description:
      "Reconstrucción de nombres borrados entre versiones públicas del RNPDNO y la versión especial de búsqueda generalizada.",
    publishedAt: "2024-03-12",
    downloadUrl:
      "https://drive.google.com/file/d/1wuo-bsRoVGhuQIIpC-u_KdcdICyDgwqw/view?usp=drive_link",
    format: "csv",
    usedInRastro: true,
  },
] as const;

export const RSS_FEEDS = (
  process.env.RASTRO_RSS_FEEDS ??
  [
    "https://www.animalpolitico.com/feed/",
    "https://www.proceso.com.mx/rss",
    "https://www.reforma.com/rss/portada.xml",
    "https://www.gob.mx/cnbp/es/rss",
  ].join(",")
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

export const MONITOR_KEYWORDS = (
  process.env.RASTRO_MONITOR_KEYWORDS ??
  "desaparec,hallazgo,fosa,buscadoras,localizad"
)
  .split(",")
  .map((keyword) => keyword.trim().toLowerCase())
  .filter(Boolean);

export const MONITOR_ESTADOS = (
  process.env.RASTRO_MONITOR_ESTADOS ?? ""
)
  .split(",")
  .map((estado) => estado.trim())
  .filter(Boolean);

export const ALERT_WEBHOOK_URL = process.env.RASTRO_ALERT_WEBHOOK_URL ?? "";

/**
 * Token para autorizar el disparo del webhook en `/api/monitor`. Si está vacío,
 * el endpoint sigue permitiendo consultar coincidencias pero NUNCA dispara el
 * webhook desde una petición pública (evita que cualquiera spamee el webhook o
 * amplifique peticiones salientes). Configúralo para cron/automatizaciones.
 */
export const MONITOR_TOKEN = process.env.RASTRO_MONITOR_TOKEN ?? "";

/** Identifica a RASTRO ante los servidores que consulta, con una vía de contacto. */
/** Repositorio público del código. La AGPL exige ofrecer el código a quien use el servicio. */
export const SOURCE_CODE_URL =
  process.env.NEXT_PUBLIC_RASTRO_SOURCE_URL ?? "https://github.com/aztlan1701/rastro";

export const USER_AGENT =
  process.env.RASTRO_USER_AGENT ?? "RASTRO/0.3 (+https://github.com/aztlan1701/rastro)";

export const RECONSTRUCCION_AGGREGADOS_URL =
  process.env.RASTRO_RECONSTRUCCION_AGGREGADOS_URL ?? "/data/reconstruccion-agregados.json";

export const CACHE_TTL = {
  rnpdno: 24 * 60 * 60 * 1000,
  vad: 24 * 60 * 60 * 1000,
  news: 15 * 60 * 1000,
  gdelt: 30 * 60 * 1000,
};

export const CACHE_STALE = {
  rnpdno: 7 * 24 * 60 * 60 * 1000,
  vad: 7 * 24 * 60 * 60 * 1000,
  news: 24 * 60 * 60 * 1000,
  gdelt: 24 * 60 * 60 * 1000,
};
