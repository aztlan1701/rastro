"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useDashboardKeyboard } from "@/hooks/useDashboardKeyboard";
import { useRastroData } from "@/hooks/useRastroData";
import type { EstadoData, TabId } from "@/lib/types";
import { sumOrNull } from "@/lib/utils";
import { DashboardHeader } from "./DashboardHeader";
import { DataFallbackBanner } from "./DataFallbackBanner";
import { DataTab } from "./DataTab";
import { EstadoPanel } from "./EstadoPanel";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { LayerPanel } from "./LayerPanel";
import { LayerToggleButton } from "./LayerToggleButton";
import { MobileBottomNav } from "./MobileBottomNav";
import { NewsTab } from "./NewsTab";
import { SearchTab } from "./SearchTab";
import { SourceMetaBar } from "./SourceMetaBar";
import { UsageDisclaimer } from "./UsageDisclaimer";
import { buildStats, StatsBar } from "./StatsBar";

const MexicoMap = dynamic(
  () => import("./MexicoMap").then((mod) => mod.MexicoMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] flex-1 items-center justify-center text-[11px] tracking-widest text-muted uppercase">
        Cargando mapa…
      </div>
    ),
  },
);

const subscribeNoop = () => () => {};

function readPinnedEstadoId() {
  try {
    return window.localStorage.getItem("RASTRO_TERRITORY_ESTADO");
  } catch {
    return null;
  }
}

const readPinnedEstadoIdOnServer = () => null;

