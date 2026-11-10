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
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-canvas to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-canvas to-transparent md:hidden" />
      <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-[160px] shrink-0 snap-start border-r border-edge/10 px-6 py-3"
          >
            <div className="mb-1 text-[11px] tracking-[0.12em] text-muted uppercase">
              {stat.label}
            </div>
            <div
              className={`font-display text-[26px] leading-none font-black ${stat.pulse ? "animate-alert-pulse" : ""}`}
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="mt-1 text-[11px] tracking-wide text-faint">{stat.sub}</div>
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
