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
    <div className="relative shrink-0 border-b border-white/5 bg-white/[0.015]">
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#030508] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#030508] to-transparent md:hidden" />
      <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-[160px] shrink-0 snap-start border-r border-white/5 px-6 py-3"
          >
            <div className="mb-1 text-[11px] tracking-[0.12em] text-[#556070] uppercase">
              {stat.label}
            </div>
            <div
              className={`font-display text-[26px] leading-none font-black ${stat.pulse ? "animate-alert-pulse" : ""}`}
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="mt-1 text-[11px] tracking-wide text-[#3a4558]">{stat.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildStats(
  totalNacional: number,
  totalNuevos: number,
  totalLocalizados: number,
  estadosCount: number,
): StatItem[] {
  return [
    {
      label: "Total registradas",
      value: formatNum(totalNacional),
      color: "#ff2d55",
      sub: "RNPDNO acumulado",
    },
    {
      label: "Últimos 30 días",
      value: `+${formatNum(totalNuevos)}`,
      color: "#ff6b35",
      sub: "nuevas desapariciones",
    },
    {
      label: "Localizadas",
      value: formatNum(totalLocalizados),
      color: "#00d084",
      sub: "del total registrado",
    },
    {
      label: "Estados monitoreados",
      value: estadosCount,
      color: "#4a9eff",
      sub: `${estadosCount} con datos RNPDNO · 32 entidades`,
    },
  ];
}
