"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getChoroplethLegendItems,
  MAP_MARKER_LEGEND,
} from "@/lib/geo/choropleth";

const LEGEND = getChoroplethLegendItems();
const MOBILE_QUERY = "(max-width: 1023px)";

function subscribeToMobileQuery(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches;
const getIsMobileOnServer = () => true;

interface MapLegendProps {
  /** Collapsed by default on small screens */
  defaultCollapsedOnMobile?: boolean;
}

export function MapLegend({ defaultCollapsedOnMobile = true }: MapLegendProps) {
  const isMobile = useSyncExternalStore(subscribeToMobileQuery, getIsMobile, getIsMobileOnServer);
  // null until the user toggles; until then the viewport decides.
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? (defaultCollapsedOnMobile ? !isMobile : true);
  const panelId = "map-legend-panel";

  return (
    <div className="absolute top-3 right-3 z-10 w-[220px] rounded-sm border border-edge/12 bg-canvas/95 text-[11px] backdrop-blur-md lg:bottom-3 lg:top-auto">
      <button
        type="button"
        onClick={() => setUserOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-ink-2 transition-colors hover:text-ink-strong"
      >
        <span className="tracking-widest text-muted uppercase">Leyenda</span>
        <span className="text-muted">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div id={panelId} className="border-t border-edge/10 px-3 pt-2 pb-3">
          <div className="mb-1 text-[11px] font-medium text-ink-2">
            Casos registradas por estado (RNPDNO)
          </div>
          <p className="mb-2 text-[11px] leading-snug text-faint">
            Límites estatales oficiales (GeoJSON) · datos RNPDNO sep 2023
          </p>
          {LEGEND.map((item) => (
            <div key={item.label} className="mb-1.5">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                <span className="text-ink-4">{item.label}</span>
              </div>
              <p className="ml-4 text-[11px] text-faint">{item.desc}</p>
            </div>
          ))}
          <div className="mt-2 space-y-1.5 border-t border-edge/10 pt-2">
            {MAP_MARKER_LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
                <span className="text-ink-4">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
