"use client";

import { useEffect, useState } from "react";
import type { EstadoData } from "@/lib/types";
import { formatNum } from "@/lib/utils";

/** Screen reader announcements for map state selection (extracted from MexicoMap). */
export function useMexicoMap(selectedEstado: EstadoData | null, hoveredEstado: EstadoData | null) {
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    if (selectedEstado) {
      setLiveMessage(
        `${selectedEstado.nombre} seleccionado, ${formatNum(selectedEstado.total)} casos registradas`,
      );
      return;
    }
    if (hoveredEstado) {
      setLiveMessage(`${hoveredEstado.nombre}, ${formatNum(hoveredEstado.total)} casos registradas`);
      return;
    }
    setLiveMessage("");
  }, [hoveredEstado, selectedEstado]);

  return { liveMessage };
}
