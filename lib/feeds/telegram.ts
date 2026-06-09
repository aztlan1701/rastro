import { TELEGRAM_CHANNELS } from "@/lib/config";
import { geoparseText } from "@/lib/geoparse/mx-places";
import { relativeTime } from "@/lib/feeds/news-utils";
import type { TelegramPost } from "@/lib/types";

function decodeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPosts(html: string, channel: string): TelegramPost[] {
  const posts: TelegramPost[] = [];
  const blockRegex =
    /<div class="tgme_widget_message_wrap[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
  const blocks = html.match(blockRegex) ?? [];

  for (const block of blocks.slice(0, 10)) {
    const textMatch = block.match(
      /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/,
    );
    const timeMatch = block.match(/<time[^>]+datetime="([^"]+)"/);
    const linkMatch = block.match(/data-post="([^"]+)"/);

    const text = decodeHtml(textMatch?.[1] ?? "");
    if (!text) continue;

    const geo = geoparseText(text);
    const postId = linkMatch?.[1] ?? `${channel}-${posts.length}`;
    const publishedAt = timeMatch?.[1] ? new Date(timeMatch[1]) : new Date();

    posts.push({
      id: postId,
      channel,
      text: text.slice(0, 280),
      url: `https://t.me/${postId.replace("/", "/")}`,
      hora: relativeTime(publishedAt),
      lat: geo?.lat,
      lng: geo?.lng,
      lugar: geo?.label,
      geoConfidence: geo?.confidence ?? "none",
    });
  }

  return posts;
}

export async function fetchTelegramFeed(): Promise<{
  posts: TelegramPost[];
  usedMock: boolean;
}> {
  const posts: TelegramPost[] = [];

  await Promise.all(
    TELEGRAM_CHANNELS.map(async (channel) => {
      try {
        const response = await fetch(`https://t.me/s/${channel}`, {
          next: { revalidate: 900 },
          headers: { "User-Agent": "RASTRO/0.2" },
        });
        if (!response.ok) return;
        const html = await response.text();
        posts.push(...extractPosts(html, channel));
      } catch {
        // skip channel
      }
    }),
  );

  return {
    posts: posts.filter((post) => post.lat && post.lng),
    usedMock: posts.length === 0,
  };
}
