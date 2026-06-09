import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { resolveGeoStateName } from "@/lib/geoparse/mx-places";
import type { EstadoData } from "@/lib/types";

type StateFeature = Feature<Polygon | MultiPolygon, Record<string, unknown>>;

function polygonCentroid(ring: number[][]): { lng: number; lat: number } {
  const vertices = ring.slice(0, -1);
  if (vertices.length === 0) return { lng: 0, lat: 0 };
  const { lng, lat } = vertices.reduce(
    (acc, [vertexLng, vertexLat]) => ({
      lng: acc.lng + vertexLng,
      lat: acc.lat + vertexLat,
    }),
    { lng: 0, lat: 0 },
  );
  return { lng: lng / vertices.length, lat: lat / vertices.length };
}

function getFeatureCentroid(feature: StateFeature): { lng: number; lat: number } {
  if (feature.geometry.type === "Polygon") {
    const ring = feature.geometry.coordinates[0];
    return polygonCentroid(ring);
  }

  const firstRing = feature.geometry.coordinates[0]?.[0];
  return firstRing ? polygonCentroid(firstRing) : { lng: 0, lat: 0 };
}

export async function loadOfficialStatesGeoJson(): Promise<FeatureCollection> {
  const response = await fetch("/geo/mx-states.geojson");
  if (!response.ok) throw new Error("Failed to load states GeoJSON");
  return response.json() as Promise<FeatureCollection>;
}

export function mergeOfficialEstadosGeoJson(
  geojson: FeatureCollection,
  estados: EstadoData[],
): FeatureCollection {
  const byId = new Map(estados.map((estado) => [estado.id, estado]));

  const features = geojson.features
    .map((feature) => {
      const rawName = String(feature.properties?.state_name ?? feature.properties?.name ?? "");
      const state = resolveGeoStateName(rawName);
      if (!state) return null;

      const data = byId.get(state.id);
      if (!data) return null;

      const centroid = getFeatureCentroid(feature as StateFeature);

      return {
        ...feature,
        properties: {
          id: data.id,
          nombre: data.nombre,
          total: data.total,
          centerLng: centroid.lng,
          centerLat: centroid.lat,
          geoSource: "official",
        },
      };
    })
    .filter(Boolean) as Feature[];

  return { type: "FeatureCollection", features };
}

export function getOfficialChoroplethBounds(
  geojson: FeatureCollection,
): [[number, number], [number, number]] | null {
  if (geojson.features.length === 0) return null;

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const feature of geojson.features) {
    if (feature.geometry.type === "Polygon") {
      for (const [lng, lat] of feature.geometry.coordinates[0]) {
        west = Math.min(west, lng);
        south = Math.min(south, lat);
        east = Math.max(east, lng);
        north = Math.max(north, lat);
      }
      continue;
    }

    if (feature.geometry.type === "MultiPolygon") {
      for (const polygon of feature.geometry.coordinates) {
        for (const [lng, lat] of polygon[0]) {
          west = Math.min(west, lng);
          south = Math.min(south, lat);
          east = Math.max(east, lng);
          north = Math.max(north, lat);
        }
      }
    }
  }

  return [
    [west, south],
    [east, north],
  ];
}
