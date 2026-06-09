import { ALERTAS_AMBER } from "@/lib/mock-data";
import { normalizeStateName } from "@/lib/state-catalog";
import type { AlertaAmber } from "@/lib/types";

function geocodeMockAlerts(): AlertaAmber[] {
  return ALERTAS_AMBER.map((alerta) => {
    const state = normalizeStateName(alerta.estado);
    return {
      ...alerta,
      lat: state?.lat,
      lng: state?.lng,
    };
  });
}

export async function fetchAmberAlerts(): Promise<{
  alertas: AlertaAmber[];
  usedMock: boolean;
  demoMode: boolean;
  portalReachable: boolean;
}> {
  let portalReachable = false;

  try {
    const response = await fetch("https://alertaamber.fgr.org.mx/", {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "RASTRO/0.2" },
    });
    portalReachable = response.ok;
  } catch {
    portalReachable = false;
  }

  return {
    alertas: geocodeMockAlerts(),
    usedMock: true,
    demoMode: true,
    portalReachable,
  };
}
