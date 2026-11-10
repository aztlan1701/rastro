import { EmptyState } from "@/components/ui/EmptyState";
import { buildEstadosTableCsv } from "@/lib/export/report";
import type { ApiMeta, EstadoData, VadSummary } from "@/lib/types";
import { formatNum, formatNumOrDash, getColor, sortEstadosByTotal } from "@/lib/utils";
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

/** Proporción de localizadas sobre todos los registros de la entidad. */
function pctLocalizados(estado: EstadoData): string {
  if (estado.localizados === null) return "—";
  const registros = estado.total + estado.localizados;
  return registros > 0 ? `${((estado.localizados / registros) * 100).toFixed(1)}%` : "—";
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
  const sexoNota = estados.some((estado) => estado.sexoUniverso === "todos") ? " *" : "";
  const pctEliminados =
    vad && vad.totalRegistrosPublico > 0
      ? ((vad.totalEliminadosEnPublico / vad.totalRegistrosPublico) * 100).toFixed(1)
      : null;

  return (
    <div className="flex-1 overflow-auto p-6">
      {vad ? (
        <section className="mb-8 rounded-lg border border-edge/12 bg-surface p-5">
          <SourceMetaBar sourceId="vad" meta={vadMeta} />
          <div className="mb-4">
            <h2 className="font-display text-lg font-bold text-ink-strong">Volver a Desaparecer</h2>
              <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted">
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
                color: "#c2410c",
              },
              {
                label: "Con estado conocido",
                value: formatNum(vad.borradosConEstado),
                sub: `${formatNum(vad.totalBorrados - vad.borradosConEstado)} sin entidad`,
                color: "#a16207",
              },
              {
                label: "Registros ELIMINADO",
                value: formatNum(vad.totalEliminadosEnPublico),
                sub: pctEliminados ? `${pctEliminados}% del RNPDNO público` : "RNPDNO sep 2023",
                color: "#c8102e",
              },
              {
                label: "Registros públicos",
                value: formatNum(vad.totalRegistrosPublico),
                sub: "versión CNB · sep 2023",
                color: "#1f6fd0",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-md border border-edge/10 bg-canvas/60 px-4 py-3"
              >
                <div className="text-[11px] tracking-widest text-muted uppercase">
                  {stat.label}
                </div>
                <div
                  className="font-display mt-1 text-2xl font-black"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-[11px] text-faint">{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <a
              href={vad.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-[#c8102e]/30 px-3 py-1.5 text-[11px] tracking-wide text-[#c8102e] transition-colors hover:bg-[#c8102e]/10"
            >
              volveradesaparecer.datacivica.org
            </a>
            <a
              href={vad.buscadorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-edge/15 px-3 py-1.5 text-[11px] tracking-wide text-ink-3 transition-colors hover:bg-edge/5"
            >
              Buscador por nombre
            </a>
            <a
              href={`${vad.platformUrl}/datos-abiertos`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-edge/15 px-3 py-1.5 text-[11px] tracking-wide text-ink-3 transition-colors hover:bg-edge/5"
            >
              Datos abiertos
            </a>
          </div>

          {vad.porEstado.length > 0 ? (
            <div className="mb-5">
              <h3 className="mb-2 text-[11px] tracking-widest text-muted uppercase">
                Nombres borrados por estado
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-edge/12">
                      <th scope="col" className="px-3 py-2 text-left text-muted uppercase">
                        Estado
                      </th>
                      <th scope="col" className="px-3 py-2 text-right text-muted uppercase">
                        Borrados
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vad.porEstado.slice(0, 12).map((item, index) => (
                      <tr
                        key={item.estadoId}
                        className={`border-b border-edge/[0.07] ${
                          index % 2 === 0 ? "bg-surface" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-ink-2">{item.nombre}</td>
                        <td className="px-3 py-2 text-right font-bold text-[#c2410c]">
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
              <h3 className="mb-2 text-[11px] tracking-widest text-muted uppercase">
                Reconstrucción 2017–2024 (agregados)
              </h3>
              <p className="mb-3 text-[11px] text-muted">
                {vad.reconstruccion2017_2024.note} Total referencial:{" "}
                {formatNum(vad.reconstruccion2017_2024.totalRegistros)}.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-edge/12">
                      <th className="px-3 py-2 text-left text-muted uppercase">Estado</th>
                      <th className="px-3 py-2 text-right text-muted uppercase">Reconstrucción</th>
                      <th className="px-3 py-2 text-right text-muted uppercase">RNPDNO 2023</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vad.reconstruccion2017_2024.porEstado.slice(0, 10).map((item) => {
                      const rnpdno = estados.find((estado) => estado.id === item.estadoId);
                      return (
                        <tr key={item.estadoId} className="border-b border-edge/[0.07]">
                          <td className="px-3 py-2 text-ink-2">{item.nombre}</td>
                          <td className="px-3 py-2 text-right text-[#1f6fd0]">
                            {formatNum(item.total)}
                          </td>
                          <td className="px-3 py-2 text-right text-ink-4">
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
            <h3 className="mb-2 text-[11px] tracking-widest text-muted uppercase">
              Bases de datos abiertas
            </h3>
            <ul className="space-y-2">
              {vad.datasets.map((dataset) => (
                <li
                  key={dataset.id}
                  className="rounded-md border border-edge/10 bg-surface px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-[12px] font-medium text-ink-2">
                        {dataset.name}
                        {dataset.usedInRastro ? (
                          <span className="ml-2 text-[11px] tracking-wide text-[#0b7a52] uppercase">
                            · usado en RASTRO
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{dataset.description}</p>
                      <p className="mt-1 text-[11px] text-faint">
                        Publicado {dataset.publishedAt} · {dataset.format.toUpperCase()}
                      </p>
                    </div>
                    <a
                      href={dataset.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-sm border border-edge/15 px-2.5 py-1 text-[11px] text-ink-3 hover:bg-edge/5"
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
          <h2 className="font-display text-lg font-bold text-ink-strong">RNPDNO por estado</h2>
          <p className="mt-1 text-[11px] text-muted">
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
      <p className="mb-4 text-[11px] leading-relaxed text-muted">
        “Desaparecidas” son personas desaparecidas y no localizadas. “Localizadas” se obtiene
        restando esa cifra a todos los registros de la entidad. “% Loc.” es la proporción de
        localizadas sobre todos los registros. Una raya indica que la fuente no publica el dato.
        {sexoNota
          ? " * Mujeres y hombres cuentan todos los registros, incluidas las personas localizadas."
          : ""}
      </p>

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
              <tr className="border-b border-edge/12">
                {["Estado", "Desaparecidas", "Nuevos 30d", `Mujeres${sexoNota}`, `Hombres${sexoNota}`, "Localizadas", "% Loc."].map(
                  (header) => (
                    <th
                      key={header}
                      scope="col"
                      className={`px-3 py-2 text-[11px] tracking-widest text-muted uppercase ${
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
                  className={`cursor-pointer border-b border-edge/[0.07] transition-colors hover:bg-[#c8102e]/5 focus-visible:bg-[#c8102e]/5 ${
                    index % 2 === 0 ? "bg-surface" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 text-ink-2">
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
                    style={{ color: "#0b0d10" }}
                  >
                    {formatNum(estado.total)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#c2410c]">
                    {estado.nuevos30d === null ? "—" : `+${formatNum(estado.nuevos30d)}`}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#be3d7a]">
                    {formatNum(estado.mujeres)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#1f6fd0]">
                    {formatNum(estado.hombres)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[#0b7a52]">
                    {formatNumOrDash(estado.localizados)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink-4">
                    {pctLocalizados(estado)}
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
