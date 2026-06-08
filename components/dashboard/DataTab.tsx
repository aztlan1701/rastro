import { EmptyState } from "@/components/ui/EmptyState";
import type { EstadoData } from "@/lib/types";
import { formatNum, getColor } from "@/lib/utils";

interface DataTabProps {
  estados: EstadoData[];
  onSelectEstado: (estado: EstadoData) => void;
  onGoToMap: () => void;
}

export function DataTab({ estados, onSelectEstado, onGoToMap }: DataTabProps) {
  const ranked = [...estados].sort((a, b) => b.total - a.total);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5">
        <h2 className="font-display text-lg font-bold text-white">Datos abiertos</h2>
        <p className="mt-1 text-[11px] text-[#556070]">
          Todas las entidades federativas · RNPDNO CNB
        </p>
      </div>

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
