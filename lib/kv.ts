/**
 * Almacén clave-valor con dos backends intercambiables:
 *
 *  - En memoria del proceso (por defecto). Idéntico al comportamiento histórico:
 *    rápido pero no compartido entre instancias ni persistente.
 *  - Upstash Redis vía API REST (si se configuran `UPSTASH_REDIS_REST_URL` y
 *    `UPSTASH_REDIS_REST_TOKEN`). Compartido entre instancias serverless, lo que
 *    hace que la caché y el rate-limit funcionen de verdad en multi-instancia.
 *
 * Se usa REST con `fetch` para no añadir dependencias y ser compatible con el
 * runtime edge/serverless. Si Upstash falla, las operaciones propagan el error y
 * quien llama decide el fallback (la caché degrada a recomputar; el rate-limit
 * falla abierto para no bloquear a usuarios legítimos).
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

export const usingRemoteKv = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

interface MemoryEntry {
  value: string;
  expiresAt: number; // epoch ms; 0 = sin expiración
}

const memory = new Map<string, MemoryEntry>();

function memoryGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

async function upstash(command: (string | number)[]): Promise<unknown> {
  const response = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Upstash error ${response.status}`);
  const data = (await response.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result ?? null;
}

/** Lee una cadena (o null si no existe / expiró). */
export async function kvGet(key: string): Promise<string | null> {
  if (usingRemoteKv) {
    const result = await upstash(["GET", key]);
    return result == null ? null : String(result);
  }
  return memoryGet(key);
}

/** Guarda una cadena con expiración en milisegundos. */
export async function kvSet(key: string, value: string, ttlMs: number): Promise<void> {
  const ttl = Math.max(1, Math.round(ttlMs));
  if (usingRemoteKv) {
    await upstash(["SET", key, value, "PX", ttl]);
    return;
  }
  memory.set(key, { value, expiresAt: ttlMs > 0 ? Date.now() + ttl : 0 });
}

/**
 * Incrementa un contador asociado a una ventana fija y devuelve el nuevo valor.
 * En el primer incremento fija la expiración de la ventana (no deslizante).
 * Es la primitiva del rate-limit.
 */
export async function kvIncrWindow(key: string, windowMs: number): Promise<number> {
  const ttl = Math.max(1, Math.round(windowMs));
  if (usingRemoteKv) {
    const count = Number(await upstash(["INCR", key]));
    if (count === 1) await upstash(["PEXPIRE", key, ttl]);
    return count;
  }

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || (entry.expiresAt && entry.expiresAt < now)) {
    memory.set(key, { value: "1", expiresAt: now + ttl });
    return 1;
  }
  const next = Number(entry.value) + 1;
  entry.value = String(next);
  return next;
}

/** Solo para tests: limpia el backend en memoria. */
export function __resetMemoryKv(): void {
  memory.clear();
}
