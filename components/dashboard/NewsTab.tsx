import { EmptyState } from "@/components/ui/EmptyState";
import type { ApiMeta, Noticia } from "@/lib/types";
import { NoticiaListItem } from "./NoticiaListItem";
import { SourceMetaBar } from "./SourceMetaBar";
import { TabSectionHeader } from "./TabSectionHeader";

interface NewsTabProps {
  noticias: Noticia[];
  newsMeta: ApiMeta;
  gdeltMeta?: ApiMeta;
}

export function NewsTab({ noticias, newsMeta, gdeltMeta }: NewsTabProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <SourceMetaBar sourceId="news" meta={newsMeta} />
      {gdeltMeta && gdeltMeta.status !== "mock" ? (
        <SourceMetaBar sourceId="gdelt" meta={gdeltMeta} />
      ) : null}
      <TabSectionHeader title="Feed de noticias" subtitle="RSS · GDELT con geoparse" />

      {noticias.length === 0 ? (
        <EmptyState
          title="Sin noticias disponibles"
          description="Activa la capa de noticias geo en el mapa o vuelve más tarde."
        />
      ) : (
        <div className="flex flex-col gap-0.5">
          {noticias.map((noticia, index) => (
            <NoticiaListItem key={noticia.id} noticia={noticia} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
