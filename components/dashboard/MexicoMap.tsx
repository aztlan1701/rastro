"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildEstadosGeoJson, filterMunicipiosByBbox } from "@/lib/geo/choropleth";
import type {
  AlertaAmber,
  EstadoData,
  LayerState,
  MunicipioPoint,
  Noticia,
  TelegramPost,
} from "@/lib/types";
import { formatNum } from "@/lib/utils";

const DEFAULT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const FALLBACK_MAP_STYLE = "https://demotiles.maplibre.org/style.json";

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
}

const LEGEND = [
  { color: "#ff2d55", label: ">7,000" },
  { color: "#ff6b35", label: "5,000–7,000" },
  { color: "#ffb347", label: "3,500–5,000" },
  { color: "#ffd700", label: "2,000–3,500" },
  { color: "#4a9eff", label: "<2,000" },
];

function layerEnabled(layers: LayerState[], id: LayerState["id"]) {
  return layers.find((layer) => layer.id === id)?.enabled ?? false;
}

function buildAlertGeoJson(alertas: AlertaAmber[]) {
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

function buildNewsGeoJson(noticias: Noticia[], telegram: TelegramPost[]) {
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

function buildMunicipioGeoJson(municipios: MunicipioPoint[]) {
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

function colorExpression() {
  return [
    "step",
    ["get", "total"],
    "#4a9eff",
    2000,
    "#ffd700",
    3500,
    "#ffb347",
    5000,
    "#ff6b35",
    7000,
    "#ff2d55",
  ] as maplibregl.ExpressionSpecification;
}

function buildEstadoCentroids(
  geoJson: ReturnType<typeof buildEstadosGeoJson>,
): Map<string, { lng: number; lat: number }> {
  const centroids = new Map<string, { lng: number; lat: number }>();

  for (const feature of geoJson.features) {
    const { id, centerLng, centerLat } = feature.properties;
    if (typeof centerLng !== "number" || typeof centerLat !== "number") continue;
    centroids.set(id, { lng: centerLng, lat: centerLat });
  }

  return centroids;
}

function focusMapOnEstado(
  map: maplibregl.Map,
  estadoId: string,
  centroids: Map<string, { lng: number; lat: number }>,
) {
  const center = centroids.get(estadoId);
  if (!center) return;

  map.easeTo({
    center: [center.lng, center.lat],
    zoom: Math.max(map.getZoom(), 5.2),
    duration: 600,
  });
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
}: MexicoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const layersInitializedRef = useRef(false);
  const styleFallbackUsedRef = useRef(false);
  const lastFocusedIdRef = useRef<string | null>(null);

  const municipiosRef = useRef(municipios);
  const alertasRef = useRef(alertas);
  const noticiasRef = useRef(noticias);
  const telegramRef = useRef(telegram);
  const layersRef = useRef(layers);
  const estadosRef = useRef(estados);
  const onHoverRef = useRef(onHoverEstado);
  const onSelectRef = useRef(onSelectEstado);
  const estadoCentroidsRef = useRef(new Map<string, { lng: number; lat: number }>());

  const [mapReady, setMapReady] = useState(false);

  const choropleth = useMemo(() => buildEstadosGeoJson(estados), [estados]);
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
  }, [alertas, estados, estadoCentroids, layers, municipios, noticias, onHoverEstado, onSelectEstado, telegram]);

  const syncMapLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !layersInitializedRef.current) return;

    const currentLayers = layersRef.current;
    const showEstadosLayer = layerEnabled(currentLayers, "rnpdno_estados");
    const showMunicipiosLayer = layerEnabled(currentLayers, "rnpdno_municipios");
    const showAmberLayer = layerEnabled(currentLayers, "amber_activas");
    const showNewsLayer = layerEnabled(currentLayers, "noticias_geo");

    (map.getSource("estados-choropleth") as maplibregl.GeoJSONSource | undefined)?.setData(
      buildEstadosGeoJson(estadosRef.current),
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
        data: buildEstadosGeoJson(estadosRef.current),
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
          "fill-color": colorExpression(),
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
          "circle-color": [
            "match",
            ["get", "tipo"],
            "hallazgo",
            "#ff2d55",
            "alerta",
            "#ffb300",
            "telegram",
            "#00e5ff",
            "#00d084",
          ],
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

        const centerLng = feature.properties.centerLng;
        const centerLat = feature.properties.centerLat;
        const popupLngLat =
          typeof centerLng === "number" && typeof centerLat === "number"
            ? { lng: centerLng, lat: centerLat }
            : event.lngLat;

        popup
          .setLngLat(popupLngLat)
          .setHTML(
            `<div class="rastro-popup-inner"><strong>${estado.nombre}</strong><span>${formatNum(estado.total)} registradas</span></div>`,
          )
          .addTo(map);
      });

      map.on("mouseleave", "estados-fill", () => {
        map.getCanvas().style.cursor = "";
        onHoverRef.current(null);
        popup.remove();
      });

      map.on("click", "estados-fill", (event) => {
        const feature = event.features?.[0];
        if (!feature?.properties) return;
        const estado = estadosRef.current.find((item) => item.id === feature.properties?.id);
        if (estado) onSelectRef.current(estado);
      });

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
      map.resize();
      setMapReady(true);
    },
    [syncMapLayers],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const mapStyle =
      process.env.NEXT_PUBLIC_MAP_STYLE ?? DEFAULT_MAP_STYLE;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [-102.5, 23.5],
      zoom: 4.2,
      minZoom: 3.5,
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

    map.on("load", () => {
      initializeLayers(map, popup);
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
        initializeLayers(map, popup);
      });
    });

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      popup.remove();
      map.remove();
      mapRef.current = null;
      layersInitializedRef.current = false;
      styleFallbackUsedRef.current = false;
      setMapReady(false);
    };
  }, [initializeLayers]);

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
    const target = selectedEstado ?? hoveredEstado;
    if (!mapReady || !map || !map.getLayer("estados-outline")) return;

    if (!target) {
      lastFocusedIdRef.current = null;
      return;
    }

    if (lastFocusedIdRef.current !== target.id) {
      focusMapOnEstado(map, target.id, estadoCentroids);
      lastFocusedIdRef.current = target.id;
    }

    map.setPaintProperty("estados-outline", "line-width", [
      "case",
      ["==", ["get", "id"], target.id],
      2.5,
      0.6,
    ]);
    map.setPaintProperty("estados-fill", "fill-opacity", [
      "case",
      ["==", ["get", "id"], target.id],
      0.85,
      0.45,
    ]);
  }, [estadoCentroids, hoveredEstado, mapReady, selectedEstado]);

  return (
    <div className="relative min-h-[420px] w-full flex-1">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute right-3 bottom-3 z-10 max-w-[200px] rounded-sm border border-white/8 bg-[#030508]/90 p-3 text-[11px]">
        <div className="mb-2 text-[11px] tracking-widest text-[#556070] uppercase">
          Escala de casos
        </div>
        <p className="mb-2 text-[11px] leading-snug text-[#3a4558]">
          Pasa el cursor o haz clic en un estado
        </p>
        {LEGEND.map((item) => (
          <div key={item.label} className="mb-1 flex items-center gap-2">
            <div className="h-1.5 w-2.5 rounded-sm" style={{ background: item.color }} />
            <span className="text-[#888]">{item.label}</span>
          </div>
        ))}
        <div className="mt-2 space-y-1 border-t border-white/6 pt-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#ffb300]" />
            <span className="text-[#888]">Alerta AMBER</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00e5ff]" />
            <span className="text-[#888]">Telegram geo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
