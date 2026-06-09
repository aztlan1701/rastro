"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ALERTAS_AMBER, ESTADOS_DATA, NOTICIAS } from "@/lib/mock-data";
import type {
  AlertaAmber,
  ApiMeta,
  DashboardData,
  EstadoData,
  LayerId,
  LayerState,
  MunicipioPoint,
  Noticia,
  TelegramPost,
  VadSummary,
} from "@/lib/types";

const DEFAULT_LAYERS: LayerState[] = [
  { id: "rnpdno_estados", label: "RNPDNO estados", enabled: true, count: 0, color: "#ff2d55" },
  { id: "rnpdno_municipios", label: "Municipios", enabled: false, count: 0, color: "#4a9eff" },
  { id: "amber_activas", label: "AMBER activas", enabled: true, count: 0, color: "#ffb300" },
  { id: "noticias_geo", label: "Noticias geo", enabled: false, count: 0, color: "#00d084" },
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
  const [alertas, setAlertas] = useState<AlertaAmber[]>(ALERTAS_AMBER);
  const [noticias, setNoticias] = useState<Noticia[]>(NOTICIAS);
  const [telegram, setTelegram] = useState<TelegramPost[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioPoint[]>([]);
  const [layers, setLayers] = useState<LayerState[]>(DEFAULT_LAYERS);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<DashboardData["meta"]>({
    rnpdno: EMPTY_META,
    vad: EMPTY_META,
    amber: EMPTY_META,
    news: EMPTY_META,
    gdelt: EMPTY_META,
    telegram: EMPTY_META,
  });
  const [vad, setVad] = useState<VadSummary | null>(null);
  const [amberDemo, setAmberDemo] = useState(true);
  const [amberPortalReachable, setAmberPortalReachable] = useState(false);

  const fetchedLayers = useRef<Set<LayerId>>(new Set(["rnpdno_estados", "amber_activas"]));

  const refreshLayer = useCallback(async (layerId: LayerId) => {
    if (fetchedLayers.current.has(layerId)) return;

    if (layerId === "rnpdno_municipios") {
      fetchedLayers.current.add(layerId);
      return;
    }

    if (layerId === "noticias_geo") {
      fetchedLayers.current.add(layerId);
      try {
        const [gdelt, tg] = await Promise.all([
          fetchJson<{ noticias: Noticia[]; meta: ApiMeta }>("/api/gdelt"),
          fetchJson<{ posts: TelegramPost[]; meta: ApiMeta }>("/api/telegram-feed"),
        ]);
        setMeta((current) => ({ ...current, gdelt: gdelt.meta, telegram: tg.meta }));
        setTelegram(tg.posts);
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
        const [rnpdno, vadResponse, amber, news] = await Promise.all([
          fetchJson<{ estados: EstadoData[]; municipios: MunicipioPoint[]; meta: ApiMeta }>(
            "/api/rnpdno",
          ),
          fetchJson<{ summary: VadSummary; meta: ApiMeta }>("/api/volver-a-desaparecer"),
          fetchJson<{
            alertas: AlertaAmber[];
            meta: ApiMeta;
            demoMode?: boolean;
            portalReachable?: boolean;
          }>("/api/amber"),
          fetchJson<{ noticias: Noticia[]; meta: ApiMeta }>("/api/news"),
        ]);

        if (!active) return;

        setEstados(rnpdno.estados);
        setMunicipios(rnpdno.municipios);
        setVad(vadResponse.summary);
        setAlertas(amber.alertas);
        setAmberDemo(amber.demoMode ?? true);
        setAmberPortalReachable(amber.portalReachable ?? false);
        setNoticias(news.noticias);
        setMeta({
          rnpdno: rnpdno.meta,
          vad: vadResponse.meta,
          amber: amber.meta,
          news: news.meta,
          gdelt: EMPTY_META,
          telegram: EMPTY_META,
        });

        setLayers((current) =>
          current.map((layer) => {
            if (layer.id === "rnpdno_estados") {
              return { ...layer, count: rnpdno.estados.length };
            }
            if (layer.id === "rnpdno_municipios") {
              return { ...layer, count: rnpdno.municipios.length };
            }
            if (layer.id === "amber_activas") {
              return {
                ...layer,
                count: amber.alertas.filter((item) => item.activa).length,
              };
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

  useEffect(() => {
    const geoCount =
      noticias.filter((item) => item.lat && item.lng).length + telegram.length;
    setLayers((current) =>
      current.map((layer) =>
        layer.id === "noticias_geo" ? { ...layer, count: geoCount } : layer,
      ),
    );
  }, [noticias, telegram]);

  return {
    estados,
    alertas,
    noticias,
    telegram,
    municipios,
    layers,
    meta,
    vad,
    amberDemo,
    amberPortalReachable,
    loading,
    toggleLayer,
    setLayers,
  };
}
