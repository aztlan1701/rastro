export interface EstadoData {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  total: number;
  nuevos30d: number;
  localizados: number;
  mujeres: number;
  hombres: number;
  municipioAlto: string;
}

export interface RnpdnoRecord {
  estadoId: string;
  estado: string;
  municipio: string;
  fechaDesaparicion: string;
  estatus: string;
  sexo: string;
}

export interface MunicipioPoint {
  id: string;
  nombre: string;
  estadoId: string;
  lat: number;
  lng: number;
  total: number;
}

export type NoticiaTipo =
  | "hallazgo"
  | "denuncia"
  | "institucional"
  | "alerta"
  | "estadistica";

export interface Noticia {
  id: string;
  titulo: string;
  fuente: string;
  hora: string;
  estado: string;
  tipo: NoticiaTipo;
  url?: string;
  lat?: number;
  lng?: number;
  geoConfidence?: GeoConfidence;
}

export type GeoConfidence = "exact" | "state" | "inferred" | "none";

export type DataStatus = "live" | "cached" | "stale" | "mock";

export interface ApiMeta {
  status: DataStatus;
  fetchedAt: string;
  source?: string;
}

export type TabId = "mapa" | "noticias" | "datos" | "buscar";

export type LayerId =
  | "rnpdno_estados"
  | "rnpdno_municipios"
  | "noticias_geo";

export interface LayerState {
  id: LayerId;
  label: string;
  enabled: boolean;
  count: number;
  color: string;
}

export interface DashboardData {
  estados: EstadoData[];
  noticias: Noticia[];
  municipios: MunicipioPoint[];
  meta: {
    rnpdno: ApiMeta;
    vad: ApiMeta;
    news: ApiMeta;
    gdelt: ApiMeta;
  };
}

export interface VadDatasetInfo {
  id: string;
  name: string;
  description: string;
  publishedAt: string;
  downloadUrl: string;
  format: string;
  usedInRastro: boolean;
}

export interface VadEstadoCount {
  estadoId: string;
  nombre: string;
  borrados: number;
}

export interface VadSummary {
  totalBorrados: number;
  borradosConEstado: number;
  totalEliminadosEnPublico: number;
  totalRegistrosPublico: number;
  porEstado: VadEstadoCount[];
  datasets: VadDatasetInfo[];
  platformUrl: string;
  buscadorUrl: string;
  reconstruccion2017_2024?: ReconstruccionAgregados;
}

export interface ReconstruccionEstadoCount {
  estadoId: string;
  nombre: string;
  total: number;
}

export interface ReconstruccionAgregados {
  publishedAt: string;
  source: string;
  note: string;
  totalRegistros: number;
  porEstado: ReconstruccionEstadoCount[];
}

export type PersonSearchSource = "rnpdno_publico" | "nombre_borrado";

export interface PersonSearchResult {
  id: string;
  source: PersonSearchSource;
  nombreCompleto: string;
  edad?: string;
  sexo?: string;
  entidad?: string;
  estadoId?: string;
  fecha?: string;
  eliminado?: boolean;
}

export interface PersonSearchFilters {
  source?: PersonSearchSource | "all" | "eliminado";
  estadoId?: string;
  sexo?: string;
}

export type InconsistencyType = "eliminado" | "borrado" | "borrado_sin_entidad";

export interface InconsistencyRecord {
  id: string;
  type: InconsistencyType;
  nombreCompleto: string;
  entidad?: string;
  estadoId?: string;
  sexo?: string;
  fecha?: string;
  source: PersonSearchSource;
}
