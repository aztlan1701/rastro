"use client";

import { useEffect } from "react";
import type { LayerId, TabId } from "@/lib/types";
import {
  DASHBOARD_TABS,
  getAdjacentTab,
  TAB_BY_SHORTCUT,
} from "@/lib/dashboard-tabs";

interface DashboardKeyboardOptions {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onToggleLayerPanel: () => void;
  layerPanelOpen: boolean;
  onToggleLayer: (layerId: LayerId) => void;
  onClearSelection: () => void;
  onToggleShortcuts: () => void;
  shortcutsOpen: boolean;
}

const TAB_KEYS = TAB_BY_SHORTCUT;

export function useDashboardKeyboard({
  activeTab,
  onTabChange,
  onToggleLayerPanel,
  layerPanelOpen,
  onToggleLayer,
  onClearSelection,
  onToggleShortcuts,
  shortcutsOpen,
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
        if (shortcutsOpen) {
          onToggleShortcuts();
          return;
        }
        if (layerPanelOpen) onToggleLayerPanel();
        onClearSelection();
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        onTabChange(getAdjacentTab(activeTab, direction as 1 | -1));
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        onTabChange(DASHBOARD_TABS[0].id);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        onTabChange(DASHBOARD_TABS[DASHBOARD_TABS.length - 1].id);
        return;
      }

      if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
        event.preventDefault();
        onToggleShortcuts();
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
    onToggleShortcuts,
    shortcutsOpen,
  ]);
}
