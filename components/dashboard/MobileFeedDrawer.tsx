"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AlertaAmber, Noticia } from "@/lib/types";
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

  return (
    <div className="xl:hidden">
      <div className="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-between gap-2 border-t border-white/8 bg-[#030508]/95 px-4 py-2.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-[11px] tracking-wide text-[#c0bfb8] transition-colors hover:bg-white/[0.04]"
        >
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ffb300]" />
          Alertas y noticias
          {activasCount > 0 ? (
            <span className="rounded-sm bg-[#ffb300]/20 px-1.5 py-0.5 text-[11px] font-bold text-[#ffb300]">
              {activasCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onGoToAlerts}
          className="rounded-sm border border-white/10 px-3 py-2 text-[11px] text-[#556070] hover:text-[#aaa]"
        >
          Ver todo
        </button>
      </div>

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
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 bottom-0 left-0 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-t-md border border-white/10 bg-[#030508]"
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
                <FeedPanelContent alertas={alertas} noticias={noticias} compact />
              </div>
              <div className="flex gap-2 border-t border-white/8 p-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onGoToAlerts();
                  }}
                  className="flex-1 rounded-sm border border-[#ffb300]/30 py-2 text-[11px] text-[#ffb300] hover:bg-[#ffb300]/10"
                >
                  Ir a Alertas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onGoToNews();
                  }}
                  className="flex-1 rounded-sm border border-white/10 py-2 text-[11px] text-[#c0bfb8] hover:bg-white/[0.04]"
                >
                  Ir a Noticias
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
