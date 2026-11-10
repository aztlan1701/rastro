"use client";

import { useEffect, useState } from "react";
import type { ApiMeta, DataStatus } from "@/lib/types";
import { cacheAgeLabel } from "@/lib/cache";

const STATUS_LABEL: Record<DataStatus, string> = {
  live: "En línea",
  cached: "Caché",
  stale: "Desactualizado",
  mock: "Datos mock",
};

const STATUS_COLOR: Record<DataStatus, string> = {
  live: "#0b7a52",
  cached: "#1f6fd0",
  stale: "#a16207",
  mock: "#a16207",
};

interface DataStatusBadgeProps {
  meta: ApiMeta;
}

export function DataStatusBadge({ meta }: DataStatusBadgeProps) {
  const [age, setAge] = useState<string | null>(null);
  const color = STATUS_COLOR[meta.status];
  const label = STATUS_LABEL[meta.status];

  useEffect(() => {
    const updateAge = () => {
      setAge(cacheAgeLabel(new Date(meta.fetchedAt).getTime()));
    };

    updateAge();
    const intervalId = window.setInterval(updateAge, 60_000);
    return () => window.clearInterval(intervalId);
  }, [meta.fetchedAt]);

  return (
    <div className="flex items-center gap-2" title={meta.source ?? "sin fuente"}>
      <div
        className="h-1.5 w-1.5 animate-pulse-dot rounded-full"
        style={{ background: color }}
      />
      <span className="tracking-widest uppercase" style={{ color }}>
        {label}
        {age ? ` · ${age}` : null}
      </span>
    </div>
  );
}
