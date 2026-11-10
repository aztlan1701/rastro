/**
 * Escapa texto para interpolarlo de forma segura en HTML. Necesario en los
 * popups del mapa (MapLibre `setHTML`) y en cualquier HTML construido a mano,
 * porque títulos de noticias y nombres de municipio provienen
 * de fuentes externas y podrían contener marcado malicioso (XSS).
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Devuelve la URL solo si usa un esquema seguro (http/https). Evita que un feed
 * malicioso inyecte `javascript:` u otros esquemas en un `href`, lo que
 * ejecutaría código al hacer clic.
 */
export function safeHttpUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
  } catch {
    return undefined;
  }
  return undefined;
}

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

/** Como `formatNum`, pero muestra una raya cuando la fuente no publica el dato. */
export function formatNumOrDash(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : formatNum(n);
}

/** Suma solo si todos los valores existen; un solo faltante deja el total sin dato. */
export function sumOrNull(values: Array<number | null>): number | null {
  let total = 0;
  for (const value of values) {
    if (value === null) return null;
    total += value;
  }
  return values.length > 0 ? total : null;
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
