"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  buildEstadosGeoJson,
  maplibreChoroplethExpression,
  maplibreMunicipalChoroplethExpression,
} from "@/lib/geo/choropleth";
import {
  bindPointLayerHover,
  buildNewsGeoJson,
  NEWS_DOT_COLOR_EXPRESSION,
  showEstadoPopup,
} from "@/lib/geo/map-sources";
import {
  loadOfficialStatesGeoJson,
  mergeOfficialEstadosGeoJson,
} from "@/lib/geo/states-geojson";
import { loadMunicipiosGeoJson, mergeMunicipioCounts } from "@/lib/geo/municipios-geojson";
import {
  getMapFitPadding,
  getMapFocusPadding,
  MEXICO_MAP_DEFAULT,
} from "@/lib/map-view";
import type {
  EstadoData,
  LayerState,
  MunicipioAgg,
  MunicipioPoint,
  Noticia,
} from "@/lib/types";
import { escapeHtml, formatNum } from "@/lib/utils";
import { MapLegend } from "./MapLegend";
import { useMexicoMap } from "@/hooks/useMexicoMap";

const DEFAULT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const FALLBACK_MAP_STYLE = "https://demotiles.maplibre.org/style.json";

const MEXICO_FRAME_SW: [number, number] = [-117.85, 14.15];
const MEXICO_FRAME_NE: [number, number] = [-86.65, 33.05];
const MEXICO_FRAME_CENTER: [number, number] = [-102.25, 23.6];

