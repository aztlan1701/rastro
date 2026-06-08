"use client";

import { useState } from "react";
import type { EstadoData } from "@/lib/types";
import { formatNum, getColor, getIntensity } from "@/lib/utils";

interface EstadoPanelProps {
  hoveredEstado: EstadoData | null;
  selectedEstado: EstadoData | null;
  estados: EstadoData[];
  onSelectEstado: (estado: EstadoData | null) => void;
}

export function EstadoPanel({
  hoveredEstado,
  selectedEstado,
  estados,
  onSelectEstado,
}: EstadoPanelProps) {
  const [rankingExpanded, setRankingExpanded] = useState(false);
  const ranked = [...estados].sort((a, b) => b.total - a.total);

  const isHoverOnly = Boolean(hoveredEstado && !selectedEstado);
  const isSelected = Boolean(selectedEstado);
  const displayEstado = selectedEstado ?? hoveredEstado;

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden border-r border-white/6 lg:w-[300px]">
      <div
        className={`min-h-[160px] border-b border-white/6 p-5 ${
          isSelected ? "border-l-2 border-l-[#ff2d55]" : isHoverOnly ? "opacity-90" : ""
        }`}
      >
        {displayEstado ? (
          <div className="animate-fade-in">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div
                  className={`mb-1 text-[11px] tracking-[0.12em] uppercase ${
                    isSelected ? "text-[#ff2d55]" : "text-[#556070]"
                  }`}
                >
                  {isSelected ? "Estado seleccionado" : "Explorando"}
                </div>
                <div className="font-display text-lg font-bold text-white">
                  {displayEstado.nombre}
                </div>
              </div>
              <div
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background: getColor(displayEstado.total),
                  boxShadow: isSelected ? `0 0 8px ${getColor(displayEstado.total)}` : undefined,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { l: "Total", v: formatNum(displayEstado.total), c: getColor(displayEstado.total) },
                { l: "Este mes", v: `+${displayEstado.nuevos30d}`, c: "#ff6b35" },
                { l: "Mujeres", v: formatNum(displayEstado.mujeres), c: "#ff80ab" },
                { l: "Hombres", v: formatNum(displayEstado.hombres), c: "#4a9eff" },
                { l: "Localizadas", v: formatNum(displayEstado.localizados), c: "#00d084" },
                { l: "Municipio↑", v: displayEstado.municipioAlto, c: "#aaa" },
              ].map((item) => (
                <div
                  key={item.l}
                  className="rounded-sm border border-white/5 bg-white/[0.03] px-2.5 py-2"
                >
                  <div className="mb-1 text-[11px] tracking-[0.1em] text-[#556070] uppercase">
                    {item.l}
                  </div>
                  <div
                    className="font-display text-sm font-bold"
                    style={{ color: item.c }}
                  >
                    {item.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center opacity-50">
            <p className="text-center text-[11px] tracking-wide text-[#556070] uppercase">
              Pasa el cursor o haz clic
              <br />
              en un estado del mapa
            </p>
            <p className="mt-2 text-center text-[11px] text-[#3a4558]">
              También puedes elegir uno del ranking
            </p>
          </div>
        )}
      </div>

      <div className="lg:flex lg:flex-1 lg:flex-col lg:overflow-auto">
        <div className="flex items-center justify-between px-5 py-2.5 lg:py-2.5">
          <div className="text-[11px] tracking-[0.12em] text-[#556070] uppercase">
            Ranking por total registradas
          </div>
          <button
            type="button"
            onClick={() => setRankingExpanded((expanded) => !expanded)}
            className="text-[11px] text-[#556070] hover:text-[#aaa] lg:hidden"
            aria-expanded={rankingExpanded}
          >
            {rankingExpanded ? "Ocultar" : "Ver ranking"}
          </button>
        </div>

        <div
          className={`flex-1 overflow-auto ${rankingExpanded ? "block" : "hidden lg:block"}`}
        >
          {ranked.map((estado, index) => {
            const selected = selectedEstado?.id === estado.id;
            const hovered = hoveredEstado?.id === estado.id && !selected;
            return (
              <button
                key={estado.id}
                type="button"
                onClick={() => onSelectEstado(selected ? null : estado)}
                className={`flex w-full items-center gap-2.5 px-5 py-2 text-left transition-colors ${
                  selected
                    ? "border-l-2 border-[#ff2d55] bg-[#ff2d55]/8"
                    : hovered
                      ? "border-l-2 border-[#556070] bg-white/[0.03]"
                      : "border-l-2 border-transparent hover:bg-white/[0.02]"
                }`}
              >
                <span className="w-3.5 text-[11px] text-[#3a4558]">#{index + 1}</span>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between">
                    <span className="text-[11px] text-[#c0bfb8]">{estado.nombre}</span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: getColor(estado.total) }}
                    >
                      {formatNum(estado.total)}
                    </span>
                  </div>
                  <div className="h-[3px] overflow-hidden rounded-sm bg-white/[0.06]">
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{
                        width: `${getIntensity(estado.total) * 100}%`,
                        background: `linear-gradient(90deg, ${getColor(estado.total)}, ${getColor(estado.total)}88)`,
                      }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
