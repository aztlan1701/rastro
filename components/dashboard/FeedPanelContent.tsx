import type { AlertaAmber, Noticia } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoticiaListItem } from "./NoticiaListItem";

interface FeedPanelContentProps {
  alertas: AlertaAmber[];
  noticias: Noticia[];
  compact?: boolean;
  onGoToAlerts?: () => void;
  onGoToNews?: () => void;
}

export function FeedPanelContent({
  alertas,
  noticias,
  compact,
  onGoToAlerts,
  onGoToNews,
}: FeedPanelContentProps) {
  const activas = alertas.filter((alerta) => alerta.activa);
  const newsSlice = noticias.slice(0, compact ? 5 : 8);

  return (
    <>
      <div className={compact ? "p-3" : "border-b border-white/6 p-4"}>
        <div className="mb-2 flex items-center gap-2 text-[11px] tracking-[0.12em] text-[#ffb300] uppercase">
          <div className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#ffb300]" />
          Alertas AMBER activas
        </div>
        {activas.length === 0 ? (
          <EmptyState
            title="Sin alertas activas"
            description="No hay alertas AMBER en curso en este momento."
            action={
              onGoToAlerts
                ? { label: "Ir a Alertas", onClick: onGoToAlerts }
                : undefined
            }
          />
        ) : (
          activas.map((alerta) => (
            <button
              key={alerta.id}
              type="button"
              onClick={onGoToAlerts}
              className="mb-1.5 block w-full rounded-sm border border-[#ffb300]/15 bg-[#ffb300]/6 px-2.5 py-2 text-left transition-colors hover:bg-[#ffb300]/10"
            >
              <div className="text-[11px] font-bold text-[#e8e4dc]">{alerta.nombre}</div>
              <div className="mt-0.5 text-[11px] text-[#888]">
                {alerta.edad} años · {alerta.municipio}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="text-[11px] tracking-[0.12em] text-[#556070] uppercase">
            Últimas noticias
          </div>
          {onGoToNews ? (
            <button
              type="button"
              onClick={onGoToNews}
              className="text-[11px] text-[#556070] hover:text-[#aaa]"
            >
              Ver todas
            </button>
          ) : null}
        </div>
        {newsSlice.length === 0 ? (
          <EmptyState
            title="Sin noticias"
            description="No hay entradas en el feed por ahora."
            action={onGoToNews ? { label: "Ir a Noticias", onClick: onGoToNews } : undefined}
          />
        ) : (
          newsSlice.map((noticia, index) => (
            <NoticiaListItem
              key={noticia.id}
              noticia={noticia}
              index={index}
              compact={compact}
              onPress={onGoToNews}
            />
          ))
        )}
      </div>
    </>
  );
}
