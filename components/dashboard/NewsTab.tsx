import { EmptyState } from "@/components/ui/EmptyState";
import { GEO_CONFIDENCE_LABEL } from "@/lib/geoparse/mx-places";
import type { ApiMeta, GeoConfidence, Noticia, TelegramPost } from "@/lib/types";
import { NoticiaListItem } from "./NoticiaListItem";
import { SourceMetaBar } from "./SourceMetaBar";
import { TabSectionHeader } from "./TabSectionHeader";

interface NewsTabProps {
  noticias: Noticia[];
  telegram: TelegramPost[];
  newsMeta: ApiMeta;
  gdeltMeta?: ApiMeta;
  telegramMeta?: ApiMeta;
}

function confidenceLabel(confidence?: GeoConfidence) {
  if (!confidence || confidence === "none") return null;
  return GEO_CONFIDENCE_LABEL[confidence];
}

export function NewsTab({ noticias, telegram, newsMeta, gdeltMeta, telegramMeta }: NewsTabProps) {
  const hasContent = noticias.length > 0 || telegram.length > 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <SourceMetaBar sourceId="news" meta={newsMeta} />
      {telegramMeta ? (
        <SourceMetaBar
          sourceId="telegram"
          meta={telegramMeta}
          extra={gdeltMeta ? `GDELT: ${gdeltMeta.status}` : undefined}
        />
      ) : null}
      <TabSectionHeader title="Feed de noticias" subtitle="RSS · GDELT · Telegram geoparse" />

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
                      {post.geoConfidence && post.geoConfidence !== "none"
                        ? ` · geo ${confidenceLabel(post.geoConfidence)}`
                        : ""}
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
              {noticias.map((noticia, index) => (
                <NoticiaListItem key={noticia.id} noticia={noticia} index={index} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
