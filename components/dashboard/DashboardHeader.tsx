import type { ApiMeta, TabId } from "@/lib/types";
import { DASHBOARD_TABS } from "@/lib/dashboard-tabs";
import { DataStatusBadge } from "./DataStatusBadge";

interface DashboardHeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  meta: ApiMeta;
  loading?: boolean;
  hideStatusBadge?: boolean;
  onShowShortcuts?: () => void;
}

export function DashboardHeader({
  activeTab,
  onTabChange,
  meta,
  loading,
  hideStatusBadge,
  onShowShortcuts,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/7 bg-[#030508]/95 px-4 py-3 backdrop-blur-md lg:px-6">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 lg:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#ff2d55]">
            <div className="h-2 w-2 animate-pulse-dot rounded-full bg-[#ff2d55]" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-black tracking-widest text-white lg:text-xl">
              RASTRO
            </div>
            <div className="hidden text-[11px] tracking-[0.15em] text-[#556070] uppercase sm:block">
              Personas desaparecidas · México
            </div>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-white/8 lg:block" />

        <nav
          className="hidden gap-1 lg:flex"
          role="tablist"
          aria-label="Secciones del dashboard"
        >
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={tab.panelId}
              tabIndex={activeTab === tab.id ? 0 : -1}
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

      <div className="flex shrink-0 items-center gap-3 text-[11px]">
        <span className="hidden text-[#556070] xl:inline">
          Fuente: RNPDNO · CNB ·{" "}
          <a
            href="https://volveradesaparecer.datacivica.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#556070] underline decoration-white/20 underline-offset-2 hover:text-[#aaa]"
          >
            Data Cívica
          </a>
        </span>
        {onShowShortcuts ? (
          <button
            type="button"
            onClick={onShowShortcuts}
            aria-label="Atajos de teclado"
            title="Atajos de teclado (?)"
            className="rounded-sm border border-white/10 px-2 py-1 text-[#556070] hover:text-[#aaa]"
          >
            ?
          </button>
        ) : null}
        {loading ? (
          <span className="tracking-widest text-[#556070] uppercase">Cargando…</span>
        ) : hideStatusBadge ? null : (
          <DataStatusBadge meta={meta} />
        )}
      </div>
    </header>
  );
}
