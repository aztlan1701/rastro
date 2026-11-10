import { kvGet, kvSet } from "@/lib/kv";

export type DataStatus = "live" | "cached" | "stale" | "mock";

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  status: DataStatus;
  source?: string;
}

/**
 * Caché con estrategia stale-while-revalidate respaldada por el KV compartido
 * (`lib/kv.ts`): en memoria por defecto, o Upstash Redis si está configurado.
 * Con Upstash la caché se comparte entre instancias serverless y sobrevive a
 * cold starts, reduciendo los golpes al origen.
 *
 * Los datos cacheados son objetos planos serializables a JSON (no Map/Date),
 * por lo que el round-trip por el KV es seguro.
 */
const CACHE_PREFIX = "rastro:cache:";

// Retención física en el KV. Es deliberadamente mayor que la ventana "stale"
// (que se calcula con `fetchedAt`), para conservar la última copia conocida y
// poder servirla como último recurso si el origen está caído pasada la ventana.
const HARD_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

async function readEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  const raw = await kvGet(CACHE_PREFIX + key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

async function writeEntry<T>(key: string, entry: CacheEntry<T>, staleTtlMs: number): Promise<void> {
  await kvSet(CACHE_PREFIX + key, JSON.stringify(entry), Math.max(staleTtlMs, HARD_RETENTION_MS));
}

export async function withCache<T>(
  key: string,
  ttlMs: number,
  staleTtlMs: number,
  fetcher: () => Promise<{ data: T; status: DataStatus; source?: string }>,
): Promise<CacheEntry<T>> {
  const existing = await readEntry<T>(key);
  const age = existing ? Date.now() - existing.fetchedAt : Infinity;

  if (existing && age < ttlMs) {
    return { ...existing, status: existing.status === "mock" ? "mock" : "live" };
  }

  if (existing && age < staleTtlMs) {
    // Revalidación en segundo plano; la entrada vive hasta `staleTtlMs` en el KV.
    void fetcher()
      .then(({ data, status, source }) =>
        writeEntry(key, { data, fetchedAt: Date.now(), status, source }, staleTtlMs),
      )
      .catch(() => undefined);
    return { ...existing, status: "cached" };
  }

  try {
    const { data, status, source } = await fetcher();
    const entry: CacheEntry<T> = { data, fetchedAt: Date.now(), status, source };
    await writeEntry(key, entry, staleTtlMs);
    return entry;
  } catch {
    if (existing) return { ...existing, status: "stale" };
    throw new Error(`No cache for ${key}`);
  }
}

export function cacheAgeLabel(fetchedAt: number): string {
  const mins = Math.floor((Date.now() - fetchedAt) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}
