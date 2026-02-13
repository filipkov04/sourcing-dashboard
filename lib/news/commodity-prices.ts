import type { NewsItem } from "./types";

const TRACKED_COMMODITIES = [
  "cotton",
  "crude_oil",
  "steel",
  "copper",
  "aluminum",
  "gold",
];

export async function fetchCommodityPrices(): Promise<NewsItem[]> {
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    console.warn("API_NINJAS_KEY not set — skipping commodity prices");
    return [];
  }

  const items: NewsItem[] = [];

  for (const name of TRACKED_COMMODITIES) {
    try {
      const res = await fetch(
        `https://api.api-ninjas.com/v1/commodityprice?name=${name}`,
        {
          headers: { "X-Api-Key": apiKey },
          next: { revalidate: 1800 },
        }
      );
      if (!res.ok) continue;
      const data = await res.json();

      if (data && data.price) {
        const displayName = name
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        const changeStr =
          data.change_percent > 0
            ? `+${data.change_percent}%`
            : `${data.change_percent}%`;

        items.push({
          id: `commodity-${name}`,
          title: `${displayName}: $${data.price} (${changeStr})`,
          url: "",
          source: "API Ninjas",
          category: "commodities",
          timestamp: new Date().toISOString(),
          isPriceUpdate: true,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch commodity price for ${name}:`, error);
    }
  }

  return items;
}
