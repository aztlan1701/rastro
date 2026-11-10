import type { Noticia } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoticiaListItem } from "./NoticiaListItem";

interface FeedPanelContentProps {
  noticias: Noticia[];
  compact?: boolean;
  onGoToNews?: () => void;
}

export function FeedPanelContent({ noticias, compact, onGoToNews }: FeedPanelContentProps) {
  const newsSlice = noticias.slice(0, compact ? 5 : 8);

  return (
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
  );
}
