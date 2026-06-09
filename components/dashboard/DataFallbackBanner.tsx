"use client";

import type { ApiMeta } from "@/lib/types";
import { cacheAgeLabel } from "@/lib/cache";

interface DataFallbackBannerProps {
  meta: ApiMeta;
  onGoToData: () => void;
}

export function DataFallbackBanner({ meta, onGoToData }: DataFallbackBannerProps) {
  if (meta.status !== "mock" && meta.status !== "stale") return null;

  const age = cacheAgeLabel(new Date(meta.fetchedAt).getTime());
  const isMock = meta.status === "mock";

  return (
    <div
      role="status"
      className="grid shrink-0 grid-cols-1 items-center gap-2 border-b border-[#ffb300]/20 bg-[#ffb300]/8 px-4 py-2.5 sm:grid-cols-[1fr_auto]"
    >
      <p className="min-w-0 text-[11px] text-[#c0bfb8]">
        {isMock
          ? "Mostrando datos de respaldo"
          : "Datos posiblemente desactualizados"}
        {age ? ` · ${age}` : null}
      </p>
      <button
        type="button"
        onClick={onGoToData}
        className="w-full shrink-0 rounded-sm border border-[#ffb300]/30 px-2.5 py-1 text-[11px] tracking-wide whitespace-nowrap text-[#ffb300] transition-colors hover:bg-[#ffb300]/10 sm:w-auto"
      >
        Ver fuentes
      </button>
    </div>
  );
}
