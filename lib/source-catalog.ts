import { DATACIVICA, RNPDNO_CSV_URL, VAD_BORRADOS_CSV_URL, VAD_DATASETS } from "@/lib/config";

export type SourceId =
  | "rnpdno"
  | "vad"
  | "amber"
  | "news"
  | "gdelt"
  | "telegram"
  | "buscar"
  | "mapa";

export interface SourceDefinition {
  id: SourceId;
  label: string;
  provider: string;
  cutDate: string;
  method: string;
  url: string;
  refreshNote?: string;
}

export const SOURCE_CATALOG: Record<SourceId, SourceDefinition> = {
  rnpdno: {
    id: "rnpdno",
    label: "RNPDNO versión pública",
    provider: "Comisión Nacional de Búsqueda · Data Cívica",
    cutDate: "2023-09-22",
    method: "CSV agregado por entidad federativa",
    url: RNPDNO_CSV_URL,
    refreshNote: "Configure RASTRO_RNPDNO_CSV_URL cuando exista una versión más reciente.",
  },
  vad: {
    id: "vad",
    label: "Volver a Desaparecer",
    provider: "Data Cívica",
    cutDate: "2024-03-12",
    method: "CSV nombres borrados + cruce ELIMINADO en RNPDNO público",
    url: DATACIVICA.site,
  },
  amber: {
    id: "amber",
    label: "Alertas AMBER / ALBA",
    provider: "FGR",
    cutDate: "Demo",
    method: "Datos de demostración; verifique en alertaamber.fgr.org.mx",
    url: "https://alertaamber.fgr.org.mx/",
  },
  news: {
    id: "news",
    label: "Noticias RSS",
    provider: "Medios configurados (RASTRO_RSS_FEEDS)",
    cutDate: "Tiempo real",
    method: "RSS parseado",
    url: "https://www.animalpolitico.com/feed/",
  },
  gdelt: {
    id: "gdelt",
    label: "GDELT",
    provider: "GDELT Project",
    cutDate: "Últimas 24 h",
    method: "Consulta doc API filtrada por México",
    url: "https://www.gdeltproject.org/",
  },
  telegram: {
    id: "telegram",
    label: "Telegram OSINT",
    provider: "Canales públicos (RASTRO_TELEGRAM_CHANNELS)",
    cutDate: "Tiempo real",
    method: "Scrape HTML público t.me/s/",
    url: "https://t.me/",
  },
  buscar: {
    id: "buscar",
    label: "Búsqueda por nombre",
    provider: "Data Cívica · CNB",
    cutDate: "2023-09-22 / 2024-03-12",
    method: "Índice en memoria sobre CSV RNPDNO + nombres borrados",
    url: DATACIVICA.buscador,
  },
  mapa: {
    id: "mapa",
    label: "Mapa territorial",
    provider: "CONABIO / strotgen · Carto basemap",
    cutDate: "Límites estatales + RNPDNO sep 2023",
    method: "GeoJSON estatal oficial + agregados RNPDNO",
    url: "/geo/mx-states.geojson",
  },
};

export const USAGE_DISCLAIMER =
  "RASTRO es una herramienta de inteligencia de datos abiertos. No sustituye denuncias oficiales ni la búsqueda ante fiscalías o comisiones. Los datos pueden estar desactualizados o incompletos. No utilice esta plataforma para acoso, difusión irresponsable de nombres ni decisiones legales sin verificación independiente.";

export const THIRD_PARTY_SERVICES = [
  "Google Drive (CSVs Data Cívica)",
  "Carto (mapa base)",
  "GDELT Project",
  "Telegram (canales públicos)",
  "FGR portal AMBER",
  "Medios RSS configurados",
];

export function getReconstruccionDataset() {
  return VAD_DATASETS.find((item) => item.id === "reconstruccion_2017_2024");
}
