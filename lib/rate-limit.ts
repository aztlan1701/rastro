import { kvIncrWindow } from "@/lib/kv";

/**
 * Rate limit respaldado por el KV compartido (`lib/kv.ts`).
 *
 * Con Upstash Redis configurado, el contador es compartido entre instancias, por
 * lo que el límite es global y no `instancias × limit`. Sin Upstash, degrada al
 * contador en memoria de proceso (suficiente para un solo nodo / desarrollo).
 *
 * Política de fallo: si el backend de KV falla, se permite la petición (fail
 * open) para no bloquear a usuarios legítimos por un problema de infraestructura.
 */
export async function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): Promise<boolean> {
  try {
    const count = await kvIncrWindow(`rastro:rl:${key}`, windowMs);
    return count <= limit;
  } catch {
    return true;
  }
}
