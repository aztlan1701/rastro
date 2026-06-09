import { EmptyState } from "@/components/ui/EmptyState";
import { buildEstadosTableCsv } from "@/lib/export/report";
import type { ApiMeta, EstadoData, VadSummary } from "@/lib/types";
import { formatNum, getColor, sortEstadosByTotal } from "@/lib/utils";
import { ExportButton } from "./ExportButton";
import { InconsistenciesSection } from "./InconsistenciesSection";
import { SourceMetaBar } from "./SourceMetaBar";

interface DataTabProps {
  estados: EstadoData[];
  vad: VadSummary | null;
  vadMeta: ApiMeta;
  rnpdnoMeta: ApiMeta;
  onSelectEstado: (estado: EstadoData) => void;
  onGoToMap: () => void;
}

export function DataTab({
  estados,
  vad,
  vadMeta,
  rnpdnoMeta,
  onSelectEstado,
  onGoToMap,
}: DataTabProps) {
  const ranked = sortEstadosByTotal(estados);
  const pctEliminados =
    vad && vad.totalRegistrosPublico > 0
      ? ((vad.totalEliminadosEnPublico / vad.totalRegistrosPublico) * 100).toFixed(1)
      : null;

  return (
    <div className="flex-1 overflow-auto p-6">
      {vad ? (
        <section className="mb-8 rounded-lg border border-white/8 bg-white/[0.02] p-5">
          <SourceMetaBar sourceId="vad" meta={vadMeta} />
          <div className="mb-4">
            <h2 className="font-display text-lg font-bold text-white">Volver a Desaparecer</h2>
              <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-[#556070]">
                Plataforma de trazabilidad de Data Cívica sobre inconsistencias en el RNPDNO:
                nombres borrados entre versiones públicas y registros enmascarados como
                &quot;ELIMINADO&quot; en la base oficial.
              </p>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Nombres borrados",
                value: formatNum(vad.totalBorrados),
                sub: "ago–dic 2023 · Data Cívica",
                color: "#ff6b35",
              },
              {
                label: "Con estado conocido",
                value: formatNum(vad.borradosConEstado),
                sub: `${formatNum(vad.totalBorrados - vad.borradosConEstado)} sin entidad`,
                color: "#ffb300",
              },
              {
                label: "Registros ELIMINADO",
                value: formatNum(vad.totalEliminadosEnPublico),
                sub: pctEliminados ? `${pctEliminados}% del RNPDNO público` : "RNPDNO sep 2023",
                color: "#ff2d55",
              },
              {
                label: "Registros públicos",
                value: formatNum(vad.totalRegistrosPublico),
                sub: "versión CNB · sep 2023",
                color: "#4a9eff",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-md border border-white/6 bg-[#030508]/60 px-4 py-3"
              >
                <div className="text-[11px] tracking-widest text-[#556070] uppercase">
                  {stat.label}
                </div>
                <div
                  className="font-display mt-1 text-2xl font-black"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-[11px] text-[#3a4558]">{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <a
              href={vad.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-[#ff2d55]/30 px-3 py-1.5 text-[11px] tracking-wide text-[#ff2d55] transition-colors hover:bg-[#ff2d55]/10"
            >
              volveradesaparecer.datacivica.org
            </a>
            <a
              href={vad.buscadorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-white/10 px-3 py-1.5 text-[11px] tracking-wide text-[#aaa] transition-colors hover:bg-white/5"
            >
              Buscador por nombre
            </a>
            <a
              href={`${vad.platformUrl}/datos-abiertos`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-white/10 px-3 py-1.5 text-[11px] tracking-wide text-[#aaa] transition-colors hover:bg-white/5"
            >
              Datos abiertos
            </a>
          </div>

          {vad.porEstado.length > 0 ? (
            <div className="mb-5">
              <h3 className="mb-2 text-[11px] tracking-widest text-[#556070] uppercase">
                Nombres borrados por estado
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th scope="col" className="px-3 py-2 text-left text-[#556070] uppercase">
                        Estado
                      </th>
                      <th scope="col" className="px-3 py-2 text-right text-[#556070] uppercase">
                        Borrados
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vad.porEstado.slice(0, 12).map((item, index) => (
                      <tr
                        key={item.estadoId}
                        className={`border-b border-white/[0.03] ${
                          index % 2 === 0 ? "bg-white/[0.01]" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-[#d4d0c8]">{item.nombre}</td>
                        <td className="px-3 py-2 text-right font-bold text-[#ff6b35]">
                          {formatNum(item.borrados)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {vad.reconstruccion2017_2024 ? (
            <div className="mb-5">
              <h3 className="mb-2 text-[11px] tracking-widest text-[#556070] uppercase">
                Reconstrucción 2017–2024 (agregados)
              </h3>
              <p className="mb-3 text-[11px] text-[#556070]">
                {vad.reconstruccion2017_2024.note} Total referencial:{" "}
                {formatNum(vad.reconstruccion2017_2024.totalRegistros)}.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="px-3 py-2 text-left text-[#556070] uppercase">Estado</th>
                      <th className="px-3 py-2 text-right text-[#556070] uppercase">Reconstrucción</th>
                      <th className="px-3 py-2 text-right text-[#556070] uppercase">RNPDNO 2023</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vad.reconstruccion2017_2024.porEstado.slice(0, 10).map((item) => {
                      const rnpdno = estados.find((estado) => estado.id === item.estadoId);
                      return (
                        <tr key={item.estadoId} className="border-b border-white/[0.03]">
                          <td className="px-3 py-2 text-[#d4d0c8]">{item.nombre}</td>
                          <td className="px-3 py-2 text-right text-[#4a9eff]">
                            {formatNum(item.total)}
                          </td>
                          <td className="px-3 py-2 text-right text-[#888]">
                            {formatNum(rnpdno?.total ?? 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-[11px] tracking-widest text-[#556070] uppercase">
              Bases de datos abiertas
            </h3>
            <ul className="space-y-2">
              {vad.datasets.map((dataset) => (
                <li
                  key={dataset.id}
                  className="rounded-md border border-white/6 bg-white/[0.015] px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-[12px] font-medium text-[#d4d0c8]">
                        {dataset.name}
                        {dataset.usedInRastro ? (
                          <span className="ml-2 text-[11px] tracking-wide text-[#00d084] uppercase">
                            · usado en RASTRO
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] text-[#556070]">{dataset.description}</p>
                      <p className="mt-1 text-[11px] text-[#3a4558]">
                        Publicado {dataset.publishedAt} · {dataset.format.toUpperCase()}
                      </p>
                    </div>
                    <a
                      href={dataset.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-sm border border-white/10 px-2.5 py-1 text-[11px] text-[#aaa] hover:bg-white/5"
                    >
                      Descargar
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <InconsistenciesSection meta={vadMeta} />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-white">RNPDNO por estado</h2>
          <p className="mt-1 text-[11px] text-[#556070]">
            Todas las entidades federativas · Comisión Nacional de Búsqueda · Data Cívica
          </p>
        </div>
        <ExportButton
          label="Exportar CSV"
          filename="rastro-rnpdno-estados.csv"
          content={buildEstadosTableCsv(ranked)}
        />
      </div>
      <SourceMetaBar sourceId="rnpdno" meta={rnpdnoMeta} />

      {ranked.length === 0 ? (
        <EmptyState
          title="Sin datos disponibles"
          description="No se pudieron cargar registros de estados."
          action={{ label: "Ir al mapa", onClick: onGoToMap }}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-white/8">
                {["Estado", "Total", "Nuevos 30d", "Mujeres", "Hombres", "Localizados", "% Loc."].map(
                  (header) => (
                    <th
                      key={header}
                      scope="col"
                      className={`px-3 py-2 text-[11px] tracking-widest text-[#556070] uppercase ${
                        header === "Estado" ? "text-left" : "text-right"
                      }`}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {ranked.map((estado, index) => (
                <tr
                  key={estado.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => {
                    onSelectEstado(estado);
                    onGoToMap();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectEstado(estado);
                      onGoToMap();
                    }
                  }}
                  className={`cursor-pointer border-b border-white/[0.03] transition-colors hover:bg-[#ff2d55]/5 focus-visible:bg-[#ff2d55]/5 ${
                    index % 2 === 0 ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 text-[#d4d0c8]">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: getColor(estado.total) }}
                      />
                      {estado.nombre}
                    </div>
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-bold"
                    style={{ color: getColor(estado.total) }}
                  >
                    {formatNum(estado.total)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#ff6b35]">
                    +{estado.nuevos30d}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#ff80ab]">
                    {formatNum(estado.mujeres)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#4a9eff]">
                    {formatNum(estado.hombres)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#00d084]">
                    {formatNum(estado.localizados)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#888]">
                    {((estado.localizados / estado.total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
