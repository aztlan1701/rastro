import type { ApiMeta, DataStatus } from "@/lib/types";

export function buildMeta(
  status: DataStatus,
  fetchedAt: number,
  source?: string,
): ApiMeta {
  return {
    status,
    fetchedAt: new Date(fetchedAt).toISOString(),
    source,
  };
}

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

/**
 * Cabecera para indicar a los buscadores que NO indexen ni sigan la respuesta.
 * Se usa en rutas que devuelven datos personales (búsqueda de personas e
 * informes por estado) para que perfiles individuales no terminen indexados.
 */
export const NOINDEX_HEADERS: Record<string, string> = {
  "X-Robots-Tag": "noindex, nofollow",
};

/** Igual que `jsonResponse` pero añadiendo las cabeceras `noindex`. */
export function jsonResponseNoIndex<T>(data: T, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: { ...NOINDEX_HEADERS, ...(init?.headers as Record<string, string>) },
  });
}
