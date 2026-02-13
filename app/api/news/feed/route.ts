import { NextResponse } from "next/server";
import { fetchRSSFeeds } from "@/lib/news/rss-parser";
import { fetchCommodityPrices } from "@/lib/news/commodity-prices";
import type { NewsItem, NewsFeedResponse } from "@/lib/news/types";

const MAX_ITEMS = 20;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

let cachedItems: NewsItem[] = [];
let cachedAt = 0;

function deduplicateItems(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function GET() {
  const now = Date.now();

  if (cachedItems.length > 0 && now - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json<NewsFeedResponse>({
      success: true,
      data: {
        items: cachedItems,
        lastUpdated: new Date(cachedAt).toISOString(),
      },
    });
  }

  const [rssItems, priceItems] = await Promise.all([
    fetchRSSFeeds(),
    fetchCommodityPrices(),
  ]);

  const merged = deduplicateItems([...rssItems, ...priceItems])
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, MAX_ITEMS);

  cachedItems = merged;
  cachedAt = now;

  return NextResponse.json<NewsFeedResponse>({
    success: true,
    data: {
      items: merged,
      lastUpdated: new Date(now).toISOString(),
    },
  });
}
