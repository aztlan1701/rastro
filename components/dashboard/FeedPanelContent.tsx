import type { AlertaAmber, Noticia } from "@/lib/types";
import { getNoticiaStyles } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

interface FeedPanelContentProps {
  alertas: AlertaAmber[];
  noticias: Noticia[];
  compact?: boolean;
}

export function FeedPanelContent({ alertas, noticias, compact }: FeedPanelContentProps) {
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
          />
        ) : (
          activas.map((alerta) => (
            <div
              key={alerta.id}
              className="mb-1.5 rounded-sm border border-[#ffb300]/15 bg-[#ffb300]/6 px-2.5 py-2"
            >
              <div className="text-[11px] font-bold text-[#e8e4dc]">{alerta.nombre}</div>
              <div className="mt-0.5 text-[11px] text-[#888]">
                {alerta.edad} años · {alerta.municipio}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-4 py-2.5 text-[11px] tracking-[0.12em] text-[#556070] uppercase">
          Últimas noticias
        </div>
        {newsSlice.length === 0 ? (
          <EmptyState title="Sin noticias" description="No hay entradas en el feed por ahora." />
        ) : (
          newsSlice.map((noticia, index) => {
            const styles = getNoticiaStyles(noticia.tipo);
            return (
              <article
                key={noticia.id}
                className="animate-fade-in border-l-2 border-transparent px-4 py-2.5 transition-colors hover:border-[#ff2d55] hover:bg-white/[0.03]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className="mb-1 inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-bold tracking-widest uppercase"
                  style={{ color: styles.text, background: "rgba(255,255,255,0.04)" }}
                >
                  {noticia.tipo}
                </div>
                <p className="mb-1 text-[11px] leading-snug text-[#c0bfb8]">{noticia.titulo}</p>
                <p className="text-[11px] text-[#3a4558]">
                  {noticia.fuente} · {noticia.hora}
                </p>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
