import { XMLParser } from "fast-xml-parser";
import type { NewsCategory, NewsItem } from "./types";

const RSS_SOURCES = [
  {
    url: "https://www.supplychaindive.com/feeds/news/",
    name: "Supply Chain Dive",
  },
  {
    url: "https://www.freightwaves.com/news/feed",
    name: "FreightWaves",
  },
  {
    url: "https://www.supplychainbrain.com/rss/articles",
    name: "Supply Chain Brain",
  },
];

const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  tariff: ["tariff", "duty", "customs", "trade war", "import tax", "export ban"],
  "supply-chain": [
    "supply chain",
    "disruption",
    "shortage",
    "logistics",
    "shipping delay",
  ],
  commodities: [
    "cotton",
    "steel",
    "oil",
    "copper",
    "aluminum",
    "raw material",
    "commodity",
  ],
  trade: ["trade deal", "trade agreement", "sanctions", "embargo", "WTO"],
  logistics: ["freight", "shipping", "port", "container", "warehouse"],
};

function categorize(title: string): NewsCategory {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category as NewsCategory;
    }
  }
  return "supply-chain";
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function fetchRSSFeeds(): Promise<NewsItem[]> {
  const parser = new XMLParser();
  const allItems: NewsItem[] = [];

  for (const source of RSS_SOURCES) {
    try {
      const res = await fetch(source.url, { next: { revalidate: 900 } });
      if (!res.ok) continue;
      const xml = await res.text();
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item || [];

      for (const item of Array.isArray(items) ? items : [items]) {
        allItems.push({
          id: hashString(item.link || item.title),
          title: item.title?.toString().trim() || "",
          url: item.link?.toString() || "",
          source: source.name,
          category: categorize(item.title || ""),
          timestamp: new Date(item.pubDate || Date.now()).toISOString(),
        });
      }
    } catch (error) {
      console.error(`Failed to fetch RSS from ${source.name}:`, error);
    }
  }

  return allItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
