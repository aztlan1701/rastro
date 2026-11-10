"use client";

import type { EstadoData } from "@/lib/types";
import { formatNum } from "@/lib/utils";

/** Screen reader announcements for map state selection (extracted from MexicoMap). */
export function useMexicoMap(selectedEstado: EstadoData | null, hoveredEstado: EstadoData | null) {
  let liveMessage = "";
  if (selectedEstado) {
    liveMessage = `${selectedEstado.nombre} seleccionado, ${formatNum(selectedEstado.total)} personas desaparecidas y no localizadas`;
  } else if (hoveredEstado) {
    liveMessage = `${hoveredEstado.nombre}, ${formatNum(hoveredEstado.total)} personas desaparecidas y no localizadas`;
  }

  return { liveMessage };
}