const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const WORLD_TILE_SIZE = 512;
/** Suficiente para encuadrar el país completo en la pantalla de un celular. */
const MAP_MIN_ZOOM = 2.6;

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

  // MapLibre usa teselas de 512 px: a zoom z el mundo mide 512 · 2^z px de ancho.
  // Con 256 el cálculo salía un nivel de más y México quedaba recortado.
  const zoomLat = Math.log2((height / WORLD_TILE_SIZE) * (360 / latSpan));
  const zoomLng = Math.log2((width / WORLD_TILE_SIZE) * (360 / lngSpan) / Math.cos(latRad));
  const zoom = Math.min(zoomLat, zoomLng) - 0.05;

  return Math.min(Math.max(zoom, MAP_MIN_ZOOM), 10);
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
  noticias: Noticia[];
  municipios: MunicipioPoint[];
  layers: LayerState[];
  selectedEstado: EstadoData | null;
  hoveredEstado: EstadoData | null;
  onSelectEstado: (estado: EstadoData | null) => void;
  onHoverEstado: (estado: EstadoData | null) => void;
  onResetSelection: () => void;
  onMunicipiosLoaded?: (count: number) => void;
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
  noticias,
  municipios,
  layers,
  selectedEstado,
  hoveredEstado,
  onSelectEstado,
  onHoverEstado,
  onResetSelection,
  onMunicipiosLoaded,
}: MexicoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const layersInitializedRef = useRef(false);
  const styleFallbackUsedRef = useRef(false);
  const lastFocusedIdRef = useRef<string | null>(null);
  /** Qué hay bajo el cursor (estado, municipio o noticia), para reaccionar solo al cambiar. */
  const hoverKeyRef = useRef<string | null>(null);
  const userMovedMapRef = useRef(false);
  const layoutFitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queueLayoutFit = useCallback((map: maplibregl.Map) => {
    if (layoutFitTimerRef.current) clearTimeout(layoutFitTimerRef.current);
    layoutFitTimerRef.current = setTimeout(() => {
      layoutFitTimerRef.current = null;
      if (userMovedMapRef.current || selectedEstadoRef.current) return;
      frameMexico(map);
    }, 120);
  }, []);

  const municipiosRef = useRef(municipios);
  const noticiasRef = useRef(noticias);
  const layersRef = useRef(layers);
  const estadosRef = useRef(estados);
  const onHoverRef = useRef(onHoverEstado);
  const onSelectRef = useRef(onSelectEstado);
  const estadoCentroidsRef = useRef(new Map<string, { lng: number; lat: number }>());
  const selectedEstadoRef = useRef(selectedEstado);
  const hoveredEstadoRef = useRef(hoveredEstado);
  const onMunicipiosLoadedRef = useRef(onMunicipiosLoaded);
  const lastMunicipiosCountRef = useRef<number | null>(null);
  const municipalFuenteRef = useRef("CSV sep-2023");
  const municipalUnidadRef = useRef("registros (incluye localizadas)");

  useEffect(() => {
    onMunicipiosLoadedRef.current = onMunicipiosLoaded;
  }, [onMunicipiosLoaded]);

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
  const showNews = layerEnabled(layers, "noticias_geo");

  useEffect(() => {
    estadosRef.current = estados;
    noticiasRef.current = noticias;
    layersRef.current = layers;
    municipiosRef.current = municipios;
    onHoverRef.current = onHoverEstado;
    onSelectRef.current = onSelectEstado;
    estadoCentroidsRef.current = estadoCentroids;
    // Patrón "latest ref" deliberado: este ref se lee dentro de queueLayoutFit
    // (useCallback), por lo que la regla lo marca como inmutable; aquí solo
    // sincronizamos el último valor dentro de un efecto, lo cual es correcto.
    // eslint-disable-next-line react-hooks/immutability
    selectedEstadoRef.current = selectedEstado;
    hoveredEstadoRef.current = hoveredEstado;
    officialTemplateRef.current = officialTemplate;
    buildChoroplethRef.current = buildChoropleth;
  }, [estados, estadoCentroids, hoveredEstado, layers, municipios, noticias, onHoverEstado, onSelectEstado, selectedEstado, officialTemplate, buildChoropleth]);

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
    const showNewsLayer = layerEnabled(currentLayers, "noticias_geo");

    (map.getSource("estados-choropleth") as maplibregl.GeoJSONSource | undefined)?.setData(
      buildChoroplethRef.current(estadosRef.current),
    );
    (map.getSource("noticias-geo") as maplibregl.GeoJSONSource | undefined)?.setData(
      buildNewsGeoJson(noticiasRef.current),
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

    if (map.getLayer("municipios-fill")) {
      const showMuni =
        showMunicipiosLayer && Boolean(selectedEstadoRef.current);
      map.setLayoutProperty(
        "municipios-fill",
        "visibility",
        showMuni ? "visible" : "none",
      );
      map.setLayoutProperty(
        "municipios-outline",
        "visibility",
        showMuni ? "visible" : "none",
      );
      if (showEstadosLayer && showMuni) {
        map.setPaintProperty("estados-fill", "fill-opacity", 0.18);
      } else if (showEstadosLayer) {
        map.setPaintProperty("estados-fill", "fill-opacity", 0.78);
      }
    }

    if (map.getLayer("noticias-geo-dots")) {
      map.setLayoutProperty(
        "noticias-geo-dots",
        "visibility",
        showNewsLayer ? "visible" : "none",
      );
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !layersInitializedRef.current) return;

    const activeMap = map;
    const showMunicipiosLayer = layerEnabled(layers, "rnpdno_municipios");
    let cancelled = false;

    function reportCount(count: number) {
      if (lastMunicipiosCountRef.current === count) return;
      lastMunicipiosCountRef.current = count;
      onMunicipiosLoadedRef.current?.(count);
    }

    async function loadMunicipalChoropleth(estado: EstadoData) {
      try {
        const [geo, aggResponse] = await Promise.all([
          loadMunicipiosGeoJson(estado.id),
          fetch(`/api/rnpdno/municipios?estado=${encodeURIComponent(estado.id)}`).then(
            async (response) => {
              if (!response.ok) throw new Error(`municipios ${response.status}`);
              return response.json() as Promise<{
                municipios: MunicipioAgg[];
                fuente?: string;
                universo?: string;
              }>;
            },
          ),
        ]);
        if (cancelled || !geo) return;

        const merged = mergeMunicipioCounts(geo, aggResponse.municipios);
        const source = activeMap.getSource("municipios-choropleth") as
          | maplibregl.GeoJSONSource
          | undefined;
        source?.setData(merged);
        municipalFuenteRef.current =
          aggResponse.fuente === "cnb-tablero" ? "tablero CNB" : "CSV sep-2023";
        municipalUnidadRef.current =
          aggResponse.universo === "desaparecidas_y_no_localizadas"
            ? "desaparecidas y no localizadas"
            : "registros (incluye localizadas)";
        reportCount(aggResponse.municipios.length);
        syncMapLayers();
      } catch {
        if (cancelled) return;
        const source = activeMap.getSource("municipios-choropleth") as
          | maplibregl.GeoJSONSource
          | undefined;
        source?.setData(EMPTY_FEATURE_COLLECTION);
        reportCount(0);
        syncMapLayers();
      }
    }

    if (!selectedEstado || !showMunicipiosLayer) {
      const source = activeMap.getSource("municipios-choropleth") as
        | maplibregl.GeoJSONSource
        | undefined;
      source?.setData(EMPTY_FEATURE_COLLECTION);
      reportCount(0);
      syncMapLayers();
      return () => {
        cancelled = true;
      };
    }

    void loadMunicipalChoropleth(selectedEstado);
    return () => {
      cancelled = true;
    };
    // Solo reaccionar a selección / toggle de capa / mapa listo — no a cada
    // actualización de `layers.count` (eso disparaba un bucle de setState).
  }, [mapReady, selectedEstado?.id, showMunicipios, syncMapLayers]);

  const initializeLayers = useCallback(
    (map: maplibregl.Map, popup: maplibregl.Popup) => {
      if (layersInitializedRef.current) return;

      map.addSource("estados-choropleth", {
        type: "geojson",
        data: buildChoroplethRef.current(estadosRef.current),
      });

      map.addSource("municipios-choropleth", {
        type: "geojson",
        data: EMPTY_FEATURE_COLLECTION,
      });

      map.addSource("noticias-geo", {
        type: "geojson",
        data: buildNewsGeoJson(noticiasRef.current),
      });

      map.addLayer({
        id: "estados-fill",
        type: "fill",
        source: "estados-choropleth",
        paint: {
          "fill-color": maplibreChoroplethExpression(),
          "fill-opacity": 0.78,
        },
      });

      map.addLayer({
        id: "estados-outline",
        type: "line",
        source: "estados-choropleth",
        paint: {
          "line-color": "#5c2a1e",
          "line-width": 0.6,
          "line-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "municipios-fill",
        type: "fill",
        source: "municipios-choropleth",
        layout: { visibility: "none" },
        paint: {
          "fill-color": maplibreMunicipalChoroplethExpression(),
          "fill-opacity": [
            "case",
            ["boolean", ["get", "hasData"], false],
            0.72,
            0.12,
          ],
        },
      });

      map.addLayer({
        id: "municipios-outline",
        type: "line",
        source: "municipios-choropleth",
        layout: { visibility: "none" },
        paint: {
          "line-color": "#5c2a1e",
          "line-width": 0.5,
          "line-opacity": 0.45,
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

      const municipioPopupHtml = (properties: Record<string, unknown>) => {
        const nombre = String(properties.NOM_MUN ?? properties.nombre ?? "Municipio");
        const detalle = properties.hasData
          ? `${formatNum(Number(properties.total ?? 0))} ${escapeHtml(municipalUnidadRef.current)} · ${escapeHtml(municipalFuenteRef.current)}`
          : `Sin dato en ${escapeHtml(municipalFuenteRef.current)}`;
        return `<div class="rastro-popup-inner"><strong>${escapeHtml(nombre)}</strong><span>${detalle}</span></div>`;
      };

      // Con la capa municipal a la vista el popup del estado no se fija: taparía
      // los municipios, y el panel lateral ya muestra sus cifras.
      // Se pregunta por la intención (capa activa + estado elegido), no por la
      // visibilidad del momento: los polígonos tardan en cargar y, en pantallas
      // táctiles, el popup se fijaba justo en ese intervalo.
      const municipiosVisibles = () =>
        layerEnabled(layersRef.current, "rnpdno_municipios") &&
        Boolean(selectedEstadoRef.current);

      const showRestingPopup = () => {
        const selected = selectedEstadoRef.current;
        if (selected && !municipiosVisibles()) {
          showEstadoPopup(map, popup, selected, estadoCentroidsRef.current);
          return;
        }
        popup.remove();
      };

      // Tras un toque el navegador emite eventos de ratón sintéticos (mover,
      // salir). No son un cursor real: si se atendieran, borrarían el popup que
      // el propio toque acaba de abrir. En táctil solo cuenta el `click`.
      let lastTouchAt = 0;
      map.on("touchstart", () => {
        lastTouchAt = Date.now();
      });
      const fromTouch = () => Date.now() - lastTouchAt < 1000;

      const clearHover = () => {
        if (fromTouch()) return;
        if (hoverKeyRef.current === null) return;
        hoverKeyRef.current = null;
        map.getCanvas().style.cursor = "";
        onHoverRef.current(null);
        showRestingPopup();
      };

      // `mouseenter`/`mouseleave` solo avisan al entrar o salir de la capa
      // completa, no al pasar de un polígono al contiguo. Por eso el hover se
      // resuelve en cada movimiento, consultando qué hay bajo el cursor.
      map.on("mousemove", (event) => {
        if (fromTouch()) return;
        if (
          map.getLayer("noticias-geo-dots") &&
          map.queryRenderedFeatures(event.point, { layers: ["noticias-geo-dots"] }).length > 0
        ) {
          // Los puntos de noticias gestionan su propio popup.
          hoverKeyRef.current = "noticia";
          return;
        }

        const capas = ["municipios-fill", "estados-fill"].filter((id) => map.getLayer(id));
        const features = map.queryRenderedFeatures(event.point, { layers: capas });

        const municipio = features.find((feature) => feature.layer.id === "municipios-fill");
        if (municipio?.properties) {
          const nombre = String(municipio.properties.NOM_MUN ?? "Municipio");
          const key = `municipio:${municipio.properties.CVEGEO ?? nombre}`;
          map.getCanvas().style.cursor = "pointer";
          if (hoverKeyRef.current !== key) {
            hoverKeyRef.current = key;
            onHoverRef.current(null);
            popup.setHTML(municipioPopupHtml(municipio.properties));
          }
          popup.setLngLat(event.lngLat).addTo(map);
          return;
        }

        const estadoFeature = features.find((feature) => feature.layer.id === "estados-fill");
        const estado = estadoFeature
          ? estadosRef.current.find((item) => item.id === estadoFeature.properties?.id)
          : undefined;
        if (estado) {
          const key = `estado:${estado.id}`;
          const isSelected = selectedEstadoRef.current?.id === estado.id;
          map.getCanvas().style.cursor = "pointer";
          if (hoverKeyRef.current !== key) {
            hoverKeyRef.current = key;
            onHoverRef.current(estado);
            if (isSelected) {
              showRestingPopup();
            } else {
              popup.setHTML(
                `<div class="rastro-popup-inner"><strong>${escapeHtml(estado.nombre)}</strong><span>${formatNum(estado.total)} desaparecidas y no localizadas · clic para fijar</span></div>`,
              );
            }
          }
          if (!isSelected) popup.setLngLat(event.lngLat).addTo(map);
          return;
        }

        clearHover();
      });

      // El cursor salió del mapa (hacia un panel, por ejemplo).
      map.on("mouseout", clearHover);

      map.on("click", (event) => {
        const municipioFeature = map.queryRenderedFeatures(event.point, {
          layers: ["municipios-fill"],
        })[0];
        if (municipioFeature?.properties) {
          popup
            .setLngLat(event.lngLat)
            .setHTML(municipioPopupHtml(municipioFeature.properties))
            .addTo(map);
          return;
        }

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
            // El efecto de selección decide si el popup queda fijo.
            hoverKeyRef.current = `estado:${estado.id}`;
            return;
          }
        }

        const newsFeature = map.queryRenderedFeatures(event.point, {
          layers: ["noticias-geo-dots"],
        })[0];
        if (newsFeature?.properties) {
          popup
            .setLngLat(event.lngLat)
            .setHTML(
              `<div class="rastro-popup-inner"><strong>${escapeHtml(newsFeature.properties.tipo ?? "Noticia")}</strong><span>${escapeHtml(newsFeature.properties.titulo ?? "")}</span></div>`,
            )
            .addTo(map);
        }
      });

      bindPointLayerHover(
        map,
        "noticias-geo-dots",
        popup,
        (properties) =>
          `<strong>${escapeHtml(properties.tipo ?? "Noticia")}</strong><span>${escapeHtml(properties.titulo ?? "")}</span>`,
        selectedEstadoRef,
        estadoCentroidsRef,
      );

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

  // Mantener los refs "última versión" sincronizados fuera del render. Escribir
  // `ref.current` en el cuerpo del componente está prohibido por las reglas de
  // hooks; useRef ya los inicializa con el primer valor, así que este efecto
  // solo refresca en renders posteriores.
  useEffect(() => {
    initializeLayersRef.current = initializeLayers;
    queueLayoutFitRef.current = queueLayoutFit;
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const mapStyle =
      process.env.NEXT_PUBLIC_MAP_STYLE ?? DEFAULT_MAP_STYLE;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: MEXICO_MAP_DEFAULT.center,
      zoom: MEXICO_MAP_DEFAULT.zoom,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: 10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    // En pantallas chicas la atribución arranca plegada (sigue a un toque en la "i").
    if (window.matchMedia("(max-width: 1023px)").matches) {
      map.once("load", () => {
        const attribution = map.getContainer().querySelector(".maplibregl-ctrl-attrib");
        attribution?.classList.remove("maplibregl-compact-show");
        attribution?.removeAttribute("open");
      });
    }
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
    choropleth,
    layers,
    mapReady,
    municipios,
    noticias,
    showEstados,
    showMunicipios,
    showNews,
    syncMapLayers,
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
      map.setPaintProperty("estados-fill", "fill-opacity", 0.78);
      return;
    }

    if (selectedEstado && lastFocusedIdRef.current !== selectedEstado.id) {
      focusMapOnEstado(map, selectedEstado.id, estadoCentroids, getMapFocusPadding());
      lastFocusedIdRef.current = selectedEstado.id;
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
      0.92,
      0.6,
    ]);
  }, [estadoCentroids, hoveredEstado, mapReady, selectedEstado]);

  // Popup fijo del estado seleccionado. Va en su propio efecto para que dependa
  // solo de la selección: si reaccionara al hover, borraría el popup que el
  // cursor acaba de abrir sobre otro estado o municipio.
  useEffect(() => {
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!mapReady || !map || !popup || !selectedEstado) return;
    // Con municipios a la vista el popup fijo los taparía; ver `showRestingPopup`.
    if (showMunicipios) popup.remove();
    else showEstadoPopup(map, popup, selectedEstado, estadoCentroids);
  }, [estadoCentroids, mapReady, selectedEstado, showMunicipios]);

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
    <div className="relative min-h-0 w-full flex-1 lg:min-h-[420px]">
      <div ref={containerRef} className="rastro-map absolute inset-0 h-full w-full" aria-label="Mapa de México" />
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
      {hasMapFocus ? (
        <button
          type="button"
          onClick={handleResetView}
          className="absolute top-12 right-3 z-20 rounded-sm border border-edge/15 bg-canvas/95 px-3 py-1.5 text-[11px] text-ink-2 backdrop-blur-md transition-colors hover:border-edge/30 hover:text-ink-strong lg:top-3"
        >
          Ver todo México
        </button>
      ) : null}
      <MapLegend defaultCollapsedOnMobile />
    </div>
  );
}
