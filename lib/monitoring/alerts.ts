import { ALERT_WEBHOOK_URL, MONITOR_ESTADOS, MONITOR_KEYWORDS } from "@/lib/config";
import { fetchGdeltNews } from "@/lib/feeds/gdelt";
import { fetchRssNews } from "@/lib/feeds/rss";

export interface MonitorMatch {
  id: string;
  titulo: string;
  fuente: string;
  estado: string;
  url?: string;
  matchedKeywords: string[];
}

export interface MonitorResult {
  matches: MonitorMatch[];
  checkedAt: string;
  webhookSent: boolean;
}

function matchesMonitor(item: { titulo: string; estado: string }, keywords: string[]): string[] {
  const text = `${item.titulo} ${item.estado}`.toLowerCase();
  return keywords.filter((keyword) => text.includes(keyword));
}

export async function runMonitorCheck(sendWebhook = true): Promise<MonitorResult> {
  const [rss, gdelt] = await Promise.all([fetchRssNews(), fetchGdeltNews()]);
  const items = [...rss.items, ...gdelt.items];

  const matches: MonitorMatch[] = [];

  for (const item of items) {
    if (MONITOR_ESTADOS.length > 0 && !MONITOR_ESTADOS.includes(item.estado)) continue;

    const matchedKeywords = matchesMonitor(item, MONITOR_KEYWORDS);
    if (matchedKeywords.length === 0) continue;

    matches.push({
      id: item.id,
      titulo: item.titulo,
      fuente: item.fuente,
      estado: item.estado,
      url: item.url,
      matchedKeywords,
    });
  }

  let webhookSent = false;

  if (sendWebhook && ALERT_WEBHOOK_URL && matches.length > 0) {
    try {
      const response = await fetch(ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "RASTRO",
          checkedAt: new Date().toISOString(),
          matchCount: matches.length,
          matches: matches.slice(0, 10),
        }),
      });
      webhookSent = response.ok;
    } catch {
      webhookSent = false;
    }
  }

  return {
    matches: matches.slice(0, 25),
    checkedAt: new Date().toISOString(),
    webhookSent,
  };
}
