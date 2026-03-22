// Types

export interface SalesVelocity {
  daily7d: number;
  daily30d: number;
  daily90d: number;
  weightedAverage: number;
}

export interface RunwayCalculation {
  productId: string;
  sku: string;
  productName: string;
  availableStock: number;
  safetyStock: number;
  dailyVelocity: number;
  daysOfStock: number;
  runwayStatus: "HEALTHY" | "WARNING" | "CRITICAL" | "OUT_OF_STOCK";
  reorderRecommended: boolean;
  suggestedOrderQty: number;
  totalLeadTimeDays: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedStockoutDate: Date | null;
}

export interface ProductForecastInput {
  id: string;
  sku: string;
  name: string;
  safetyStock: number | null;
  minStock: number | null;
  moq: number | null;
  leadTimeProdDays: number | null;
  leadTimeShipDays: number | null;
  dailySalesEstimate: number | null;
  stockLevels: Array<{
    onHand: number;
    reserved: number;
    available: number;
    inTransit: number;
  }>;
  // SALE type transactions from the last 90 days
  recentSaleTransactions: Array<{
    quantity: number; // negative for sales
    performedAt: Date;
  }>;
}

// Functions

/**
 * Calculate sales velocity from transaction history or manual estimate
 * Uses weighted average: 7d (50%), 30d (30%), 90d (20%)
 */
export function calculateSalesVelocity(
  transactions: Array<{ quantity: number; performedAt: Date }>,
  dailySalesEstimate: number | null
): SalesVelocity {
  const now = new Date();
  const ms7d = 7 * 24 * 60 * 60 * 1000;
  const ms30d = 30 * 24 * 60 * 60 * 1000;

  // Sum absolute quantities of SALE transactions (quantity is negative for sales)
  const sum7d = transactions
    .filter(t => now.getTime() - new Date(t.performedAt).getTime() <= ms7d)
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);
  const sum30d = transactions
    .filter(t => now.getTime() - new Date(t.performedAt).getTime() <= ms30d)
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);
  const sum90d = transactions
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

  const daily7d = sum7d / 7;
  const daily30d = sum30d / 30;
  const daily90d = sum90d / 90;

  // If we have real transaction data (any sales in 90 days), use weighted average
  if (sum90d > 0) {
    const weightedAverage = daily7d * 0.5 + daily30d * 0.3 + daily90d * 0.2;
    return { daily7d, daily30d, daily90d, weightedAverage };
  }

  // Fall back to manual estimate
  const estimate = dailySalesEstimate ?? 0;
  return {
    daily7d: estimate,
    daily30d: estimate,
    daily90d: estimate,
    weightedAverage: estimate,
  };
}

/**
 * Calculate runway in days
 * Formula: (available - safety) / dailyVelocity
 */
export function calculateRunway(
  availableStock: number,
  safetyStock: number,
  dailyVelocity: number
): number {
  if (dailyVelocity <= 0) return Infinity; // No sales = infinite runway
  const effectiveStock = availableStock - safetyStock;
  if (effectiveStock <= 0) return 0;
  return effectiveStock / dailyVelocity;
}

/**
 * Determine runway status from days of stock
 */
export function determineRunwayStatus(
  daysOfStock: number
): "HEALTHY" | "WARNING" | "CRITICAL" | "OUT_OF_STOCK" {
  if (daysOfStock <= 0) return "OUT_OF_STOCK";
  if (daysOfStock < 15) return "CRITICAL";
  if (daysOfStock <= 30) return "WARNING";
  return "HEALTHY";
}

/**
 * Determine urgency level
 */
export function determineUrgency(
  daysOfStock: number
): "LOW" | "MEDIUM" | "HIGH" | "URGENT" {
  if (daysOfStock <= 7) return "URGENT";
  if (daysOfStock <= 14) return "HIGH";
  if (daysOfStock <= 30) return "MEDIUM";
  return "LOW";
}

/**
 * Calculate reorder recommendation
 */
