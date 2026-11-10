"use client";

import Link from "next/link";
import type { ApiMeta } from "@/lib/types";
import { SOURCE_CATALOG, type SourceId } from "@/lib/source-catalog";
import { DataStatusBadge } from "./DataStatusBadge";

interface SourceMetaBarProps {
  sourceId: SourceId;
  meta?: ApiMeta;
  extra?: string;
  /** En pantallas pequeñas se reduce a una línea: nombre, estado y enlace a metodología. */
  dense?: boolean;
}

export function SourceMetaBar({ sourceId, meta, extra, dense = false }: SourceMetaBarProps) {
  const source = SOURCE_CATALOG[sourceId];
  const onlyWide = dense ? "hidden lg:block" : "";

  return (
    <div
      className={`rounded-md border border-edge/10 bg-surface ${
        dense ? "px-3 py-2 lg:mb-4 lg:px-4 lg:py-3" : "mb-4 px-4 py-3"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className={dense ? "flex min-w-0 flex-wrap items-baseline gap-x-3 lg:block" : "min-w-0"}>
          <div className={`text-[11px] tracking-widest text-muted uppercase ${onlyWide}`}>
            Fuente de datos
          </div>
          <div className={`text-[12px] font-medium text-ink-2 ${dense ? "lg:mt-1" : "mt-1"}`}>
            {source.label}
          </div>
          <p className={`mt-1 text-[11px] leading-relaxed text-muted ${onlyWide}`}>
            {source.provider} · corte {source.cutDate} · {source.method}
          </p>
          {extra ? <p className={`mt-1 text-[11px] text-faint ${onlyWide}`}>{extra}</p> : null}
          <Link
            href="/metodologia"
            className={`inline-block text-[11px] text-[#1f6fd0] underline decoration-edge/30 underline-offset-2 hover:text-[#174f99] ${
              dense ? "mt-0.5 lg:mt-2" : "mt-2"
            }`}
          >
            Metodología y limitaciones
          </Link>
        </div>
        {meta ? (
          // En la versión de una línea el estado ya aparece en el encabezado.
          <div className={onlyWide}>
            <DataStatusBadge meta={meta} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
