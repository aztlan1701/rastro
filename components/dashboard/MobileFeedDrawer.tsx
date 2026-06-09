"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AlertaAmber, Noticia } from "@/lib/types";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { FeedPanelContent } from "./FeedPanelContent";

interface MobileFeedDrawerProps {
  alertas: AlertaAmber[];
  noticias: Noticia[];
  onGoToAlerts: () => void;
  onGoToNews: () => void;
}

export function MobileFeedDrawer({
  alertas,
  noticias,
  onGoToAlerts,
  onGoToNews,
}: MobileFeedDrawerProps) {
  const [open, setOpen] = useState(false);
  const activasCount = alertas.filter((alerta) => alerta.activa).length;
  const trapRef = useFocusTrap<HTMLElement>(open, () => setOpen(false));

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-3 z-30 flex items-center gap-2 rounded-sm border border-[#ffb300]/30 bg-[#030508]/95 px-3 py-2 text-[11px] text-[#ffb300] shadow-lg backdrop-blur-md"
        style={{ bottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ffb300]" />
        Alertas
        {activasCount > 0 ? (
          <span className="rounded-sm bg-[#ffb300]/20 px-1.5 font-bold">{activasCount}</span>
        ) : null}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60"
            />
            <motion.aside
              ref={trapRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 left-0 z-50 flex max-h-[65vh] flex-col overflow-hidden rounded-t-md border border-white/10 bg-[#030508]"
              style={{ bottom: "calc(3rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <span className="text-[11px] tracking-[0.12em] text-[#556070] uppercase">
                  Resumen en vivo
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[11px] text-[#556070] hover:text-[#aaa]"
                >
                  Cerrar
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <FeedPanelContent
                  alertas={alertas}
                  noticias={noticias}
                  compact
                  onGoToAlerts={() => {
                    setOpen(false);
                    onGoToAlerts();
                  }}
                  onGoToNews={() => {
                    setOpen(false);
                    onGoToNews();
                  }}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
