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

/** Keeps responses that carry names or downloadable reports out of search engines. */
export const NO_INDEX_HEADERS = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

export function tooManyRequests(message: string) {
  return jsonResponse(
    { error: message },
    { status: 429, headers: { "Retry-After": "60", ...NO_INDEX_HEADERS } },
  );
}
