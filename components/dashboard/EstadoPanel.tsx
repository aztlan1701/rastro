"use client";

import { useCallback, useState } from "react";
import type { EstadoData, VadSummary } from "@/lib/types";
import { formatNum, formatNumOrDash, getColor, getIntensity, sortEstadosByTotal } from "@/lib/utils";

interface EstadoPanelProps {
  hoveredEstado: EstadoData | null;
  selectedEstado: EstadoData | null;
  estados: EstadoData[];
  vad?: VadSummary | null;
  onSelectEstado: (estado: EstadoData | null) => void;
  /** Announce selection changes to screen readers */
  onAnnounce?: (message: string) => void;
}

function displayEstadoSexoTodos(estado: EstadoData | null): boolean {
  return estado?.sexoUniverso === "todos";
}

export function EstadoPanel({
  hoveredEstado,
  selectedEstado,
  estados,
  vad,
  onSelectEstado,
  onAnnounce,
}: EstadoPanelProps) {
  const [rankingExpanded, setRankingExpanded] = useState(false);
  const ranked = sortEstadosByTotal(estados);

  const sexoNota = displayEstadoSexoTodos(selectedEstado ?? hoveredEstado) ? " *" : "";
  const isHoverOnly = Boolean(hoveredEstado && !selectedEstado);
  const isSelected = Boolean(selectedEstado);
  const displayEstado = selectedEstado ?? hoveredEstado;
  const borradosEstado =
    displayEstado && vad
      ? vad.porEstado.find((item) => item.estadoId === displayEstado.id)?.borrados ?? 0
      : 0;

  const pinTerritory = (estado: EstadoData) => {
    window.localStorage.setItem("RASTRO_TERRITORY_ESTADO", estado.id);
  };

  const selectFromRanking = useCallback(
    (estado: EstadoData, alreadySelected: boolean) => {
      const next = alreadySelected ? null : estado;
      onSelectEstado(next);
      if (next && onAnnounce) {
        onAnnounce(
          `${next.nombre} seleccionado desde ranking, ${formatNum(next.total)} personas desaparecidas y no localizadas`,
        );
      }
    },
    [onAnnounce, onSelectEstado],
  );

  const handleRankingKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = ranked[index + 1];
      if (next) document.getElementById(`estado-rank-${next.id}`)?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = ranked[index - 1];
      if (prev) document.getElementById(`estado-rank-${prev.id}`)?.focus();
    }
  };

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden border-r border-edge/10 lg:w-[300px]">
      <div
        className={`min-h-[160px] border-b border-edge/10 p-5 ${
          isSelected ? "border-l-2 border-l-[#c8102e]" : isHoverOnly ? "opacity-90" : ""
        }`}
      >
        {displayEstado ? (
          <div className="animate-fade-in">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div
                  className={`mb-1 text-[11px] tracking-[0.12em] uppercase ${
                    isSelected ? "text-[#c8102e]" : "text-muted"
                  }`}
                >
                  {isSelected ? "Estado seleccionado" : "Explorando"}
                </div>
                <div className="font-display text-lg font-bold text-ink-strong">
                  {displayEstado.nombre}
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  Color = volumen de casos en este estado
                </p>
              </div>
              <div
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background: getColor(displayEstado.total),
                  boxShadow: isSelected ? "0 0 0 2px rgba(11,13,16,0.25)" : undefined,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { l: "Desaparecidas", v: formatNum(displayEstado.total), c: "#0b0d10" },
                ...(displayEstado.nuevos30d !== null
                  ? [{ l: "Este mes", v: `+${formatNum(displayEstado.nuevos30d)}`, c: "#c2410c" }]
                  : []),
                { l: "Localizadas", v: formatNumOrDash(displayEstado.localizados), c: "#0b7a52" },
                { l: `Mujeres${sexoNota}`, v: formatNum(displayEstado.mujeres), c: "#be3d7a" },
                { l: `Hombres${sexoNota}`, v: formatNum(displayEstado.hombres), c: "#1f6fd0" },
                { l: "Borrados VAD", v: formatNum(borradosEstado), c: "#c2410c" },
              ].map((item) => (
                <div
                  key={item.l}
                  className="rounded-sm border border-edge/10 bg-surface px-2.5 py-2"
                >
                  <div className="mb-1 text-[11px] tracking-[0.1em] text-muted uppercase">
                    {item.l}
                  </div>
                  <div className="font-display text-sm font-bold" style={{ color: item.c }}>
                    {item.v}
                  </div>
                </div>
              ))}
            </div>
            {displayEstado.sexoUniverso === "todos" ? (
              <p className="mt-2 text-[11px] leading-snug text-faint">
                * Mujeres y hombres cuentan todos los registros de la entidad, incluidas las
                personas localizadas; por eso no suman el total de desaparecidas.
              </p>
            ) : null}
            {isSelected ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => pinTerritory(displayEstado)}
                  className="rounded-sm border border-edge/15 px-2.5 py-1 text-[11px] text-ink-3 hover:bg-edge/5"
                >
                  Fijar territorio
                </button>
                <a
                  href={`/api/informe/${displayEstado.id}`}
                  className="rounded-sm border border-[#1f6fd0]/30 px-2.5 py-1 text-[11px] text-[#1f6fd0] hover:bg-[#1f6fd0]/10"
                >
                  Descargar informe HTML
                </a>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center opacity-50">
            <p className="text-center text-[11px] tracking-wide text-muted uppercase">
              Pasa el cursor o haz clic
              <br />
              en un estado del mapa
            </p>
            <p className="mt-2 text-center text-[11px] text-faint">
              También puedes elegir uno del ranking
            </p>
          </div>
        )}
      </div>

      <div className="lg:flex lg:flex-1 lg:flex-col lg:overflow-auto">
        <div className="flex items-center justify-between px-5 py-2.5 lg:py-2.5">
          <div className="text-[11px] tracking-[0.12em] text-muted uppercase">
            Ranking por desaparecidas y no localizadas
          </div>
          <button
            type="button"
            onClick={() => setRankingExpanded((expanded) => !expanded)}
            className="text-[11px] text-muted hover:text-ink-3 lg:hidden"
            aria-expanded={rankingExpanded}
            aria-controls="estado-ranking-list"
          >
            {rankingExpanded ? "Ocultar" : "Ver ranking"}
          </button>
        </div>

        <div
          id="estado-ranking-list"
          role="listbox"
          aria-label="Ranking de estados por personas desaparecidas y no localizadas"
          aria-activedescendant={
            selectedEstado ? `estado-rank-${selectedEstado.id}` : undefined
          }
          className={`max-h-[min(280px,38vh)] flex-1 overflow-auto lg:max-h-[min(320px,45vh)] ${rankingExpanded ? "block" : "hidden lg:block"}`}
        >
          {ranked.map((estado, index) => {
            const selected = selectedEstado?.id === estado.id;
            const hovered = hoveredEstado?.id === estado.id && !selected;
            return (
              <button
                key={estado.id}
                id={`estado-rank-${estado.id}`}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectFromRanking(estado, selected)}
                onKeyDown={(event) => handleRankingKeyDown(event, index)}
                className={`flex w-full items-center gap-2.5 px-5 py-2 text-left transition-colors ${
                  selected
                    ? "border-l-2 border-[#c8102e] bg-[#c8102e]/8"
                    : hovered
                      ? "border-l-2 border-muted bg-surface"
                      : "border-l-2 border-transparent hover:bg-surface"
                }`}
              >
                <span className="w-3.5 text-[11px] text-faint">#{index + 1}</span>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between">
                    <span className="text-[11px] text-ink-2">{estado.nombre}</span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: "#0b0d10" }}
                    >
                      {formatNum(estado.total)}
                    </span>
                  </div>
                  <div className="h-[3px] overflow-hidden rounded-sm bg-edge/[0.06]">
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
