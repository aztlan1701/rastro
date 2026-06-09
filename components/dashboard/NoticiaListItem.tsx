import type { Noticia } from "@/lib/types";
import { getNoticiaStyles } from "@/lib/utils";

interface NoticiaListItemProps {
  noticia: Noticia;
  index?: number;
  compact?: boolean;
  onPress?: () => void;
}

export function NoticiaListItem({ noticia, index = 0, compact, onPress }: NoticiaListItemProps) {
  const styles = getNoticiaStyles(noticia.tipo);
  const className = `animate-fade-in block border-l-2 border-transparent transition-colors hover:border-[#ff2d55] hover:bg-white/[0.03] ${
    compact ? "px-4 py-2.5" : "px-3.5 py-2.5"
  }`;

  const inner = compact ? (
    <>
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
    </>
  ) : (
    <>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="flex-1 text-[13px] leading-snug text-[#d4d0c8]">{noticia.titulo}</h3>
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

  if (noticia.url) {
    return (
      <a
        href={noticia.url}
        target="_blank"
        rel="noreferrer"
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
