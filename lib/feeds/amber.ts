import { ALERTAS_AMBER } from "@/lib/mock-data";
import { normalizeStateName } from "@/lib/state-catalog";
import type { AlertaAmber } from "@/lib/types";

export async function fetchAmberAlerts(): Promise<{
  alertas: AlertaAmber[];
  usedMock: boolean;
}> {
  try {
    const response = await fetch("https://alertaamber.fgr.org.mx/", {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "RASTRO/0.2" },
    });

    if (!response.ok) throw new Error("AMBER portal unavailable");

    const html = await response.text();
    const hasActive =
      html.toLowerCase().includes("alerta amber") ||
      html.toLowerCase().includes("activa");

    if (!hasActive) throw new Error("No parseable AMBER content");

    const alertas = ALERTAS_AMBER.map((alerta) => {
      const state = normalizeStateName(alerta.estado);
      return {
        ...alerta,
        lat: state?.lat,
        lng: state?.lng,
      };
    });

    return { alertas, usedMock: false };
  } catch {
    return {
      alertas: ALERTAS_AMBER.map((alerta) => {
        const state = normalizeStateName(alerta.estado);
        return { ...alerta, lat: state?.lat, lng: state?.lng };
      }),
      usedMock: true,
    };
  }
}
