"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildEstadosGeoJson, filterMunicipiosByBbox, maplibreChoroplethExpression } from "@/lib/geo/choropleth";
import {
  bindPointLayerHover,
  buildAlertGeoJson,
  buildMunicipioGeoJson,
  buildNewsGeoJson,
  NEWS_DOT_COLOR_EXPRESSION,
  showEstadoPopup,
} from "@/lib/geo/map-sources";
import {
  loadOfficialStatesGeoJson,
  mergeOfficialEstadosGeoJson,
} from "@/lib/geo/states-geojson";
import {
  getMapFitPadding,
  getMapFocusPadding,
  MEXICO_MAP_DEFAULT,
} from "@/lib/map-view";
import type {
  AlertaAmber,
  EstadoData,
  LayerState,
  MunicipioPoint,
  Noticia,
  TelegramPost,
} from "@/lib/types";
import { formatNum } from "@/lib/utils";
import { MapLegend } from "./MapLegend";
import { useMexicoMap } from "@/hooks/useMexicoMap";

const DEFAULT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const FALLBACK_MAP_STYLE = "https://demotiles.maplibre.org/style.json";

const MEXICO_FRAME_SW: [number, number] = [-117.85, 14.15];
const MEXICO_FRAME_NE: [number, number] = [-86.65, 33.05];
const MEXICO_FRAME_CENTER: [number, number] = [-102.25, 23.6];

function getMexicoFrameZoom(map: maplibregl.Map): number {
  const padding = getMapFitPadding();
  const width = Math.max(
    map.getContainer().clientWidth - padding.left - padding.right,
    1,
  );
  const height = Math.max(
    map.getContainer().clientHeight - padding.top - padding.bottom,
    1,
  );

  const latSpan = MEXICO_FRAME_NE[1] - MEXICO_FRAME_SW[1];
  const lngSpan = MEXICO_FRAME_NE[0] - MEXICO_FRAME_SW[0];
  const latRad = (MEXICO_FRAME_CENTER[1] * Math.PI) / 180;

  const zoomLat = Math.log2((height / 256) * (360 / latSpan));
  const zoomLng = Math.log2((width / 256) * (360 / lngSpan) / Math.cos(latRad));
  const zoom = Math.min(zoomLat, zoomLng) - 0.05;

  return Math.min(Math.max(zoom, 4), 10);
}

function frameMexico(map: maplibregl.Map, duration = 0) {
  map.resize();
  map.easeTo({
    center: MEXICO_FRAME_CENTER,
    zoom: getMexicoFrameZoom(map),
    padding: getMapFitPadding(),
    duration,
  });
}

interface MexicoMapProps {
  estados: EstadoData[];
  alertas: AlertaAmber[];
  noticias: Noticia[];
  telegram: TelegramPost[];
  municipios: MunicipioPoint[];
  layers: LayerState[];
  selectedEstado: EstadoData | null;
  hoveredEstado: EstadoData | null;
  onSelectEstado: (estado: EstadoData | null) => void;
  onHoverEstado: (estado: EstadoData | null) => void;
  onResetSelection: () => void;
}

function layerEnabled(layers: LayerState[], id: LayerState["id"]) {
  return layers.find((layer) => layer.id === id)?.enabled ?? false;
}

function buildEstadoCentroids(geoJson: FeatureCollection): Map<string, { lng: number; lat: number }> {
  const centroids = new Map<string, { lng: number; lat: number }>();

  for (const feature of geoJson.features) {
    const props = feature.properties as {
      id?: string;
      centerLng?: number;
      centerLat?: number;
    } | null;
    if (!props?.id || typeof props.centerLng !== "number" || typeof props.centerLat !== "number") {
      continue;
    }
    centroids.set(props.id, { lng: props.centerLng, lat: props.centerLat });
  }

  return centroids;
}

function focusMapOnEstado(
  map: maplibregl.Map,
  estadoId: string,
  centroids: Map<string, { lng: number; lat: number }>,
  padding: ReturnType<typeof getMapFocusPadding>,
) {
  const center = centroids.get(estadoId);
  if (!center) return;

  map.easeTo({
    center: [center.lng, center.lat],
    zoom: Math.max(map.getZoom(), 5.2),
    duration: 600,
    padding,
  });
}

