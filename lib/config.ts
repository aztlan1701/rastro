export const RNPDNO_CSV_URL =
  process.env.RASTRO_RNPDNO_CSV_URL ??
  "https://files.datacivica.org/volveradesaparecer/rnpdno_publico.csv";

export const RSS_FEEDS = (
  process.env.RASTRO_RSS_FEEDS ??
  "https://www.animalpolitico.com/feed/,https://www.proceso.com.mx/rss,https://www.reforma.com/rss/portada.xml"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

export const TELEGRAM_CHANNELS = (
  process.env.RASTRO_TELEGRAM_CHANNELS ?? "buscadoras_mx,AlertaAmberMexico"
)
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

export const CACHE_TTL = {
  rnpdno: 24 * 60 * 60 * 1000,
  amber: 30 * 60 * 1000,
  news: 15 * 60 * 1000,
  gdelt: 30 * 60 * 1000,
  telegram: 15 * 60 * 1000,
};

export const CACHE_STALE = {
  rnpdno: 7 * 24 * 60 * 60 * 1000,
  amber: 24 * 60 * 60 * 1000,
  news: 24 * 60 * 60 * 1000,
  gdelt: 24 * 60 * 60 * 1000,
  telegram: 24 * 60 * 60 * 1000,
};
