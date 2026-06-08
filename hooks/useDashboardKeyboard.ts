"use client";

import { useEffect } from "react";
import type { LayerId, TabId } from "@/lib/types";

interface DashboardKeyboardOptions {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onToggleLayerPanel: () => void;
  layerPanelOpen: boolean;
  onToggleLayer: (layerId: LayerId) => void;
  onClearSelection: () => void;
}

const TAB_KEYS: Record<string, TabId> = {
  "1": "mapa",
  "2": "alertas",
  "3": "noticias",
  "4": "datos",
};

export function useDashboardKeyboard({
  activeTab,
  onTabChange,
  onToggleLayerPanel,
  layerPanelOpen,
  onToggleLayer,
  onClearSelection,
}: DashboardKeyboardOptions) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Escape") {
        if (layerPanelOpen) onToggleLayerPanel();
        onClearSelection();
        return;
      }

      const tab = TAB_KEYS[event.key];
      if (tab) {
        onTabChange(tab);
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "l") {
        onToggleLayerPanel();
        return;
      }
      if (key === "a" && activeTab === "mapa") {
        onToggleLayer("amber_activas");
        return;
      }
      if (key === "n" && activeTab === "mapa") {
        onToggleLayer("noticias_geo");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeTab,
    layerPanelOpen,
    onClearSelection,
    onTabChange,
    onToggleLayer,
    onToggleLayerPanel,
  ]);
}
