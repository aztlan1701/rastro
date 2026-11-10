import { STATE_CATALOG, normalizeStateName, type StateCatalogEntry } from "@/lib/state-catalog";

export type GeoConfidence = "exact" | "state" | "inferred" | "none";

export interface GeoMatch {
  label: string;
  lat: number;
  lng: number;
  confidence: GeoConfidence;
}

const EXTRA_CITIES: GeoMatch[] = [
  { label: "Guadalajara", lat: 20.6597, lng: -103.3496, confidence: "exact" },
  { label: "Monterrey", lat: 25.6866, lng: -100.3161, confidence: "exact" },
  { label: "Tijuana", lat: 32.5149, lng: -117.0382, confidence: "exact" },
  { label: "Ciudad Juárez", lat: 31.6904, lng: -106.4245, confidence: "exact" },
  { label: "Acapulco", lat: 16.8531, lng: -99.8237, confidence: "exact" },
  { label: "Culiacán", lat: 24.8091, lng: -107.394, confidence: "exact" },
  { label: "Ecatepec", lat: 19.6018, lng: -99.0507, confidence: "exact" },
  { label: "Reynosa", lat: 26.0508, lng: -98.2979, confidence: "exact" },
];

const STATE_MATCHES: GeoMatch[] = STATE_CATALOG.map((state) => ({
  label: state.nombre,
  lat: state.lat,
  lng: state.lng,
  confidence: "state" as const,
}));

const DICTIONARY = [...EXTRA_CITIES, ...STATE_MATCHES].sort(
  (a, b) => b.label.length - a.label.length,
);

const GEOJSON_NAME_ALIASES: Record<string, string> = {
  "distrito federal": "ciudad de mexico",
  "veracruz de ignacio de la llave": "veracruz",
  "coahuila de zaragoza": "coahuila",
  "michoacan de ocampo": "michoacan",
  "michoacán de ocampo": "michoacan",
};

export function resolveGeoStateName(raw: string): StateCatalogEntry | null {
  const key = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const aliased = GEOJSON_NAME_ALIASES[key] ?? key;
  return normalizeStateName(aliased) ?? normalizeStateName(raw);
}

export function geoparseText(text: string): GeoMatch | null {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  for (const place of DICTIONARY) {
    const key = place.label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (normalized.includes(key)) return place;
  }

  return null;
}

export function inferEstadoFromText(text: string): GeoMatch | null {
  const words = text.toLowerCase().split(/\W+/);
  for (let i = 0; i < words.length; i += 1) {
    const slice = words.slice(i, i + 4).join(" ");
    const state = normalizeStateName(slice) ?? normalizeStateName(words[i] ?? "");
    if (state) {
      return {
        label: state.nombre,
        lat: state.lat,
        lng: state.lng,
        confidence: "inferred",
      };
    }
  }
  return null;
}

export const MEXICO_BBOX = {
  minLat: 14.5,
  maxLat: 32.8,
  minLng: -118.5,
  maxLng: -86.5,
};

export function isInMexico(lat: number, lng: number): boolean {
  return (
    lat >= MEXICO_BBOX.minLat &&
    lat <= MEXICO_BBOX.maxLat &&
    lng >= MEXICO_BBOX.minLng &&
    lng <= MEXICO_BBOX.maxLng
  );
}

export const GEO_CONFIDENCE_LABEL: Record<GeoConfidence, string> = {
  exact: "Ciudad",
  state: "Estado",
  inferred: "Inferido",
  none: "Sin ubicar",
};
