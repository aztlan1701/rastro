"use client";

import type { EstadoData } from "@/lib/types";
import { formatNum } from "@/lib/utils";

/** Screen reader announcements for map state selection (extracted from MexicoMap). */
export function useMexicoMap(selectedEstado: EstadoData | null, hoveredEstado: EstadoData | null) {
  let liveMessage = "";
  if (selectedEstado) {
    liveMessage = `${selectedEstado.nombre} seleccionado, ${formatNum(selectedEstado.total)} casos registradas`;
  } else if (hoveredEstado) {
    liveMessage = `${hoveredEstado.nombre}, ${formatNum(hoveredEstado.total)} casos registradas`;
  }

  return { liveMessage };
}
