import type { FeatureCollection } from "geojson";
import type { MunicipioAgg } from "@/lib/types";
import { STATE_ID_TO_INEGI } from "@/lib/inegi-codes";

export function estadoIdToGeoPath(estadoId: string): string | null {
  const cve = STATE_ID_TO_INEGI[estadoId];
  if (!cve) return null;
  return `/geo/municipios/${cve}.geojson`;
}

export async function loadMunicipiosGeoJson(
  estadoId: string,
): Promise<FeatureCollection | null> {
  const path = estadoIdToGeoPath(estadoId);
  if (!path) return null;
  const response = await fetch(path);
  if (!response.ok) return null;
  return response.json() as Promise<FeatureCollection>;
}

export function mergeMunicipioCounts(
  geojson: FeatureCollection,
  municipios: MunicipioAgg[],
): FeatureCollection {
  const byCve = new Map(municipios.map((row) => [row.cvegeo, row]));

  return {
    type: "FeatureCollection",
    features: geojson.features.map((feature) => {
      const cvegeo = String(feature.properties?.CVEGEO ?? "").padStart(5, "0");
      const data = byCve.get(cvegeo);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          CVEGEO: cvegeo,
          NOM_MUN: feature.properties?.NOM_MUN ?? data?.nombre ?? "",
          total: data?.total ?? 0,
          hasData: Boolean(data),
        },
      };
    }),
  };
}