export function RastroDashboard() {
  // undefined hasta que la persona selecciona o limpia; mientras tanto aplica el territorio fijado.
  const [selection, setSelectedEstado] = useState<EstadoData | null | undefined>(undefined);
  const [hoveredEstado, setHoveredEstado] = useState<EstadoData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("mapa");
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [panelAnnouncement, setPanelAnnouncement] = useState("");

  const {
    estados,
    noticias,
    municipios,
    layers,
    meta,
    vad,
    loading,
    toggleLayer,
    setLayers,
  } = useRastroData();

  const handleMunicipiosLoaded = useCallback((count: number) => {
    setLayers((current) => {
      const layer = current.find((item) => item.id === "rnpdno_municipios");
      if (!layer || layer.count === count) return current;
      return current.map((item) =>
        item.id === "rnpdno_municipios" ? { ...item, count } : item,
      );
    });
  }, [setLayers]);

  const pinnedEstadoId = useSyncExternalStore(
    subscribeNoop,
    readPinnedEstadoId,
    readPinnedEstadoIdOnServer,
  );
  const selectedEstado =
    selection === undefined
      ? (estados.find((item) => item.id === pinnedEstadoId) ?? null)
      : selection;

  const showFallbackBanner =
    !loading && (meta.rnpdno.status === "mock" || meta.rnpdno.status === "stale");

  const totals = useMemo(() => {
    const totalNacional = estados.reduce((sum, estado) => sum + estado.total, 0);
    const totalNuevos = sumOrNull(estados.map((estado) => estado.nuevos30d));
    const totalLocalizados = sumOrNull(estados.map((estado) => estado.localizados));

    return buildStats(
      totalNacional,
      totalNuevos,
      totalLocalizados,
      estados.length,
    );
  }, [estados]);

  const handleTabChange = (tab: TabId) => {
    setLayerPanelOpen(false);
    setActiveTab(tab);
  };

  const handleSelectEstado = (estado: EstadoData | null) => {
    setLayerPanelOpen(false);
    if (estado && selectedEstado?.id === estado.id) {
      setSelectedEstado(null);
      return;
    }
    setSelectedEstado(estado);
  };

  const handleResetSelection = () => {
    setSelectedEstado(null);
    setHoveredEstado(null);
  };

  useDashboardKeyboard({
    activeTab,
    onTabChange: handleTabChange,
    onToggleLayerPanel: () => setLayerPanelOpen((open) => !open),
    layerPanelOpen,
    onToggleLayer: toggleLayer,
    onClearSelection: handleResetSelection,
    onToggleShortcuts: () => setShortcutsOpen((open) => !open),
    shortcutsOpen,
  });

  useEffect(() => {
    const panel = document.getElementById(`tabpanel-${activeTab}`);
    panel?.focus({ preventScroll: true });
  }, [activeTab]);

  const showEstadoPanel = activeTab === "mapa";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] text-ink lg:h-auto lg:min-h-screen lg:pb-0">
      <a
        href={`#tabpanel-${activeTab}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-sm focus:border focus:border-edge/30 focus:bg-canvas focus:px-3 focus:py-2 focus:text-[11px] focus:text-ink-strong"
      >
        Saltar al contenido
      </a>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {panelAnnouncement}
      </div>

      <DashboardHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        meta={meta.rnpdno}
        loading={loading}
        hideStatusBadge={showFallbackBanner}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />
      {showFallbackBanner ? (
        <DataFallbackBanner meta={meta.rnpdno} onGoToData={() => handleTabChange("datos")} />
      ) : null}
      <UsageDisclaimer />
      {/* En celular las cifras nacionales solo acompañan al mapa sin selección;
          con un estado elegido o en otra pestaña, el espacio es para el contenido. */}
      <div className={showEstadoPanel && !selectedEstado ? "" : "hidden lg:block"}>
        <StatsBar stats={totals} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        {/* En celular el panel va debajo del mapa (order-2) y con altura acotada,
            para que el mapa sea lo primero que se ve. */}
        <div
          className={`${showEstadoPanel ? "flex" : "hidden xl:flex"} order-2 max-h-[42dvh] min-h-0 min-w-0 shrink-0 flex-col overflow-y-auto border-t border-edge/10 lg:max-h-none lg:overflow-visible lg:border-t-0 xl:order-none`}
        >
          <EstadoPanel
            hoveredEstado={hoveredEstado}
            selectedEstado={selectedEstado}
            estados={estados}
            vad={vad}
            onSelectEstado={handleSelectEstado}
            onAnnounce={setPanelAnnouncement}
          />
        </div>

        <main className="relative order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-grid lg:min-h-[420px] xl:order-none">
          <div
            id="tabpanel-mapa"
            role="tabpanel"
            aria-labelledby="tab-mapa"
            tabIndex={-1}
            hidden={activeTab !== "mapa"}
            aria-hidden={activeTab !== "mapa"}
            className={`relative flex min-h-0 flex-1 flex-col outline-none ${activeTab === "mapa" ? "" : "hidden"}`}
          >
            <div className="shrink-0 border-b border-edge/10 py-2 pr-3 pl-14 lg:py-3 lg:pr-4">
              <SourceMetaBar sourceId="rnpdno" meta={meta.rnpdno} dense />
            </div>
            {!layerPanelOpen ? (
              <LayerToggleButton
                open={layerPanelOpen}
                onToggle={() => setLayerPanelOpen(true)}
              />
            ) : null}
            <LayerPanel
              open={layerPanelOpen}
              layers={layers}
              onToggle={toggleLayer}
              onClose={() => setLayerPanelOpen(false)}
            />
            <MexicoMap
              estados={estados}
              noticias={noticias}
              municipios={municipios}
              layers={layers}
              selectedEstado={selectedEstado}
              hoveredEstado={hoveredEstado}
              onSelectEstado={handleSelectEstado}
              onHoverEstado={setHoveredEstado}
              onResetSelection={handleResetSelection}
              onMunicipiosLoaded={handleMunicipiosLoaded}
            />
          </div>

          <motion.div
            id="tabpanel-noticias"
            role="tabpanel"
            aria-labelledby="tab-noticias"
            tabIndex={-1}
            hidden={activeTab !== "noticias"}
            aria-hidden={activeTab !== "noticias"}
            initial={false}
            animate={activeTab === "noticias" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            className={`flex flex-1 flex-col overflow-hidden outline-none ${activeTab === "noticias" ? "" : "hidden"}`}
          >
            <NewsTab
              noticias={noticias}
              newsMeta={meta.news}
              gdeltMeta={meta.gdelt}
            />
          </motion.div>

          <motion.div
            id="tabpanel-datos"
            role="tabpanel"
            aria-labelledby="tab-datos"
            tabIndex={-1}
            hidden={activeTab !== "datos"}
            aria-hidden={activeTab !== "datos"}
            initial={false}
            animate={activeTab === "datos" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            className={`flex flex-1 flex-col overflow-hidden outline-none ${activeTab === "datos" ? "" : "hidden"}`}
          >
            <DataTab
              estados={estados}
              vad={vad}
              vadMeta={meta.vad}
              rnpdnoMeta={meta.rnpdno}
              onSelectEstado={handleSelectEstado}
              onGoToMap={() => handleTabChange("mapa")}
            />
          </motion.div>

          <motion.div
            id="tabpanel-buscar"
            role="tabpanel"
            aria-labelledby="tab-buscar"
            tabIndex={-1}
            hidden={activeTab !== "buscar"}
            aria-hidden={activeTab !== "buscar"}
            initial={false}
            animate={activeTab === "buscar" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            className={`flex flex-1 flex-col overflow-hidden outline-none ${activeTab === "buscar" ? "" : "hidden"}`}
          >
            <SearchTab
              estados={estados}
              onSelectEstado={handleSelectEstado}
              onGoToMap={() => handleTabChange("mapa")}
            />
          </motion.div>
        </main>
      </div>

      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
