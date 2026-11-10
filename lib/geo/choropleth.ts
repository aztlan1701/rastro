import type { EstadoData, MunicipioPoint, RnpdnoRecord } from "@/lib/types";
import { normalizeStateName } from "@/lib/state-catalog";
import type { ExpressionSpecification } from "maplibre-gl";

export interface ChoroplethStop {
  threshold: number;
  color: string;
  label: string;
  desc: string;
}

/** Shared choropleth thresholds — keep in sync with getColor() in lib/utils.ts */
export const CHOROPLETH_STOPS: ChoroplethStop[] = [
  { threshold: 0, color: "#4a9eff", label: "<2,000", desc: "Incidencia baja" },
  { threshold: 2000, color: "#ffd700", label: "2,000–3,500", desc: "Incidencia media" },
  { threshold: 3500, color: "#ffb347", label: "3,500–5,000", desc: "Incidencia media-alta" },
  { threshold: 5000, color: "#ff6b35", label: "5,000–7,000", desc: "Incidencia alta" },
  { threshold: 7000, color: "#ff2d55", label: ">7,000", desc: "Incidencia muy alta" },
];

export const MAP_MARKER_LEGEND = [
  { color: "#4a9eff", label: "Municipio RNPDNO" },
  { color: "#ff2d55", label: "Noticia hallazgo" },
  { color: "#ffb300", label: "Noticia alerta" },
  { color: "#00d084", label: "Otras noticias geo" },
] as const;

export function maplibreChoroplethExpression(): ExpressionSpecification {
  const [, ...steps] = CHOROPLETH_STOPS;
  const expression: unknown[] = ["step", ["get", "total"], CHOROPLETH_STOPS[0].color];
  for (const stop of steps) {
    expression.push(stop.threshold, stop.color);
  }
  return expression as ExpressionSpecification;
}

export function getChoroplethLegendItems() {
  return [
    { color: "#ff2d55", label: ">7,000", desc: "Incidencia muy alta" },
    { color: "#ff6b35", label: "5,000–7,000", desc: "Incidencia alta" },
    { color: "#ffb347", label: "3,500–5,000", desc: "Incidencia media-alta" },
    { color: "#ffd700", label: "2,000–3,500", desc: "Incidencia media" },
    { color: "#4a9eff", label: "<2,000", desc: "Incidencia baja" },
  ];
}

function polygonCentroid(ring: number[][]): { lng: number; lat: number } {
  const vertices = ring.slice(0, -1);
  const { lng, lat } = vertices.reduce(
    (acc, [vertexLng, vertexLat]) => ({
      lng: acc.lng + vertexLng,
      lat: acc.lat + vertexLat,
    }),
    { lng: 0, lat: 0 },
  );

  return {
    lng: lng / vertices.length,
    lat: lat / vertices.length,
  };
}

function offsetPolygon(lng: number, lat: number, size = 0.55): number[][][] {
  return [
    [
      [lng - size, lat - size * 0.6],
      [lng + size * 0.5, lat + size * 0.6],
      [lng + size, lat - size * 0.3],
      [lng, lat - size * 0.8],
      [lng - size * 0.7, lat - size * 0.4],
      [lng - size, lat - size * 0.6],
    ],
  ];
}

export function buildEstadosGeoJson(estados: EstadoData[]) {
  return {
    type: "FeatureCollection" as const,
    features: estados.map((estado) => {
      const coordinates = offsetPolygon(estado.lng, estado.lat);
      const centroid = polygonCentroid(coordinates[0]);

      return {
        type: "Feature" as const,
        properties: {
          id: estado.id,
          nombre: estado.nombre,
          total: estado.total,
          centerLng: centroid.lng,
          centerLat: centroid.lat,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates,
        },
      };
    }),
  };
}

export function getChoroplethBounds(
  estados: EstadoData[],
): [[number, number], [number, number]] | null {
  if (estados.length === 0) return null;

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const feature of buildEstadosGeoJson(estados).features) {
    for (const [lng, lat] of feature.geometry.coordinates[0]) {
      west = Math.min(west, lng);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      north = Math.max(north, lat);
    }
  }

  return [
    [west, south],
    [east, north],
  ];
}

export function buildMunicipioPoints(records: RnpdnoRecord[]): MunicipioPoint[] {
  const map = new Map<string, MunicipioPoint>();

  for (const record of records) {
    if (!record.municipio) continue;
    const state = normalizeStateName(record.estado);
    if (!state) continue;

    const key = `${record.estadoId}-${record.municipio}`;
    const existing = map.get(key);
    if (existing) {
      existing.total += 1;
      continue;
    }

    const hash = [...key].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    map.set(key, {
      id: key,
      nombre: record.municipio,
      estadoId: record.estadoId,
      lat: state.lat + ((hash % 17) - 8) * 0.025,
      lng: state.lng + (((hash >> 4) % 17) - 8) * 0.025,
      total: 1,
    });
  }

  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 500);
}

export function filterMunicipiosByBbox(
  municipios: MunicipioPoint[],
  bbox: { west: number; south: number; east: number; north: number },
): MunicipioPoint[] {
  return municipios.filter(
    (point) =>
      point.lng >= bbox.west &&
      point.lng <= bbox.east &&
      point.lat >= bbox.south &&
      point.lat <= bbox.north,
  );
}
