import type { TabId } from "@/lib/types";

export interface DashboardTab {
  id: TabId;
  label: string;
  panelId: string;
  shortcut: string;
}

export const DASHBOARD_TABS: DashboardTab[] = [
  { id: "mapa", label: "Mapa", panelId: "tabpanel-mapa", shortcut: "1" },
  { id: "noticias", label: "Noticias", panelId: "tabpanel-noticias", shortcut: "2" },
  { id: "datos", label: "Datos", panelId: "tabpanel-datos", shortcut: "3" },
  { id: "buscar", label: "Buscar", panelId: "tabpanel-buscar", shortcut: "4" },
];

export const TAB_BY_SHORTCUT: Record<string, TabId> = Object.fromEntries(
  DASHBOARD_TABS.map((tab) => [tab.shortcut, tab.id]),
) as Record<string, TabId>;

export function getTabIndex(tabId: TabId): number {
  return DASHBOARD_TABS.findIndex((tab) => tab.id === tabId);
}

export function getAdjacentTab(tabId: TabId, direction: -1 | 1): TabId {
  const index = getTabIndex(tabId);
  const next = (index + direction + DASHBOARD_TABS.length) % DASHBOARD_TABS.length;
  return DASHBOARD_TABS[next].id;
}