function resetMapView(
  map: maplibregl.Map,
  _estados: EstadoData[],
  duration = 600,
) {
  frameMexico(map, duration);
}

export function MexicoMap({
  estados,
  alertas,
  noticias,
  telegram,
  municipios,
  layers,
  selectedEstado,
  hoveredEstado,
  onSelectEstado,
  onHoverEstado,
  onResetSelection,
}: MexicoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const layersInitializedRef = useRef(false);
  const styleFallbackUsedRef = useRef(false);
  const lastFocusedIdRef = useRef<string | null>(null);
  const userMovedMapRef = useRef(false);
  const layoutFitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedEstadoRef = useRef(selectedEstado);

  const queueLayoutFit = useCallback((map: maplibregl.Map) => {
    if (layoutFitTimerRef.current) clearTimeout(layoutFitTimerRef.current);
    layoutFitTimerRef.current = setTimeout(() => {
      layoutFitTimerRef.current = null;
      if (userMovedMapRef.current || selectedEstadoRef.current) return;
      frameMexico(map);
    }, 120);
  }, []);

  const municipiosRef = useRef(municipios);
  const alertasRef = useRef(alertas);
  const noticiasRef = useRef(noticias);
  const telegramRef = useRef(telegram);
  const layersRef = useRef(layers);
  const estadosRef = useRef(estados);
  const onHoverRef = useRef(onHoverEstado);
  const onSelectRef = useRef(onSelectEstado);
  const estadoCentroidsRef = useRef(new Map<string, { lng: number; lat: number }>());
  const hoveredEstadoRef = useRef(hoveredEstado);

  const [mapReady, setMapReady] = useState(false);
  const { liveMessage } = useMexicoMap(selectedEstado, hoveredEstado);
  const [officialTemplate, setOfficialTemplate] = useState<Awaited<
    ReturnType<typeof loadOfficialStatesGeoJson>
  > | null>(null);

  const buildChoropleth = useCallback(
    (items: EstadoData[]): FeatureCollection => {
      if (officialTemplate) return mergeOfficialEstadosGeoJson(officialTemplate, items);
      return buildEstadosGeoJson(items) as FeatureCollection;
    },
    [officialTemplate],
  );

  const officialTemplateRef = useRef(officialTemplate);
  const buildChoroplethRef = useRef(buildChoropleth);

  const choropleth = useMemo(() => buildChoropleth(estados), [buildChoropleth, estados]);
  const estadoCentroids = useMemo(() => buildEstadoCentroids(choropleth), [choropleth]);
  const showEstados = layerEnabled(layers, "rnpdno_estados");
  const showMunicipios = layerEnabled(layers, "rnpdno_municipios");
  const showAmber = layerEnabled(layers, "amber_activas");
  const showNews = layerEnabled(layers, "noticias_geo");

  useEffect(() => {
    estadosRef.current = estados;
    alertasRef.current = alertas;
    noticiasRef.current = noticias;
    telegramRef.current = telegram;
    layersRef.current = layers;
    municipiosRef.current = municipios;
    onHoverRef.current = onHoverEstado;
    onSelectRef.current = onSelectEstado;
    estadoCentroidsRef.current = estadoCentroids;
    selectedEstadoRef.current = selectedEstado;
    hoveredEstadoRef.current = hoveredEstado;
    officialTemplateRef.current = officialTemplate;
    buildChoroplethRef.current = buildChoropleth;
  }, [alertas, estados, estadoCentroids, hoveredEstado, layers, municipios, noticias, onHoverEstado, onSelectEstado, selectedEstado, telegram, officialTemplate, buildChoropleth]);

  useEffect(() => {
    loadOfficialStatesGeoJson()
      .then(setOfficialTemplate)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!officialTemplate || !mapRef.current || !layersInitializedRef.current) return;
    (mapRef.current.getSource("estados-choropleth") as maplibregl.GeoJSONSource | undefined)?.setData(
      buildChoroplethRef.current(estadosRef.current),
    );
  }, [officialTemplate]);

  const syncMapLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !layersInitializedRef.current) return;

    const currentLayers = layersRef.current;
    const showEstadosLayer = layerEnabled(currentLayers, "rnpdno_estados");
    const showMunicipiosLayer = layerEnabled(currentLayers, "rnpdno_municipios");
    const showAmberLayer = layerEnabled(currentLayers, "amber_activas");
    const showNewsLayer = layerEnabled(currentLayers, "noticias_geo");

    (map.getSource("estados-choropleth") as maplibregl.GeoJSONSource | undefined)?.setData(
      buildChoroplethRef.current(estadosRef.current),
    );
    (map.getSource("alertas") as maplibregl.GeoJSONSource | undefined)?.setData(
      buildAlertGeoJson(alertasRef.current),
    );
    (map.getSource("noticias-geo") as maplibregl.GeoJSONSource | undefined)?.setData(
      buildNewsGeoJson(noticiasRef.current, telegramRef.current),
    );

    if (map.getLayer("estados-fill")) {
      map.setLayoutProperty(
        "estados-fill",
        "visibility",
        showEstadosLayer ? "visible" : "none",
      );
      map.setLayoutProperty(
        "estados-outline",
        "visibility",
        showEstadosLayer ? "visible" : "none",
      );
    }

    if (map.getLayer("municipios-points")) {
      map.setLayoutProperty(
        "municipios-points",
        "visibility",
        showMunicipiosLayer ? "visible" : "none",
      );
      if (showMunicipiosLayer) {
        const bounds = map.getBounds();
        const visible = filterMunicipiosByBbox(municipiosRef.current, {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        });
        (map.getSource("municipios") as maplibregl.GeoJSONSource).setData(
          buildMunicipioGeoJson(visible),
        );
      }
    }

    if (map.getLayer("alertas-dots")) {
      map.setLayoutProperty(
        "alertas-dots",
        "visibility",
        showAmberLayer ? "visible" : "none",
      );
    }

    if (map.getLayer("noticias-geo-dots")) {
      map.setLayoutProperty(
        "noticias-geo-dots",
        "visibility",
        showNewsLayer ? "visible" : "none",
      );
    }
  }, []);

  const initializeLayers = useCallback(
    (map: maplibregl.Map, popup: maplibregl.Popup) => {
      if (layersInitializedRef.current) return;

      map.addSource("estados-choropleth", {
        type: "geojson",
        data: buildChoroplethRef.current(estadosRef.current),
      });

      map.addSource("municipios", {
        type: "geojson",
        data: buildMunicipioGeoJson([]),
      });

      map.addSource("alertas", {
        type: "geojson",
        data: buildAlertGeoJson(alertasRef.current),
      });

      map.addSource("noticias-geo", {
        type: "geojson",
        data: buildNewsGeoJson(noticiasRef.current, telegramRef.current),
      });

      map.addLayer({
        id: "estados-fill",
        type: "fill",
        source: "estados-choropleth",
        paint: {
          "fill-color": maplibreChoroplethExpression(),
          "fill-opacity": 0.55,
        },
      });

      map.addLayer({
        id: "estados-outline",
        type: "line",
        source: "estados-choropleth",
        paint: {
          "line-color": "#ffffff",
          "line-width": 0.6,
          "line-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "municipios-points",
        type: "circle",
        source: "municipios",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "total"], 1, 3, 20, 8, 100, 12],
          "circle-color": "#4a9eff",
          "circle-opacity": 0.65,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#1a2030",
        },
      });

      map.addLayer({
        id: "alertas-dots",
        type: "circle",
        source: "alertas",
        paint: {
          "circle-radius": 6,
          "circle-color": "#ffb300",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffb300",
          "circle-opacity": 0.9,
        },
      });

      map.addLayer({
        id: "noticias-geo-dots",
        type: "circle",
        source: "noticias-geo",
        paint: {
          "circle-radius": 5,
          "circle-color": NEWS_DOT_COLOR_EXPRESSION,
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("mouseenter", "estados-fill", (event) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (!feature?.properties) return;

        const estado = estadosRef.current.find((item) => item.id === feature.properties?.id);
        if (!estado) return;

        onHoverRef.current(estado);

        if (selectedEstadoRef.current?.id === estado.id) return;

        popup
          .setLngLat(event.lngLat)
          .setHTML(
            `<div class="rastro-popup-inner"><strong>${estado.nombre}</strong><span>${formatNum(estado.total)} registradas · clic para fijar</span></div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", "estados-fill", () => {
        map.getCanvas().style.cursor = "";
        onHoverRef.current(null);

        const selected = selectedEstadoRef.current;
        if (selected) {
          showEstadoPopup(map, popup, selected, estadoCentroidsRef.current);
          return;
        }
        popup.remove();
      });

      map.on("click", (event) => {
        const estadoFeature = map.queryRenderedFeatures(event.point, {
          layers: ["estados-fill"],
        })[0];

        if (estadoFeature?.properties) {
          const estado = estadosRef.current.find(
            (item) => item.id === estadoFeature.properties?.id,
          );
          if (estado) {
            onHoverRef.current(estado);
            onSelectRef.current(estado);
            showEstadoPopup(map, popup, estado, estadoCentroidsRef.current);
            return;
          }
        }

        const amberFeature = map.queryRenderedFeatures(event.point, {
          layers: ["alertas-dots"],
        })[0];
        if (amberFeature?.properties) {
          popup
            .setLngLat(event.lngLat)
            .setHTML(
              `<div class="rastro-popup-inner"><strong>${amberFeature.properties.nombre ?? "Alerta AMBER"}</strong><span>Alerta activa</span></div>`,
            )
            .addTo(map);
          return;
        }

        const municipioFeature = map.queryRenderedFeatures(event.point, {
          layers: ["municipios-points"],
        })[0];
        if (municipioFeature?.properties) {
          popup
            .setLngLat(event.lngLat)
            .setHTML(
              `<div class="rastro-popup-inner"><strong>${municipioFeature.properties.nombre ?? "Municipio"}</strong><span>${formatNum(Number(municipioFeature.properties.total ?? 0))} registradas</span></div>`,
            )
            .addTo(map);
          return;
        }

        const newsFeature = map.queryRenderedFeatures(event.point, {
          layers: ["noticias-geo-dots"],
        })[0];
        if (newsFeature?.properties) {
          popup
            .setLngLat(event.lngLat)
            .setHTML(
              `<div class="rastro-popup-inner"><strong>${newsFeature.properties.tipo ?? "Noticia"}</strong><span>${newsFeature.properties.titulo ?? ""}</span></div>`,
            )
            .addTo(map);
        }
      });

      bindPointLayerHover(
        map,
        "alertas-dots",
        popup,
        (properties) =>
          `<strong>${properties.nombre ?? "Alerta AMBER"}</strong><span>Alerta activa</span>`,
        selectedEstadoRef,
        estadoCentroidsRef,
      );

      bindPointLayerHover(
        map,
        "municipios-points",
        popup,
        (properties) =>
          `<strong>${properties.nombre ?? "Municipio"}</strong><span>${formatNum(Number(properties.total ?? 0))} registradas</span>`,
        selectedEstadoRef,
        estadoCentroidsRef,
      );

      bindPointLayerHover(
        map,
        "noticias-geo-dots",
        popup,
        (properties) =>
          `<strong>${properties.tipo ?? "Noticia"}</strong><span>${properties.titulo ?? ""}</span>`,
        selectedEstadoRef,
        estadoCentroidsRef,
      );

      map.on("moveend", () => {
        if (!map.getSource("municipios")) return;
        if (!layerEnabled(layersRef.current, "rnpdno_municipios")) return;

        const bounds = map.getBounds();
        const visible = filterMunicipiosByBbox(municipiosRef.current, {
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        });
        (map.getSource("municipios") as maplibregl.GeoJSONSource).setData(
          buildMunicipioGeoJson(visible),
        );
      });

      layersInitializedRef.current = true;
      syncMapLayers();
      frameMexico(map);
      queueLayoutFit(map);
      setMapReady(true);
    },
    [queueLayoutFit, syncMapLayers],
  );

  const initializeLayersRef = useRef(initializeLayers);
  const queueLayoutFitRef = useRef(queueLayoutFit);

  useEffect(() => {
    initializeLayersRef.current = initializeLayers;
    queueLayoutFitRef.current = queueLayoutFit;
  }, [initializeLayers, queueLayoutFit]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const mapStyle =
      process.env.NEXT_PUBLIC_MAP_STYLE ?? DEFAULT_MAP_STYLE;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: MEXICO_MAP_DEFAULT.center,
      zoom: MEXICO_MAP_DEFAULT.zoom,
      minZoom: 4.0,
      maxZoom: 10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: "rastro-popup",
    });
    popupRef.current = popup;

    map.on("dragstart", (event) => {
      if (event.originalEvent) userMovedMapRef.current = true;
    });
    map.on("zoomstart", (event) => {
      if (event.originalEvent) userMovedMapRef.current = true;
    });

    map.on("load", () => {
      frameMexico(map);
      initializeLayersRef.current(map, popup);
    });

    map.once("idle", () => {
      if (userMovedMapRef.current || selectedEstadoRef.current) return;
      frameMexico(map);
    });

    map.on("error", (event) => {
      if (styleFallbackUsedRef.current) return;
      const message = event.error?.message ?? "";
      if (!message.includes("style") && !message.includes("tile")) return;

      styleFallbackUsedRef.current = true;
      layersInitializedRef.current = false;
      setMapReady(false);
      map.setStyle(FALLBACK_MAP_STYLE);
      map.once("load", () => {
        frameMexico(map);
        initializeLayersRef.current(map, popup);
      });
    });

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
      if (userMovedMapRef.current || selectedEstadoRef.current) return;
      queueLayoutFitRef.current(map);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (layoutFitTimerRef.current) clearTimeout(layoutFitTimerRef.current);
      popup.remove();
      map.remove();
      mapRef.current = null;
      layersInitializedRef.current = false;
      styleFallbackUsedRef.current = false;
      setMapReady(false);
    };
    // Map instance must be created once; layer/data updates go through syncMapLayers.
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    syncMapLayers();
  }, [
    alertas,
    choropleth,
    layers,
    mapReady,
    municipios,
    noticias,
    showAmber,
    showEstados,
    showMunicipios,
    showNews,
    syncMapLayers,
    telegram,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    const highlight = selectedEstado ?? hoveredEstado;
    if (!mapReady || !map || !map.getLayer("estados-outline")) return;

    if (!highlight) {
      lastFocusedIdRef.current = null;
      if (!selectedEstado) popup?.remove();
      map.setPaintProperty("estados-outline", "line-width", 0.6);
      map.setPaintProperty("estados-fill", "fill-opacity", 0.55);
      return;
    }

    if (selectedEstado && lastFocusedIdRef.current !== selectedEstado.id) {
      focusMapOnEstado(map, selectedEstado.id, estadoCentroids, getMapFocusPadding());
      lastFocusedIdRef.current = selectedEstado.id;
    }

    if (selectedEstado && popup) {
      showEstadoPopup(map, popup, selectedEstado, estadoCentroids);
    }

    map.setPaintProperty("estados-outline", "line-width", [
      "case",
      ["==", ["get", "id"], highlight.id],
      2.5,
      0.6,
    ]);
    map.setPaintProperty("estados-fill", "fill-opacity", [
      "case",
      ["==", ["get", "id"], highlight.id],
      0.85,
      0.45,
    ]);
  }, [estadoCentroids, hoveredEstado, mapReady, selectedEstado]);

  const hasMapFocus = Boolean(selectedEstado || hoveredEstado);

  const handleResetView = () => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (map && mapReady) {
      userMovedMapRef.current = false;
      resetMapView(map, estadosRef.current);
      lastFocusedIdRef.current = null;
    }
    popup?.remove();
    onResetSelection();
  };

  return (
    <div className="relative min-h-[420px] w-full flex-1">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label="Mapa de México" />
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
      {hasMapFocus ? (
        <button
          type="button"
          onClick={handleResetView}
          className="absolute top-12 right-3 z-20 rounded-sm border border-white/10 bg-[#030508]/95 px-3 py-1.5 text-[11px] text-[#c0bfb8] backdrop-blur-md transition-colors hover:border-white/20 hover:text-white lg:top-3"
        >
          Ver todo México
        </button>
      ) : null}
      <MapLegend defaultCollapsedOnMobile />
    </div>
  );
}
