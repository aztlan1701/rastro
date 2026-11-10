"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { DASHBOARD_TABS } from "@/lib/dashboard-tabs";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: "1 – 4", action: "Cambiar pestaña (Mapa, Noticias, Datos, Buscar)" },
  { keys: "← →", action: "Pestaña anterior / siguiente" },
  { keys: "Home / End", action: "Primera / última pestaña" },
  { keys: "L", action: "Abrir / cerrar capas del mapa" },
  { keys: "N", action: "Alternar noticias geo (en Mapa)" },
  { keys: "Esc", action: "Cerrar panel / limpiar selección" },
  { keys: "?", action: "Mostrar esta ayuda" },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>(open, onClose);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar ayuda de atajos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70"
          />
          <motion.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed top-1/2 left-1/2 z-[61] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-edge/15 bg-canvas p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="shortcuts-title" className="font-display text-base font-bold text-ink-strong">
                Atajos de teclado
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] text-muted hover:text-ink-3"
              >
                Cerrar
              </button>
            </div>
            <ul className="space-y-2">
              {SHORTCUTS.map((item) => (
                <li key={item.keys} className="flex items-start justify-between gap-4 text-[11px]">
                  <kbd className="shrink-0 rounded-sm border border-edge/15 bg-surface px-2 py-1 font-mono text-[#a16207]">
                    {item.keys}
                  </kbd>
                  <span className="text-right text-ink-3">{item.action}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] text-faint">
              Pestañas: {DASHBOARD_TABS.map((tab) => tab.label).join(" · ")}
            </p>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
