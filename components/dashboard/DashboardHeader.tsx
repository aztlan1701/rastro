import type { ApiMeta, TabId } from "@/lib/types";
import { DataStatusBadge } from "./DataStatusBadge";

const TABS: { id: TabId; label: string; panelId: string }[] = [
  { id: "mapa", label: "Mapa", panelId: "tabpanel-mapa" },
  { id: "alertas", label: "Alertas", panelId: "tabpanel-alertas" },
  { id: "noticias", label: "Noticias", panelId: "tabpanel-noticias" },
  { id: "datos", label: "Datos", panelId: "tabpanel-datos" },
];

interface DashboardHeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  meta: ApiMeta;
  loading?: boolean;
}

export function DashboardHeader({
  activeTab,
  onTabChange,
  meta,
  loading,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/7 bg-[#030508]/95 px-4 py-3 backdrop-blur-md lg:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ff2d55]">
            <div className="h-2 w-2 animate-pulse-dot rounded-full bg-[#ff2d55]" />
          </div>
          <div>
            <div className="font-display text-xl font-black tracking-widest text-white">
              RASTRO
            </div>
            <div className="text-[11px] tracking-[0.15em] text-[#556070] uppercase">
              Personas desaparecidas · México
            </div>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-white/8 sm:block" />

        <nav className="flex gap-1" role="tablist" aria-label="Secciones del dashboard">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={tab.panelId}
              onClick={() => onTabChange(tab.id)}
              className={`border-b-2 px-3 py-2 text-[11px] tracking-widest uppercase transition-colors ${
                activeTab === tab.id
                  ? "border-[#ff2d55] text-[#e8e4dc]"
                  : "border-transparent text-[#556070] hover:text-[#aaa]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <span className="hidden text-[#556070] md:inline">
          Fuente: RNPDNO · CNB · Data Cívica
        </span>
        {loading ? (
          <span className="tracking-widest text-[#556070] uppercase">Cargando…</span>
        ) : (
          <DataStatusBadge meta={meta} />
        )}
      </div>
    </header>
  );
}
