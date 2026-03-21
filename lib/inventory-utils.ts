/**
 * Calculate volume in cubic meters from dimensions in centimeters
 */
export function calcVolumeCBM(lengthCm: number | null | undefined, widthCm: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (lengthCm == null || widthCm == null || heightCm == null) return null;
  return (lengthCm * widthCm * heightCm) / 1_000_000;
}

/**
 * Get color class for runway status badges
 */
export function runwayStatusColor(status: string | null | undefined): { bg: string; text: string; dot: string } {
  switch (status) {
    case "HEALTHY":
      return { bg: "bg-green-500/10 dark:bg-green-500/20", text: "text-green-700 dark:text-green-400", dot: "bg-green-500" };
    case "WARNING":
      return { bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" };
    case "CRITICAL":
      return { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" };
    case "OUT_OF_STOCK":
      return { bg: "bg-zinc-500/10 dark:bg-zinc-500/20", text: "text-zinc-700 dark:text-zinc-400", dot: "bg-zinc-500" };
    default:
      return { bg: "bg-zinc-500/10 dark:bg-zinc-500/20", text: "text-zinc-600 dark:text-zinc-400", dot: "bg-zinc-400" };
  }
}

/**
 * Aggregate stock levels across all locations for a product
 */
export function aggregateStock(stockLevels: Array<{ onHand: number; reserved: number; available: number; inTransit: number; backorder: number; runwayStatus: string | null; totalValue: number | null }>): {
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  totalInTransit: number;
  totalBackorder: number;
  totalValue: number;
  worstRunwayStatus: string | null;
} {
  const result = {
    totalOnHand: 0,
    totalReserved: 0,
    totalAvailable: 0,
    totalInTransit: 0,
    totalBackorder: 0,
    totalValue: 0,
    worstRunwayStatus: null as string | null,
  };

  const statusPriority: Record<string, number> = {
    OUT_OF_STOCK: 0,
    CRITICAL: 1,
    WARNING: 2,
    HEALTHY: 3,
  };

  for (const stock of stockLevels) {
    result.totalOnHand += stock.onHand;
    result.totalReserved += stock.reserved;
    result.totalAvailable += stock.available;
    result.totalInTransit += stock.inTransit;
    result.totalBackorder += stock.backorder;
    result.totalValue += stock.totalValue ?? 0;

    if (stock.runwayStatus) {
      const currentPriority = result.worstRunwayStatus ? (statusPriority[result.worstRunwayStatus] ?? 999) : 999;
      const newPriority = statusPriority[stock.runwayStatus] ?? 999;
      if (newPriority < currentPriority) {
        result.worstRunwayStatus = stock.runwayStatus;
      }
    }
  }

  return result;
}

/**
 * Generate a deterministic color for a tag string (for pill badges)
 */
export function tagColor(tag: string): { bg: string; text: string } {
  const colors = [
    { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-700 dark:text-blue-400" },
    { bg: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-700 dark:text-purple-400" },
    { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400" },
    { bg: "bg-orange-500/10 dark:bg-orange-500/20", text: "text-orange-700 dark:text-orange-400" },
    { bg: "bg-pink-500/10 dark:bg-pink-500/20", text: "text-pink-700 dark:text-pink-400" },
    { bg: "bg-cyan-500/10 dark:bg-cyan-500/20", text: "text-cyan-700 dark:text-cyan-400" },
    { bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-400" },
    { bg: "bg-indigo-500/10 dark:bg-indigo-500/20", text: "text-indigo-700 dark:text-indigo-400" },
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Format currency value
 */
export function formatCurrency(value: number | null | undefined, currency: string = "USD"): string {
  if (value == null) return "\u2014";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
}
