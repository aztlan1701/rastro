import { EmptyState } from "@/components/ui/EmptyState";
import type { Noticia, TelegramPost } from "@/lib/types";
import { getNoticiaStyles } from "@/lib/utils";

interface NewsTabProps {
  noticias: Noticia[];
  telegram: TelegramPost[];
}

export function NewsTab({ noticias, telegram }: NewsTabProps) {
  const hasContent = noticias.length > 0 || telegram.length > 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5">
        <h2 className="font-display text-lg font-bold text-white">Feed de noticias</h2>
        <p className="mt-1 text-[11px] text-[#556070]">
          RSS · GDELT · Telegram geoparse
        </p>
      </div>

      {!hasContent ? (
        <EmptyState
          title="Sin noticias disponibles"
          description="Activa la capa de noticias geo en el mapa o vuelve más tarde."
        />
      ) : (
        <>
          {telegram.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 text-[11px] tracking-[0.12em] text-[#00e5ff] uppercase">
                Telegram OSINT
              </div>
              <div className="flex flex-col gap-2">
                {telegram.slice(0, 8).map((post) => (
                  <a
                    key={post.id}
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-sm border border-[#00e5ff]/20 bg-[#00e5ff]/5 px-3 py-2 transition-colors hover:bg-[#00e5ff]/10"
                  >
                    <div className="mb-1 text-[11px] text-[#00e5ff]">
                      @{post.channel}
                      {post.lugar ? ` · ${post.lugar}` : ""}
                    </div>
                    <p className="text-[12px] leading-snug text-[#d4d0c8]">{post.text}</p>
                    <div className="mt-1 text-[11px] text-[#3a4558]">{post.hora}</div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {noticias.length === 0 ? (
            <EmptyState title="Sin noticias RSS" description="No hay artículos en el feed por ahora." />
          ) : (
            <div className="flex flex-col gap-0.5">
              {noticias.map((noticia, index) => {
                const styles = getNoticiaStyles(noticia.tipo);
                const content = (
                  <>
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <h3 className="flex-1 text-[13px] leading-snug text-[#d4d0c8]">
                        {noticia.titulo}
                      </h3>
                      <span
                        className="shrink-0 rounded-sm border px-1.5 py-0.5 text-[11px] font-bold tracking-widest uppercase"
                        style={{
                          color: styles.text,
                          background: styles.bg,
                          borderColor: styles.text,
                        }}
                      >
                        {noticia.tipo}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#3a4558]">
                      {noticia.fuente} · {noticia.estado} · {noticia.hora}
                    </p>
                  </>
                );

                return noticia.url ? (
                  <a
                    key={noticia.id}
                    href={noticia.url}
                    target="_blank"
                    rel="noreferrer"
                    className="animate-fade-in border-l-2 border-transparent px-3.5 py-2.5 transition-colors hover:border-[#ff2d55] hover:bg-white/[0.03]"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {content}
                  </a>
                ) : (
                  <article
                    key={noticia.id}
                    className="animate-fade-in border-l-2 border-transparent px-3.5 py-2.5 transition-colors hover:border-[#ff2d55] hover:bg-white/[0.03]"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {content}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
