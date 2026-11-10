import type { GeoConfidence, Noticia, NoticiaTipo } from "@/lib/types";
import { normalizeStateName } from "@/lib/state-catalog";

const KEYWORDS: Record<NoticiaTipo, string[]> = {
  hallazgo: ["hallazgo", "fosa", "restos", "localiz", "encontrad"],
  denuncia: ["denuncia", "obstaculiz", "amenaza", "exige", "presunto"],
  institucional: ["cnbp", "cndh", "convenio", "plataforma", "gobierno", "fiscal"],
  alerta: ["alerta amber", "alerta alba", "amber", "alba"],
  estadistica: ["aumento", "reporte", "estadist", "porcentaje", "semestre"],
};

export function classifyNews(text: string): NoticiaTipo {
  const lower = text.toLowerCase();
  for (const [tipo, words] of Object.entries(KEYWORDS) as [NoticiaTipo, string[]][]) {
    if (words.some((word) => lower.includes(word))) return tipo;
  }
  return "denuncia";
}

export function extractEstadoFromText(text: string): string {
  const lower = text.toLowerCase();
  const words = lower.split(/\W+/);
  for (let i = 0; i < words.length; i += 1) {
    const slice = words.slice(i, i + 4).join(" ");
    const state = normalizeStateName(slice);
    if (state) return state.nombre;
    const single = normalizeStateName(words[i]);
    if (single) return single.nombre;
  }
  return "Nacional";
}

export function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `hace ${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function normalizeNewsItem(input: {
  id: string;
  titulo: string;
  fuente: string;
  publishedAt: Date;
  url?: string;
  lat?: number;
  lng?: number;
  geoConfidence?: GeoConfidence;
}): Noticia {
  const titulo = input.titulo.trim();
  const inferred = !input.geoConfidence && !input.lat ? "none" : input.geoConfidence;

  return {
    id: input.id,
    titulo,
    fuente: input.fuente,
    hora: relativeTime(input.publishedAt),
    estado: extractEstadoFromText(titulo),
    tipo: classifyNews(titulo),
    url: input.url && /^https?:\/\//i.test(input.url) ? input.url : undefined,
    lat: input.lat,
    lng: input.lng,
    geoConfidence: input.lat && input.lng ? inferred ?? "state" : inferred ?? "none",
  };
}
