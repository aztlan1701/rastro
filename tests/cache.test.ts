import { afterEach, describe, expect, it } from "vitest";
import { withCache } from "@/lib/cache";
import { __resetMemoryKv } from "@/lib/kv";

afterEach(() => __resetMemoryKv());

describe("withCache", () => {
  it("ejecuta el fetcher la primera vez y cachea (live)", async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return { data: { n: calls }, status: "live" as const, source: "test" };
    };

    const first = await withCache("k", 1000, 5000, fetcher);
    expect(first.data).toEqual({ n: 1 });
    expect(first.status).toBe("live");

    const second = await withCache("k", 1000, 5000, fetcher);
    expect(second.data).toEqual({ n: 1 });
    expect(calls).toBe(1);
  });

  it("preserva el estado mock al servir desde caché", async () => {
    const entry = await withCache("m", 1000, 5000, async () => ({
      data: [1, 2, 3],
      status: "mock" as const,
    }));
    expect(entry.status).toBe("mock");
    const cached = await withCache("m", 1000, 5000, async () => ({
      data: [9],
      status: "live" as const,
    }));
    expect(cached.status).toBe("mock");
    expect(cached.data).toEqual([1, 2, 3]);
  });

  it("devuelve datos stale si el fetcher falla y la entrada expiró", async () => {
    // ttl y staleTtl muy cortos: tras esperar, la entrada queda fuera de ambas
    // ventanas y se entra a la rama que reintenta el fetcher de forma síncrona.
    await withCache("s", 1, 2, async () => ({ data: "ok", status: "live" as const }));
    await new Promise((r) => setTimeout(r, 10));
    const stale = await withCache("s", 1, 2, async () => {
      throw new Error("origen caído");
    });
    expect(stale.data).toBe("ok");
    expect(stale.status).toBe("stale");
  });
});
