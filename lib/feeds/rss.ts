import Parser from "rss-parser";
import { RSS_FEEDS, USER_AGENT } from "@/lib/config";
import { NOTICIAS } from "@/lib/mock-data";
import { normalizeNewsItem } from "@/lib/feeds/news-utils";
import type { Noticia } from "@/lib/types";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": USER_AGENT },
});

export async function fetchRssNews(): Promise<{ items: Noticia[]; usedMock: boolean }> {
  const items: Noticia[] = [];

  await Promise.all(
    RSS_FEEDS.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
        const fuente = feed.title ?? new URL(feedUrl).hostname;

        for (const entry of feed.items.slice(0, 8)) {
          if (!entry.title) continue;
          const publishedAt = entry.isoDate ? new Date(entry.isoDate) : new Date();
          items.push(
            normalizeNewsItem({
              id: `rss-${feedUrl}-${entry.guid ?? entry.link ?? entry.title}`,
              titulo: entry.title,
              fuente,
              publishedAt,
              url: entry.link,
            }),
          );
        }
      } catch {
        // skip broken feed
      }
    }),
  );

  if (items.length === 0) {
    return {
      items: NOTICIAS,
      usedMock: true,
    };
  }

  items.sort((a, b) => {
    const parse = (hora: string) => {
      const m = hora.match(/(\d+)/);
      return m ? Number(m[1]) : 999;
    };
    return parse(a.hora) - parse(b.hora);
  });

  return { items: items.slice(0, 40), usedMock: false };
}
