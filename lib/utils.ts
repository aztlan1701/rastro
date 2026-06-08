export function getColor(total: number): string {
  if (total > 7000) return "#ff2d55";
  if (total > 5000) return "#ff6b35";
  if (total > 3500) return "#ffb347";
  if (total > 2000) return "#ffd700";
  return "#4a9eff";
}

export function getIntensity(total: number, max = 8500): number {
  return Math.min(total / max, 1);
}

export function formatNum(n: number): string {
  return n.toLocaleString("es-MX");
}

export function getNoticiaStyles(tipo: string): { bg: string; text: string } {
  const styles: Record<string, { bg: string; text: string }> = {
    hallazgo: { bg: "rgba(255,45,85,0.12)", text: "#ff2d55" },
    estadistica: { bg: "rgba(74,158,255,0.12)", text: "#4a9eff" },
    denuncia: { bg: "rgba(255,107,53,0.12)", text: "#ff6b35" },
    institucional: { bg: "rgba(0,208,132,0.12)", text: "#00d084" },
    alerta: { bg: "rgba(255,179,0,0.12)", text: "#ffb300" },
  };
  return styles[tipo] ?? { bg: "rgba(255,255,255,0.04)", text: "#888" };
}
