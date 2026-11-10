import type { Noticia } from "@/lib/types";
import { getNoticiaStyles, safeHttpUrl } from "@/lib/utils";

interface NoticiaListItemProps {
  noticia: Noticia;
  index?: number;
  compact?: boolean;
  onPress?: () => void;
}

export function NoticiaListItem({ noticia, index = 0, compact, onPress }: NoticiaListItemProps) {
  const styles = getNoticiaStyles(noticia.tipo);
  const className = `animate-fade-in block border-l-2 border-transparent transition-colors hover:border-[#c8102e] hover:bg-surface ${
    compact ? "px-4 py-2.5" : "px-3.5 py-2.5"
  }`;

  const inner = compact ? (
    <>
      <div
        className="mb-1 inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-bold tracking-widest uppercase"
        style={{ color: styles.text, background: "rgba(11,13,16,0.05)" }}
      >
        {noticia.tipo}
      </div>
      <p className="mb-1 text-[11px] leading-snug text-ink-2">{noticia.titulo}</p>
      <p className="text-[11px] text-faint">
        {noticia.fuente} · {noticia.hora}
      </p>
    </>
  ) : (
    <>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="flex-1 text-[13px] leading-snug text-ink-2">{noticia.titulo}</h3>
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
      <p className="text-[11px] text-faint">
        {noticia.fuente} · {noticia.estado} · {noticia.hora}
      </p>
    </>
  );

  const safeUrl = safeHttpUrl(noticia.url);
  if (safeUrl) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} w-full text-left`}
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        {inner}
      </a>
    );
  }

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={`${className} w-full text-left`}
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        {inner}
      </button>
    );
  }

  return (
    <article className={className} style={{ animationDelay: `${index * 0.08}s` }}>
      {inner}
    </article>
  );
}
