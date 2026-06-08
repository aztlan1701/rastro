"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LayerState } from "@/lib/types";

interface LayerPanelProps {
  open: boolean;
  layers: LayerState[];
  onToggle: (layerId: LayerState["id"]) => void;
  onClose: () => void;
}

export function LayerPanel({ open, layers, onToggle, onClose }: LayerPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          id="layer-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed right-0 bottom-0 left-0 z-30 max-h-[55vh] overflow-auto rounded-t-md border border-white/8 bg-[#030508]/98 p-4 backdrop-blur-md md:absolute md:top-14 md:right-auto md:bottom-auto md:left-3 md:max-h-none md:w-[240px] md:rounded-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] tracking-[0.12em] text-[#556070] uppercase">
              Capas del mapa
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de capas"
              className="text-[11px] text-[#556070] hover:text-[#aaa]"
            >
              Esc
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {layers.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => onToggle(layer.id)}
                className={`flex items-center justify-between rounded-sm border px-2.5 py-2 text-left transition-colors ${
                  layer.enabled
                    ? "border-white/12 bg-white/[0.04]"
                    : "border-white/5 bg-transparent hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: layer.enabled ? layer.color : "#3a4558" }}
                  />
                  <span className="text-[11px] text-[#c0bfb8]">{layer.label}</span>
                </div>
                <span className="text-[11px] text-[#556070]">{layer.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-white/6 pt-2 text-[11px] leading-relaxed text-[#3a4558]">
            Atajos: 1-4 tabs · L capas · A AMBER · N noticias
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
