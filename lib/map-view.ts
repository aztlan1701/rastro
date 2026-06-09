import { getChoroplethBounds } from "@/lib/geo/choropleth";
import type { EstadoData } from "@/lib/types";

/** Matches Tailwind `xl` breakpoint — sidebar + three-column layout. */
export const XL_BREAKPOINT = 1280;

const CHOROPLETH_MARGIN = 0.35;

/** Geographic extent of Mexico (32 states), used to frame the map on load. */
export const MEXICO_FIT_BOUNDS: [[number, number], [number, number]] = [
  [-117.5, 14.5],
  [-87.0, 32.7],
];

export const MEXICO_MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-118.5, 14.0],
  [-86.0, 33.5],
];

export const MEXICO_MAP_DEFAULT = {
  center: [-102.25, 23.6] as [number, number],
  zoom: 4.6,
};

export const MEXICO_FIT_MAX_ZOOM = 6.8;

export interface MapViewportPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function unionBounds(
  a: [[number, number], [number, number]],
  b: [[number, number], [number, number]],
): [[number, number], [number, number]] {
  return [
    [Math.min(a[0][0], b[0][0]), Math.min(a[0][1], b[0][1])],
    [Math.max(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])],
  ];
}

export function getMexicoBounds(estados: EstadoData[]): [[number, number], [number, number]] {
  const choroplethBounds = getChoroplethBounds(estados);
  const bounds = choroplethBounds
    ? unionBounds(MEXICO_FIT_BOUNDS, choroplethBounds)
    : MEXICO_FIT_BOUNDS;

  return [
    [bounds[0][0] - CHOROPLETH_MARGIN, bounds[0][1] - CHOROPLETH_MARGIN],
    [bounds[1][0] + CHOROPLETH_MARGIN, bounds[1][1] + CHOROPLETH_MARGIN],
  ];
}

/** Minimal padding for fitBounds — side panels sit outside the map container. */
export function getMapFitPadding(): MapViewportPadding {
  if (typeof window === "undefined") {
    return { top: 16, bottom: 16, left: 16, right: 16 };
  }

  const isMobile = window.matchMedia(`(max-width: ${XL_BREAKPOINT - 1}px)`).matches;

  return {
    top: 48,
    bottom: isMobile ? 44 : 24,
    left: 16,
    right: 16,
  };
}

/** Padding when focusing a selected state (accounts for in-map overlays). */
export function getMapFocusPadding(): MapViewportPadding {
  if (typeof window === "undefined") {
    return { top: 48, bottom: 180, left: 48, right: 232 };
  }

  const isMobile = window.matchMedia(`(max-width: ${XL_BREAKPOINT - 1}px)`).matches;

  return {
    top: 48,
    bottom: isMobile ? 56 : 180,
    left: 48,
    right: isMobile ? 16 : 232,
  };
}

/** @deprecated Use getMapFitPadding or getMapFocusPadding instead. */
export function getMapViewportPadding(): MapViewportPadding {
  return getMapFitPadding();
}
