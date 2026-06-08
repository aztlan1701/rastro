import { STATE_CATALOG } from "@/lib/state-catalog";

export interface GeoMatch {
  label: string;
  lat: number;
  lng: number;
}

const PLACES: GeoMatch[] = STATE_CATALOG.map((state) => ({
  label: state.nombre,
  lat: state.lat,
  lng: state.lng,
}));

const EXTRA: GeoMatch[] = [
  { label: "Guadalajara", lat: 20.6597, lng: -103.3496 },
  { label: "Monterrey", lat: 25.6866, lng: -100.3161 },
  { label: "Tijuana", lat: 32.5149, lng: -117.0382 },
  { label: "Ciudad Juárez", lat: 31.6904, lng: -106.4245 },
  { label: "Acapulco", lat: 16.8531, lng: -99.8237 },
  { label: "Culiacán", lat: 24.8091, lng: -107.394 },
  { label: "Ecatepec", lat: 19.6018, lng: -99.0507 },
  { label: "Reynosa", lat: 26.0508, lng: -98.2979 },
];

const DICTIONARY = [...PLACES, ...EXTRA].sort((a, b) => b.label.length - a.label.length);

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
