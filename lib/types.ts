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

export interface AlertaAmber {
  id: number;
  nombre: string;
  edad: number;
  estado: string;
  municipio: string;
  fecha: string;
  activa: boolean;
  descripcion: string;
  lat?: number;
  lng?: number;
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
}

export interface TelegramPost {
  id: string;
  channel: string;
  text: string;
  url: string;
  hora: string;
  lat?: number;
  lng?: number;
  lugar?: string;
}

export type DataStatus = "live" | "cached" | "stale" | "mock";

export interface ApiMeta {
  status: DataStatus;
  fetchedAt: string;
  source?: string;
}

export type TabId = "mapa" | "alertas" | "noticias" | "datos";
export type AlertaFilter = "todas" | "activas" | "cerradas";

export type LayerId =
  | "rnpdno_estados"
  | "rnpdno_municipios"
  | "amber_activas"
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
  alertas: AlertaAmber[];
  noticias: Noticia[];
  telegram: TelegramPost[];
  municipios: MunicipioPoint[];
  meta: {
    rnpdno: ApiMeta;
    amber: ApiMeta;
    news: ApiMeta;
    gdelt: ApiMeta;
    telegram: ApiMeta;
  };
}
