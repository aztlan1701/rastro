import { geoparseText, isInMexico } from "@/lib/geoparse/mx-places";
import { normalizeNewsItem } from "@/lib/feeds/news-utils";
import type { Noticia } from "@/lib/types";

const GDELT_URL =
  "https://api.gdeltproject.org/api/v2/doc/doc?query=desaparecid+mexico&mode=artlist&maxrecords=25&format=json";

interface GdeltArticle {
  title?: string;
  url?: string;
  seendate?: string;
  sourcecountry?: string;
  domain?: string;
}

export async function fetchGdeltNews(): Promise<{ items: Noticia[]; usedMock: boolean }> {
  try {
    const response = await fetch(GDELT_URL, {
      next: { revalidate: 1800 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error("GDELT unavailable");

    const payload = (await response.json()) as { articles?: GdeltArticle[] };
    const articles = payload.articles ?? [];

    const items = articles
      .filter((article) => article.title)
      .map((article, index) => {
        const publishedAt = article.seendate
          ? new Date(
              `${article.seendate.slice(0, 4)}-${article.seendate.slice(4, 6)}-${article.seendate.slice(6, 8)}T12:00:00Z`,
            )
          : new Date();

        const geo = geoparseText(article.title ?? "");
        const item = normalizeNewsItem({
          id: `gdelt-${index}-${article.url ?? article.title}`,
          titulo: article.title ?? "",
          fuente: article.domain ?? "GDELT",
          publishedAt,
          url: article.url,
          lat: geo?.lat,
          lng: geo?.lng,
        });

        if (geo && isInMexico(geo.lat, geo.lng)) {
          item.estado = geo.label;
        }

        return item;
      });

    if (items.length === 0) throw new Error("GDELT empty");

    return { items, usedMock: false };
  } catch {
    return { items: [], usedMock: true };
  }
}
