import { DATACIVICA, VAD_DATASETS } from "@/lib/config";

export type SourceId =
  | "rnpdno"
  | "vad"
  | "news"
  | "gdelt"
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
    label: "RNPDNO agregados (tablero CNB)",
    provider: "Comisión Nacional de Búsqueda",
    cutDate: "Snapshot versionado (tablero estadístico)",
    method:
      "Agregados estatales vía consulta del tablero público; regenerar con scripts/rnpdno_ingest.py",
    url: "https://versionpublicarnpdno.segob.gob.mx",
    refreshNote:
      "Mapa y ranking usan agregados del tablero. La búsqueda nominal sigue en CSV sep 2023.",
  },
  vad: {
    id: "vad",
    label: "Volver a Desaparecer",
    provider: "Data Cívica",
    cutDate: "2024-03-12",
    method: "CSV nombres borrados + cruce ELIMINADO en RNPDNO público",
    url: DATACIVICA.site,
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
    provider: "INEGI · CONABIO/strotgen · Carto · CNB · CSV RNPDNO",
    cutDate: "Estados + municipios: snapshot tablero CNB · respaldo CSV sep-2023",
    method:
      "Choropleth estatal + municipal (BarChartSexoMunicipio por entidad → CVEGEO; CSV si no hay snapshot)",
    url: "/geo/municipios/",
  },
};

export const USAGE_DISCLAIMER =
  "RASTRO es una herramienta de inteligencia de datos abiertos. No sustituye denuncias oficiales ni la búsqueda ante fiscalías o comisiones. Los datos pueden estar desactualizados o incompletos. No utilice esta plataforma para acoso, difusión irresponsable de nombres ni decisiones legales sin verificación independiente.";

export const THIRD_PARTY_SERVICES = [
  "Google Drive (CSVs Data Cívica)",
  "Tablero estadístico RNPDNO (CNB / SEGOB)",
  "INEGI wscatgeo (límites municipales)",
  "Carto (mapa base)",
  "GDELT Project",
  "Medios RSS configurados",
];

export function getReconstruccionDataset() {
  return VAD_DATASETS.find((item) => item.id === "reconstruccion_2017_2024");
}
