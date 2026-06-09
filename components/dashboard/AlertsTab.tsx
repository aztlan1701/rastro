"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AlertaAmber, AlertaFilter, ApiMeta } from "@/lib/types";
import { formatRelativeDate } from "@/lib/utils";
import { SourceMetaBar } from "./SourceMetaBar";
import { TabSectionHeader } from "./TabSectionHeader";

interface AlertsTabProps {
  alertas: AlertaAmber[];
  meta: ApiMeta;
  demoMode?: boolean;
  portalReachable?: boolean;
}

const FILTERS: AlertaFilter[] = ["todas", "activas", "cerradas"];

export function AlertsTab({ alertas, meta, demoMode, portalReachable }: AlertsTabProps) {
  const [filter, setFilter] = useState<AlertaFilter>("todas");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = alertas.filter((alerta) => {
    if (filter === "todas") return true;
    return filter === "activas" ? alerta.activa : !alerta.activa;
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <SourceMetaBar
        sourceId="amber"
        meta={meta}
        extra={
          demoMode
            ? `Modo demostración · Portal FGR ${portalReachable ? "accesible" : "no verificado"}`
            : undefined
        }
      />
      {demoMode ? (
        <div
          role="note"
          className="mb-5 rounded-md border border-[#ffb300]/20 bg-[#ffb300]/8 px-4 py-3 text-[11px] text-[#c0bfb8]"
        >
          Las alertas mostradas son datos ficticios de demostración. Para casos reales consulte{" "}
          <a
            href="https://alertaamber.fgr.org.mx/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ffb300] underline"
          >
            alertaamber.fgr.org.mx
          </a>
          .
        </div>
      ) : null}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <TabSectionHeader
          className="mb-0"
          title="Alertas AMBER / ALBA"
          subtitle={
            demoMode ? "Demostración · verificar en portal FGR" : "Casos activos · FGR"
          }
        />
        <div className="flex gap-1.5" role="group" aria-label="Filtrar alertas">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`rounded-sm border px-3 py-1 text-[11px] tracking-widest uppercase transition-colors ${
                filter === item
                  ? "border-[#ffb300] bg-[#ffb300]/15 text-[#ffb300]"
                  : "border-white/8 text-[#556070] hover:text-[#aaa]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin alertas en este filtro"
          description="Prueba otro filtro o vuelve más tarde."
          action={{
            label: "Ver todas",
            onClick: () => setFilter("todas"),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((alerta, index) => (
            <motion.button
              key={alerta.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              aria-expanded={expandedId === alerta.id}
              onClick={() => setExpandedId(expandedId === alerta.id ? null : alerta.id)}
              className={`rounded-sm border p-4 text-left transition-colors hover:bg-[#ffb300]/6 ${
                alerta.activa
                  ? "animate-alert-pulse border-[#ffb300]/25"
                  : "border-white/5"
              }`}
            >
              <div className="mb-2.5 flex justify-between">
                <span
                  className={`rounded-sm border px-2 py-0.5 text-[11px] font-bold tracking-[0.12em] uppercase ${
                    alerta.activa
                      ? "border-[#ffb300]/30 bg-[#ffb300]/10 text-[#ffb300]"
                      : "border-white/6 bg-white/[0.04] text-[#556070]"
                  }`}
                >
                  {alerta.activa ? "● Activa" : "✓ Localizada"}
                </span>
                <span className="text-[11px] text-[#3a4558]">
                {formatRelativeDate(alerta.fecha)}
              </span>
              </div>
              <div className="font-display text-base font-bold text-white">{alerta.nombre}</div>
              <p className="mt-1 text-[11px] text-[#888]">
                {alerta.edad} años · {alerta.municipio}, {alerta.estado}
              </p>
              {expandedId === alerta.id && (
                <p className="animate-fade-in mt-3 border-l-2 border-[#ffb300] bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-[#aaa]">
                  {alerta.descripcion}
                </p>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
