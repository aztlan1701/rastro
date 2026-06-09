"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LayerState } from "@/lib/types";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const LAYER_HINTS: Partial<Record<LayerState["id"], string>> = {
  rnpdno_municipios: "Puntos aproximados por municipio (coordenadas estimadas)",
  noticias_geo: "Carga GDELT y Telegram al activar la capa",
};

interface LayerPanelProps {
  open: boolean;
  layers: LayerState[];
  onToggle: (layerId: LayerState["id"]) => void;
  onClose: () => void;
}

export function LayerPanel({ open, layers, onToggle, onClose }: LayerPanelProps) {
  const trapRef = useFocusTrap<HTMLElement>(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          ref={trapRef}
          id="layer-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed right-0 bottom-0 left-0 z-30 max-h-[55vh] overflow-auto rounded-t-md border border-white/8 bg-[#030508]/98 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md md:absolute md:top-14 md:right-auto md:bottom-auto md:left-3 md:max-h-[calc(100%-5rem)] md:w-[240px] md:rounded-sm md:pb-4"
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
            {layers.map((layer) => {
              const municipiosUnavailable =
                layer.id === "rnpdno_municipios" && layer.count === 0;
              const disabled = municipiosUnavailable;

              return (
                <div key={layer.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={layer.enabled}
                    aria-disabled={disabled}
                    onClick={() => !disabled && onToggle(layer.id)}
                    className={`flex w-full items-center justify-between rounded-sm border px-2.5 py-2 text-left transition-colors ${
                      disabled
                        ? "cursor-not-allowed border-white/5 opacity-50"
                        : layer.enabled
                          ? "border-white/12 bg-white/[0.04]"
                          : "border-white/5 bg-transparent hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ background: layer.enabled ? layer.color : "#3a4558" }}
                      />
                      <span className="text-[11px] text-[#c0bfb8]">
                        {layer.label}
                        {municipiosUnavailable ? (
                          <span className="ml-1 text-[#3a4558]">(próximamente)</span>
                        ) : null}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#556070]">{layer.count}</span>
                  </button>
                  {(layer.count === 0 || municipiosUnavailable) && LAYER_HINTS[layer.id] ? (
                    <p className="mt-1 px-1 text-[11px] leading-snug text-[#3a4558]">
                      {LAYER_HINTS[layer.id]}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-3 border-t border-white/6 pt-2 text-[11px] leading-relaxed text-[#3a4558]">
            Atajos: 1–5 tabs · L capas · A AMBER · N noticias · ? ayuda
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
