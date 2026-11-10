export interface EstadoData {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  /** Personas desaparecidas y no localizadas. */
  total: number;
  /** null cuando la fuente no lo publica (el tablero agregado no lo hace). */
  nuevos30d: number | null;
  /** null cuando no puede obtenerse de la fuente. */
  localizados: number | null;
  mujeres: number;
  hombres: number;
  /** Registros cuyo sexo viene vacío, "indeterminado" o no clasificable. */
  noEspecificado: number;
  /**
   * Población a la que se refiere el desglose por sexo. "todos" = todos los
   * registros de la entidad, incluidas las personas localizadas, por lo que no
   * suma `total`. Ausente cuando coincide con `total`.
   */
  sexoUniverso?: "desaparecidas" | "todos";
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

/** Agregado municipal unido a CVEGEO (capa CSV 2023). */
export interface MunicipioAgg {
  cvegeo: string;
  nombre: string;
  estadoId: string;
  total: number;
}

export type NoticiaTipo =
  | "hallazgo"
  | "denuncia"
  | "institucional"
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
