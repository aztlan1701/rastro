import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";
import { __resetMemoryKv, kvGet, kvIncrWindow, kvSet } from "@/lib/kv";

afterEach(() => __resetMemoryKv());

describe("kv (backend en memoria)", () => {
  it("guarda y lee valores", async () => {
    await kvSet("k", "v", 1000);
    expect(await kvGet("k")).toBe("v");
  });

  it("expira valores vencidos", async () => {
    await kvSet("k", "v", 1);
    await new Promise((r) => setTimeout(r, 5));
    expect(await kvGet("k")).toBeNull();
  });

  it("kvIncrWindow cuenta dentro de la ventana", async () => {
    expect(await kvIncrWindow("c", 1000)).toBe(1);
    expect(await kvIncrWindow("c", 1000)).toBe(2);
    expect(await kvIncrWindow("c", 1000)).toBe(3);
  });
});

describe("checkRateLimit", () => {
  it("permite hasta el límite y luego bloquea", async () => {
    const key = "test-ip";
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("ventanas independientes por clave", async () => {
    expect(await checkRateLimit("a", 1, 60_000)).toBe(true);
    expect(await checkRateLimit("a", 1, 60_000)).toBe(false);
    expect(await checkRateLimit("b", 1, 60_000)).toBe(true);
  });
});
