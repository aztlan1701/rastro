import type { TabId } from "@/lib/types";
import { DASHBOARD_TABS } from "@/lib/dashboard-tabs";

interface MobileBottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40 border-t border-white/8 bg-[#030508]/98 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
      role="tablist"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-5">
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
            className={`py-2.5 text-[11px] tracking-wide uppercase transition-colors ${
              activeTab === tab.id
                ? "border-t-2 border-[#ff2d55] text-[#e8e4dc]"
                : "border-t-2 border-transparent text-[#556070]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
