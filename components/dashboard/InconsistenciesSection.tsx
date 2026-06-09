"use client";

import { useEffect, useState } from "react";
import type { ApiMeta, InconsistencyRecord } from "@/lib/types";
import { formatNum } from "@/lib/utils";
import { SourceMetaBar } from "./SourceMetaBar";

interface InconsistenciesSectionProps {
  meta: ApiMeta;
  estadoId?: string;
}

const TYPE_LABELS = {
  eliminado: "Registro ELIMINADO",
  borrado: "Nombre borrado",
  borrado_sin_entidad: "Borrado sin entidad",
};

export function InconsistenciesSection({ meta, estadoId }: InconsistenciesSectionProps) {
  const [records, setRecords] = useState<InconsistencyRecord[]>([]);
  const [summary, setSummary] = useState({ eliminados: 0, borrados: 0, borradosSinEntidad: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (estadoId) params.set("estadoId", estadoId);
        const response = await fetch(`/api/inconsistencias?${params.toString()}`);
        const data = (await response.json()) as {
          records?: InconsistencyRecord[];
          summary?: typeof summary;
          total?: number;
        };
        if (!active) return;
        setRecords(data.records ?? []);
        setSummary(data.summary ?? { eliminados: 0, borrados: 0, borradosSinEntidad: 0 });
        setTotal(data.total ?? 0);
      } catch {
        if (active) {
          setRecords([]);
          setTotal(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [estadoId]);

  return (
    <section className="mb-8">
      <SourceMetaBar
        sourceId="vad"
        meta={meta}
        extra="Vista de inconsistencias a nivel registro (muestra)."
      />

      <h3 className="mb-3 font-display text-base font-bold text-white">Inconsistencias detectadas</h3>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "ELIMINADO en público", value: summary.eliminados, color: "#ff2d55" },
          { label: "Nombres borrados", value: summary.borrados, color: "#ff6b35" },
          { label: "Borrados sin entidad", value: summary.borradosSinEntidad, color: "#ffb300" },
        ].map((item) => (
          <div key={item.label} className="rounded-md border border-white/6 bg-white/[0.015] px-4 py-3">
            <div className="text-[11px] text-[#556070] uppercase">{item.label}</div>
            <div className="font-display mt-1 text-xl font-black" style={{ color: item.color }}>
              {formatNum(item.value)}
            </div>
          </div>
        ))}
      </div>

      <p className="mb-3 text-[11px] text-[#556070]">
        {loading
          ? "Cargando inconsistencias…"
          : `${formatNum(total)} registros inconsistentes · mostrando ${records.length}`}
      </p>

      <ul className="space-y-2">
        {records.map((record) => (
          <li
            key={record.id}
            className="rounded-md border border-white/6 bg-white/[0.015] px-4 py-3 text-[11px]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-[#e8e4dc]">{record.nombreCompleto}</span>
              <span className="rounded-sm bg-[#ff2d55]/10 px-2 py-0.5 text-[#ff2d55] uppercase">
                {TYPE_LABELS[record.type]}
              </span>
            </div>
            <div className="mt-1 text-[#556070]">
              {record.entidad ? `Entidad: ${record.entidad}` : "Entidad desconocida"}
              {record.sexo ? ` · ${record.sexo}` : ""}
              {record.fecha ? ` · ${record.fecha}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
