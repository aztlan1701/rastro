import { formatNum } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
  color: string;
  sub: string;
  pulse?: boolean;
}

interface StatsBarProps {
  stats: StatItem[];
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="relative shrink-0 border-b border-edge/10 bg-surface">
      <div
        className="grid lg:flex"
        style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 border-r border-edge/10 px-3 py-2 last:border-r-0 lg:min-w-[160px] lg:shrink-0 lg:px-6 lg:py-3 lg:last:border-r"
          >
            <div className="mb-1 text-[10px] leading-tight tracking-[0.08em] text-muted uppercase lg:text-[11px] lg:tracking-[0.12em]">
              {stat.label}
            </div>
            <div
              className={`font-display text-[19px] leading-none font-black lg:text-[26px] ${stat.pulse ? "animate-alert-pulse" : ""}`}
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="mt-1 hidden text-[11px] tracking-wide text-faint lg:block">
              {stat.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildStats(
  totalNacional: number,
  totalNuevos: number | null,
  totalLocalizados: number | null,
  estadosCount: number,
): StatItem[] {
  const stats: StatItem[] = [
    {
      label: "Desaparecidas y no localizadas",
      value: formatNum(totalNacional),
      color: "#c8102e",
      sub: "RNPDNO · suma de las entidades",
    },
  ];

  // Solo se muestran los indicadores que la fuente publica; un cero inventado
  // se leería como "no hubo casos".
  if (totalNuevos !== null) {
    stats.push({
      label: "Últimos 30 días",
      value: `+${formatNum(totalNuevos)}`,
      color: "#c2410c",
      sub: "nuevas desapariciones",
    });
  }

  if (totalLocalizados !== null) {
    stats.push({
      label: "Localizadas",
      value: formatNum(totalLocalizados),
      color: "#0b7a52",
      sub: "registros totales menos desaparecidas",
    });
  }

  stats.push({
    label: "Estados monitoreados",
    value: estadosCount,
    color: "#1f6fd0",
    sub: `${estadosCount} con datos RNPDNO · 32 entidades`,
  });

  return stats;
}
