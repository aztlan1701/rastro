"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useDashboardKeyboard } from "@/hooks/useDashboardKeyboard";
import { useRastroData } from "@/hooks/useRastroData";
import type { EstadoData, TabId } from "@/lib/types";
import { AlertsTab } from "./AlertsTab";
import { DashboardHeader } from "./DashboardHeader";
import { DataFallbackBanner } from "./DataFallbackBanner";
import { DataTab } from "./DataTab";
import { EstadoPanel } from "./EstadoPanel";
import { LayerPanel } from "./LayerPanel";
import { LayerToggleButton } from "./LayerToggleButton";
import { MobileFeedDrawer } from "./MobileFeedDrawer";
import { NewsTab } from "./NewsTab";
import { RightPanel } from "./RightPanel";
import { buildStats, StatsBar } from "./StatsBar";

const MexicoMap = dynamic(
  () => import("./MexicoMap").then((mod) => mod.MexicoMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] flex-1 items-center justify-center text-[11px] tracking-widest text-[#556070] uppercase">
        Cargando mapa…
      </div>
    ),
  },
);

export function RastroDashboard() {
  const [selectedEstado, setSelectedEstado] = useState<EstadoData | null>(null);
  const [hoveredEstado, setHoveredEstado] = useState<EstadoData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("mapa");
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);

  const {
    estados,
    alertas,
    noticias,
    telegram,
    municipios,
    layers,
    meta,
    loading,
    toggleLayer,
  } = useRastroData();

  const totals = useMemo(() => {
    const totalNacional = estados.reduce((sum, estado) => sum + estado.total, 0);
    const totalNuevos = estados.reduce((sum, estado) => sum + estado.nuevos30d, 0);
    const totalLocalizados = estados.reduce((sum, estado) => sum + estado.localizados, 0);
    const amberActivas = alertas.filter((alerta) => alerta.activa).length;

    return buildStats(
      totalNacional,
      totalNuevos,
      totalLocalizados,
      amberActivas,
      estados.length,
    );
  }, [alertas, estados]);

  const handleSelectEstado = (estado: EstadoData | null) => {
    if (estado && selectedEstado?.id === estado.id) {
      setSelectedEstado(null);
      return;
    }
    setSelectedEstado(estado);
  };

  useDashboardKeyboard({
    activeTab,
    onTabChange: setActiveTab,
    onToggleLayerPanel: () => setLayerPanelOpen((open) => !open),
    layerPanelOpen,
    onToggleLayer: toggleLayer,
    onClearSelection: () => setSelectedEstado(null),
  });

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#030508] pb-14 text-[#e8e4dc] xl:pb-0">
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        meta={meta.rnpdno}
        loading={loading}
      />
      {!loading ? (
        <DataFallbackBanner meta={meta.rnpdno} onGoToData={() => setActiveTab("datos")} />
      ) : null}
      <StatsBar stats={totals} />

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <EstadoPanel
          hoveredEstado={hoveredEstado}
          selectedEstado={selectedEstado}
          estados={estados}
          onSelectEstado={handleSelectEstado}
        />

        <main className="relative flex min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden bg-grid">
          {activeTab === "mapa" && (
            <div
              id="tabpanel-mapa"
              role="tabpanel"
              aria-labelledby="tab-mapa"
              className="flex min-h-0 flex-1 flex-col"
            >
              <LayerToggleButton
                open={layerPanelOpen}
                onToggle={() => setLayerPanelOpen((open) => !open)}
              />
              <LayerPanel
                open={layerPanelOpen}
                layers={layers}
                onToggle={toggleLayer}
                onClose={() => setLayerPanelOpen(false)}
              />
              <MexicoMap
                estados={estados}
                alertas={alertas}
                noticias={noticias}
                telegram={telegram}
                municipios={municipios}
                layers={layers}
                selectedEstado={selectedEstado}
                hoveredEstado={hoveredEstado}
                onSelectEstado={handleSelectEstado}
                onHoverEstado={setHoveredEstado}
              />
            </div>
          )}
          {activeTab === "alertas" && (
            <motion.div
              key="alertas"
              id="tabpanel-alertas"
              role="tabpanel"
              aria-labelledby="tab-alertas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <AlertsTab alertas={alertas} />
            </motion.div>
          )}
          {activeTab === "noticias" && (
            <motion.div
              key="noticias"
              id="tabpanel-noticias"
              role="tabpanel"
              aria-labelledby="tab-noticias"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <NewsTab noticias={noticias} telegram={telegram} />
            </motion.div>
          )}
          {activeTab === "datos" && (
            <motion.div
              key="datos"
              id="tabpanel-datos"
              role="tabpanel"
              aria-labelledby="tab-datos"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <DataTab
                estados={estados}
                onSelectEstado={handleSelectEstado}
                onGoToMap={() => setActiveTab("mapa")}
              />
            </motion.div>
          )}
        </main>

        <RightPanel alertas={alertas} noticias={noticias} meta={meta} />
      </div>

      <MobileFeedDrawer
        alertas={alertas}
        noticias={noticias}
        onGoToAlerts={() => setActiveTab("alertas")}
        onGoToNews={() => setActiveTab("noticias")}
      />
    </div>
  );
}
