"use client";

import Link from "next/link";
import type { ApiMeta } from "@/lib/types";
import { SOURCE_CATALOG, type SourceId } from "@/lib/source-catalog";
import { DataStatusBadge } from "./DataStatusBadge";

interface SourceMetaBarProps {
  sourceId: SourceId;
  meta?: ApiMeta;
  extra?: string;
}

export function SourceMetaBar({ sourceId, meta, extra }: SourceMetaBarProps) {
  const source = SOURCE_CATALOG[sourceId];

  return (
    <div className="mb-4 rounded-md border border-white/6 bg-white/[0.02] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] tracking-widest text-[#556070] uppercase">Fuente de datos</div>
          <div className="mt-1 text-[12px] font-medium text-[#d4d0c8]">{source.label}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#556070]">
            {source.provider} · corte {source.cutDate} · {source.method}
          </p>
          {extra ? <p className="mt-1 text-[11px] text-[#3a4558]">{extra}</p> : null}
          <Link
            href="/metodologia"
            className="mt-2 inline-block text-[11px] text-[#4a9eff] underline decoration-white/10 underline-offset-2 hover:text-[#7bb8ff]"
          >
            Metodología y limitaciones
          </Link>
        </div>
        {meta ? <DataStatusBadge meta={meta} /> : null}
      </div>
    </div>
  );
}