export function calculateReorderPoint(
  dailyVelocity: number,
  daysOfStock: number,
  leadTimeProdDays: number | null,
  leadTimeShipDays: number | null,
  safetyStock: number | null,
  moq: number | null
): { reorderRecommended: boolean; suggestedOrderQty: number; totalLeadTimeDays: number } {
  const totalLeadTime = (leadTimeProdDays ?? 0) + (leadTimeShipDays ?? 0);
  const safetyBuffer = safetyStock ?? 0;

  // Reorder if runway < total lead time (you'll run out before new stock arrives)
  const reorderRecommended = daysOfStock < totalLeadTime + 7; // 7-day buffer

  // Suggested quantity: enough to cover lead time + safety stock
  let suggestedQty = 0;
  if (reorderRecommended && dailyVelocity > 0) {
    suggestedQty = Math.ceil(totalLeadTime * dailyVelocity) + safetyBuffer;
    // Round up to MOQ if below minimum
    if (moq && suggestedQty < moq) {
      suggestedQty = moq;
    }
    // Round up to nearest MOQ multiple if moq exists
    if (moq && moq > 0) {
      suggestedQty = Math.ceil(suggestedQty / moq) * moq;
    }
  }

  return { reorderRecommended, suggestedOrderQty: suggestedQty, totalLeadTimeDays: totalLeadTime };
}

/**
 * Compute full forecast for a single product
 * Orchestrator function that calls all above
 */
export function computeProductForecast(input: ProductForecastInput): RunwayCalculation {
  // 1. Aggregate stock across all locations
  const totalAvailable = input.stockLevels.reduce((sum, s) => sum + s.available, 0);
  const totalOnHand = input.stockLevels.reduce((sum, s) => sum + s.onHand, 0);
  const safetyStock = input.safetyStock ?? 0;

  // 2. Calculate velocity
  const velocity = calculateSalesVelocity(input.recentSaleTransactions, input.dailySalesEstimate);

  // 3. Calculate runway
  const daysOfStock = calculateRunway(totalAvailable, safetyStock, velocity.weightedAverage);

  // 4. Determine status and urgency
  const runwayStatus = totalOnHand <= 0 ? "OUT_OF_STOCK" : determineRunwayStatus(daysOfStock);
  const urgency = determineUrgency(daysOfStock === Infinity ? 999 : daysOfStock);

  // 5. Calculate reorder point
  const reorder = calculateReorderPoint(
    velocity.weightedAverage,
    daysOfStock === Infinity ? 999 : daysOfStock,
    input.leadTimeProdDays,
    input.leadTimeShipDays,
    input.safetyStock,
    input.moq
  );

  // 6. Estimated stockout date
  let estimatedStockoutDate: Date | null = null;
  if (daysOfStock !== Infinity && daysOfStock > 0) {
    estimatedStockoutDate = new Date(Date.now() + daysOfStock * 24 * 60 * 60 * 1000);
  }

  return {
    productId: input.id,
    sku: input.sku,
    productName: input.name,
    availableStock: totalAvailable,
    safetyStock,
    dailyVelocity: velocity.weightedAverage,
    daysOfStock: daysOfStock === Infinity ? 999 : Math.round(daysOfStock),
    runwayStatus,
    reorderRecommended: reorder.reorderRecommended,
    suggestedOrderQty: reorder.suggestedOrderQty,
    totalLeadTimeDays: reorder.totalLeadTimeDays,
    urgency: reorder.reorderRecommended ? urgency : "LOW",
    estimatedStockoutDate,
  };
}

/**
 * Compute forecasts for multiple products and return summary
 */
export function computeAllForecasts(products: ProductForecastInput[]): {
  items: RunwayCalculation[];
  summary: { healthy: number; warning: number; critical: number; outOfStock: number; reordersNeeded: number };
} {
  const items = products.map(computeProductForecast);

  // Sort by urgency priority, then by daysOfStock ascending
  const urgencyOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  items.sort((a, b) => {
    const urgDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgDiff !== 0) return urgDiff;
    return a.daysOfStock - b.daysOfStock;
  });

  const summary = {
    healthy: items.filter(i => i.runwayStatus === "HEALTHY").length,
    warning: items.filter(i => i.runwayStatus === "WARNING").length,
    critical: items.filter(i => i.runwayStatus === "CRITICAL").length,
    outOfStock: items.filter(i => i.runwayStatus === "OUT_OF_STOCK").length,
    reordersNeeded: items.filter(i => i.reorderRecommended).length,
  };

  return { items, summary };
}
