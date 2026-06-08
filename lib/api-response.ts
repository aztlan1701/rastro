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
