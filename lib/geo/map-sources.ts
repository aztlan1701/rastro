import type { RefObject } from "react";
import type maplibregl from "maplibre-gl";
import type { ExpressionSpecification } from "maplibre-gl";
import type { AlertaAmber, EstadoData, MunicipioPoint, Noticia, TelegramPost } from "@/lib/types";
import { formatNum } from "@/lib/utils";

export function buildEstadoPopupHtml(estado: EstadoData): string {
  return `<div class="rastro-popup-inner"><strong>${estado.nombre}</strong><span>${formatNum(estado.total)} registradas</span><span>+${estado.nuevos30d} este mes</span></div>`;
}

export function getEstadoPopupLngLat(
  estado: EstadoData,
  centroids: Map<string, { lng: number; lat: number }>,
): [number, number] {
  const center = centroids.get(estado.id);
  return center ? [center.lng, center.lat] : [estado.lng, estado.lat];
}

export function showEstadoPopup(
  map: maplibregl.Map,
  popup: maplibregl.Popup,
  estado: EstadoData,
  centroids: Map<string, { lng: number; lat: number }>,
) {
  popup
    .setLngLat(getEstadoPopupLngLat(estado, centroids))
    .setHTML(buildEstadoPopupHtml(estado))
    .addTo(map);
}

export function bindPointLayerHover(
  map: maplibregl.Map,
  layerId: string,
  popup: maplibregl.Popup,
  labelHtml: (properties: Record<string, unknown>) => string,
  selectedEstadoRef: RefObject<EstadoData | null>,
  estadoCentroidsRef: RefObject<Map<string, { lng: number; lat: number }>>,
) {
  map.on("mouseenter", layerId, (event) => {
    map.getCanvas().style.cursor = "pointer";
    const feature = event.features?.[0];
    if (!feature?.properties) return;

    popup
      .setLngLat(event.lngLat)
      .setHTML(
        `<div class="rastro-popup-inner">${labelHtml(feature.properties as Record<string, unknown>)}</div>`,
      )
      .addTo(map);
  });

  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
    const selected = selectedEstadoRef.current;
    if (selected) {
      showEstadoPopup(map, popup, selected, estadoCentroidsRef.current);
      return;
    }
    popup.remove();
  });
}

export function buildAlertGeoJson(alertas: AlertaAmber[]) {
  return {
    type: "FeatureCollection" as const,
    features: alertas
      .filter((alerta) => alerta.activa && alerta.lat && alerta.lng)
      .map((alerta) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [alerta.lng!, alerta.lat!],
        },
        properties: {
          id: alerta.id,
          nombre: alerta.nombre,
        },
      })),
  };
}

export function buildNewsGeoJson(noticias: Noticia[], telegram: TelegramPost[]) {
  const newsFeatures = noticias
    .filter((item) => item.lat && item.lng)
    .map((item) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [item.lng!, item.lat!],
      },
      properties: {
        id: item.id,
        titulo: item.titulo,
        tipo: item.tipo,
      },
    }));

  const tgFeatures = telegram
    .filter((post) => post.lat && post.lng)
    .map((post) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [post.lng!, post.lat!],
      },
      properties: {
        id: post.id,
        titulo: post.text.slice(0, 80),
        tipo: "telegram",
      },
    }));

  return {
    type: "FeatureCollection" as const,
    features: [...newsFeatures, ...tgFeatures],
  };
}

export function buildMunicipioGeoJson(municipios: MunicipioPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: municipios.map((point) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [point.lng, point.lat],
      },
      properties: {
        id: point.id,
        nombre: point.nombre,
        total: point.total,
      },
    })),
  };
}

export const NEWS_DOT_COLOR_EXPRESSION: ExpressionSpecification = [
  "match",
  ["get", "tipo"],
  "hallazgo",
  "#ff2d55",
  "alerta",
  "#ffb300",
  "telegram",
  "#00e5ff",
  "#00d084",
];
