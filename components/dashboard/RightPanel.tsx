import type { AlertaAmber, DashboardData, Noticia } from "@/lib/types";
import { DataStatusBadge } from "./DataStatusBadge";
import { FeedPanelContent } from "./FeedPanelContent";

interface RightPanelProps {
  alertas: AlertaAmber[];
  noticias: Noticia[];
  meta: DashboardData["meta"];
  onGoToAlerts: () => void;
  onGoToNews: () => void;
}

export function RightPanel({
  alertas,
  noticias,
  meta,
  onGoToAlerts,
  onGoToNews,
}: RightPanelProps) {
  return (
    <aside className="hidden w-[260px] shrink-0 flex-col overflow-hidden border-l border-white/6 xl:flex">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <FeedPanelContent
          alertas={alertas}
          noticias={noticias}
          onGoToAlerts={onGoToAlerts}
          onGoToNews={onGoToNews}
        />
      </div>

      <footer className="space-y-2 border-t border-white/6 p-4 text-[11px] leading-relaxed tracking-wide text-[#2a3040]">
        <div>RASTRO v0.2 · Next.js + MapLibre</div>
        <DataStatusBadge meta={meta.news} />
        <DataStatusBadge meta={meta.amber} />
      </footer>
    </aside>
  );
}
