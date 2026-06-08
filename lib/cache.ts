export type DataStatus = "live" | "cached" | "stale" | "mock";

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  status: DataStatus;
  source?: string;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): CacheEntry<T> | null {
  return (store.get(key) as CacheEntry<T> | undefined) ?? null;
}

export function setCached<T>(
  key: string,
  data: T,
  status: DataStatus,
  source?: string,
): CacheEntry<T> {
  const entry: CacheEntry<T> = { data, fetchedAt: Date.now(), status, source };
  store.set(key, entry);
  return entry;
}

export function withCache<T>(
  key: string,
  ttlMs: number,
  staleTtlMs: number,
  fetcher: () => Promise<{ data: T; status: DataStatus; source?: string }>,
): Promise<CacheEntry<T>> {
  const existing = getCached<T>(key);
  const age = existing ? Date.now() - existing.fetchedAt : Infinity;

  if (existing && age < ttlMs) {
    return Promise.resolve({ ...existing, status: existing.status === "mock" ? "mock" : "live" });
  }

  if (existing && age < staleTtlMs) {
    fetcher()
      .then(({ data, status, source }) => setCached(key, data, status, source))
      .catch(() => undefined);
    return Promise.resolve({ ...existing, status: "cached" });
  }

  return fetcher()
    .then(({ data, status, source }) => setCached(key, data, status, source))
    .catch(() => {
      if (existing) {
        return { ...existing, status: "stale" as DataStatus };
      }
      throw new Error(`No cache for ${key}`);
    });
}

export function cacheAgeLabel(fetchedAt: number): string {
  const mins = Math.floor((Date.now() - fetchedAt) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}
