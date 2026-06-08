import type { EstadoData, MunicipioPoint, RnpdnoRecord } from "@/lib/types";
import { normalizeStateName } from "@/lib/state-catalog";

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

function offsetPolygon(lng: number, lat: number, size = 0.45): number[][][] {
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
