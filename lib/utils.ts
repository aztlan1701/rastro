export function getColor(total: number): string {
  if (total > 7000) return "#9f1239";
  if (total > 5000) return "#d43d2a";
  if (total > 3500) return "#ee7440";
  if (total > 2000) return "#f9a86c";
  return "#fcd9b6";
}

export function getIntensity(total: number, max = 8500): number {
  return Math.min(total / max, 1);
}

export function formatNum(n: number): string {
  return n.toLocaleString("es-MX");
}

export function sortEstadosByTotal<T extends { total: number }>(estados: T[]): T[] {
  return [...estados].sort((a, b) => b.total - a.total);
}

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "hoy";
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function getNoticiaStyles(tipo: string): { bg: string; text: string } {
  const styles: Record<string, { bg: string; text: string }> = {
    hallazgo: { bg: "rgba(200,16,46,0.10)", text: "#c8102e" },
    estadistica: { bg: "rgba(31,111,208,0.10)", text: "#1f6fd0" },
    denuncia: { bg: "rgba(194,65,12,0.10)", text: "#c2410c" },
    institucional: { bg: "rgba(11,122,82,0.10)", text: "#0b7a52" },
  };
  return styles[tipo] ?? { bg: "rgba(11,13,16,0.05)", text: "#5f6876" };
}
