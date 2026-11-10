"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ESTADOS_DATA, NOTICIAS } from "@/lib/mock-data";
import type {
  ApiMeta,
  DashboardData,
  EstadoData,
  LayerId,
  LayerState,
  MunicipioPoint,
  Noticia,
  VadSummary,
} from "@/lib/types";

const DEFAULT_LAYERS: LayerState[] = [
  { id: "rnpdno_estados", label: "RNPDNO estados", enabled: true, count: 0, color: "#c8102e" },
  { id: "rnpdno_municipios", label: "Municipios", enabled: false, count: 0, color: "#1f6fd0" },
  { id: "noticias_geo", label: "Noticias geo", enabled: false, count: 0, color: "#0b7a52" },
];

const EMPTY_META: ApiMeta = {
  status: "mock",
  fetchedAt: "1970-01-01T00:00:00.000Z",
  source: "mock-data",
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} failed`);
  return response.json() as Promise<T>;
}

export function useRastroData() {
  const [estados, setEstados] = useState<EstadoData[]>(ESTADOS_DATA);
  const [noticias, setNoticias] = useState<Noticia[]>(NOTICIAS);
  const [municipios, setMunicipios] = useState<MunicipioPoint[]>([]);
  const [baseLayers, setLayers] = useState<LayerState[]>(DEFAULT_LAYERS);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<DashboardData["meta"]>({
    rnpdno: EMPTY_META,
    vad: EMPTY_META,
    news: EMPTY_META,
    gdelt: EMPTY_META,
  });
  const [vad, setVad] = useState<VadSummary | null>(null);

  const fetchedLayers = useRef<Set<LayerId>>(new Set(["rnpdno_estados"]));

  const refreshLayer = useCallback(async (layerId: LayerId) => {
    if (fetchedLayers.current.has(layerId)) return;

    if (layerId === "rnpdno_municipios") {
      fetchedLayers.current.add(layerId);
      return;
    }

    if (layerId === "noticias_geo") {
      fetchedLayers.current.add(layerId);
      try {
        const gdelt = await fetchJson<{ noticias: Noticia[]; meta: ApiMeta }>("/api/gdelt");
        setMeta((current) => ({ ...current, gdelt: gdelt.meta }));
        setNoticias((current) => {
          const merged = [...current];
          for (const item of gdelt.noticias) {
            if (!merged.some((existing) => existing.id === item.id)) {
              merged.push(item);
            }
          }
          return merged.slice(0, 50);
        });
      } catch {
        // keep existing
      }
    }
  }, []);

  const toggleLayer = useCallback(
    (layerId: LayerId) => {
      setLayers((current) =>
        current.map((layer) => {
          if (layer.id !== layerId) return layer;
          const enabled = !layer.enabled;
          if (enabled) void refreshLayer(layerId);
          return { ...layer, enabled };
        }),
      );
    },
    [refreshLayer],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [rnpdno, vadResponse, news] = await Promise.all([
          fetchJson<{ estados: EstadoData[]; municipios: MunicipioPoint[]; meta: ApiMeta }>(
            "/api/rnpdno",
          ),
          fetchJson<{ summary: VadSummary; meta: ApiMeta }>("/api/volver-a-desaparecer"),
          fetchJson<{ noticias: Noticia[]; meta: ApiMeta }>("/api/news"),
        ]);

        if (!active) return;

        setEstados(rnpdno.estados);
        setMunicipios(rnpdno.municipios);
        setVad(vadResponse.summary);
        setNoticias(news.noticias);
        setMeta({
          rnpdno: rnpdno.meta,
          vad: vadResponse.meta,
          news: news.meta,
          gdelt: EMPTY_META,
        });

        setLayers((current) =>
          current.map((layer) => {
            if (layer.id === "rnpdno_estados") {
              return { ...layer, count: rnpdno.estados.length };
            }
            if (layer.id === "rnpdno_municipios") {
              return { ...layer, count: rnpdno.municipios.length };
            }
            return layer;
          }),
        );
      } catch {
        // keep mock defaults
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const layers = useMemo(() => {
    const geoCount =
      noticias.filter((item) => item.lat && item.lng).length;
    return baseLayers.map((layer) =>
      layer.id === "noticias_geo" ? { ...layer, count: geoCount } : layer,
    );
  }, [baseLayers, noticias]);

  return {
    estados,
    noticias,
    municipios,
    layers,
    meta,
    vad,
    loading,
    toggleLayer,
    setLayers,
  };
}
