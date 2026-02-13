export type NewsCategory =
  | "tariff"
  | "supply-chain"
  | "commodities"
  | "trade"
  | "logistics";

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  category: NewsCategory;
  timestamp: string;
  isPriceUpdate?: boolean;
};

export type NewsFeedResponse = {
  success: boolean;
  data: {
    items: NewsItem[];
    lastUpdated: string;
  };
};
