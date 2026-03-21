/**
 * Seed script: Creates ~50 realistic orders across multiple factories
 * with varied statuses, stages, dates, and progress levels.
 * This provides rich data for the analytics & custom charts features.
 *
 * Usage: npx tsx scripts/seed-analytics-orders.ts
 */

import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

// Use the main org (SockIT)
const ORG_ID = "cml269sho00000hxvv42km0r2";

// Factory IDs from the database
const FACTORIES = {
  guangzhou: "cftwbwo1jrs6mle17xqb",
  shenzhen: "cpibw75rj3himle17xse",
  dhaka: "cwptt3lpk28fmle17xu9",
  istanbul: "cz3jghbwygodmle17xw4",
  hochiminh: "c5fjkob5r79smle17xy0",
  mumbai: "cv3r8kxvbcrmle17xzu",
  jakarta: "c3comlb9cn9rmle17y1x",
  prato: "cimqsi9cvgqdmle17y3z",
  bangkok: "cwgbbum9sbd9mle17y5z",
  porto: "c1h87hi92wspmle17y7x",
};

const STAGE_NAMES = ["Cutting", "Sewing", "Quality Check", "Packaging"];
const STAGE_NAMES_ALT = ["Fabric Cutting", "Sewing", "Washing", "Quality Check", "Packing"];

type OrderStatus = "PENDING" | "IN_PROGRESS" | "DELAYED" | "DISRUPTED" | "COMPLETED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type StageStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "BLOCKED";
type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

function cuid(): string {
  return "c" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type OrderDef = {
  orderNumber: string;
  productName: string;
  productSKU: string;
  quantity: number;
  unit: string;
  status: OrderStatus;
  priority: Priority;
  overallProgress: number;
  expectedStartDate: Date;
  expectedDate: Date;
  actualDate: Date | null;
  factoryId: string;
  stages: string[];
  stageConfigs: Array<{
    status: StageStatus;
    progress: number;
    startedAt: Date | null;
    completedAt: Date | null;
  }>;
  tags: string[];
};

// --- Order definitions ---
const orders: OrderDef[] = [
  // ===== COMPLETED orders (old, for lead time & stage duration analytics) =====

  // Guangzhou - consistently fast factory
  ...completedOrder("ANA-001", "Cotton T-Shirt Basic", "TSH-BAS-01", 2000, FACTORIES.guangzhou, 90, 28, 26, "NORMAL"),
  ...completedOrder("ANA-002", "Cotton T-Shirt Basic", "TSH-BAS-01", 3000, FACTORIES.guangzhou, 75, 30, 29, "NORMAL"),
  ...completedOrder("ANA-003", "Linen Shirt Classic", "LSH-CLS-01", 800, FACTORIES.guangzhou, 60, 35, 33, "HIGH"),
  ...completedOrder("ANA-004", "Silk Blend Top", "SLK-TOP-01", 500, FACTORIES.guangzhou, 120, 42, 40, "NORMAL"),

  // Shenzhen - medium speed
  ...completedOrder("ANA-005", "Denim Jacket Oversized", "DNM-JKT-01", 1200, FACTORIES.shenzhen, 100, 45, 44, "NORMAL"),
  ...completedOrder("ANA-006", "Denim Jacket Oversized", "DNM-JKT-01", 1500, FACTORIES.shenzhen, 80, 45, 48, "HIGH"),
  ...completedOrder("ANA-007", "Cargo Pants Utility", "CRG-PNT-01", 2500, FACTORIES.shenzhen, 70, 38, 37, "NORMAL"),

  // Dhaka - cheaper but slower, some delays
  ...completedOrder("ANA-008", "Cotton T-Shirt Basic", "TSH-BAS-01", 5000, FACTORIES.dhaka, 110, 35, 42, "LOW"),
  ...completedOrder("ANA-009", "Hoodie Pullover", "HOD-PUL-01", 3000, FACTORIES.dhaka, 95, 40, 50, "NORMAL"),
  ...completedOrder("ANA-010", "Jogger Pants Fleece", "JGR-FLC-01", 4000, FACTORIES.dhaka, 85, 38, 45, "NORMAL"),

  // Istanbul - reliable, consistent
  ...completedOrder("ANA-011", "Wool Coat Winter", "WOL-COT-01", 600, FACTORIES.istanbul, 130, 55, 54, "HIGH"),
  ...completedOrder("ANA-012", "Linen Shirt Classic", "LSH-CLS-01", 1000, FACTORIES.istanbul, 105, 40, 39, "NORMAL"),
  ...completedOrder("ANA-013", "Cotton Dress Summer", "CTN-DRS-01", 800, FACTORIES.istanbul, 65, 32, 31, "NORMAL"),

  // Ho Chi Minh - fast and reliable
  ...completedOrder("ANA-014", "Silk Scarf Collection", "SLK-SCF-01", 2000, FACTORIES.hochiminh, 50, 25, 23, "NORMAL"),
  ...completedOrder("ANA-015", "Cotton T-Shirt Basic", "TSH-BAS-01", 4000, FACTORIES.hochiminh, 40, 28, 27, "LOW"),

  // Mumbai - mixed results
  ...completedOrder("ANA-016", "Embroidered Kurta", "EMB-KRT-01", 1500, FACTORIES.mumbai, 70, 35, 40, "NORMAL"),
  ...completedOrder("ANA-017", "Cotton Dress Summer", "CTN-DRS-01", 2000, FACTORIES.mumbai, 55, 30, 28, "HIGH"),

  // Prato - premium, slow but quality
  ...completedOrder("ANA-018", "Wool Coat Winter", "WOL-COT-01", 300, FACTORIES.prato, 150, 60, 58, "URGENT"),
  ...completedOrder("ANA-019", "Silk Blend Top", "SLK-TOP-01", 400, FACTORIES.prato, 140, 55, 56, "HIGH"),

  // Bangkok - medium
  ...completedOrder("ANA-020", "Silk Scarf Collection", "SLK-SCF-01", 1500, FACTORIES.bangkok, 45, 28, 30, "NORMAL"),

  // Porto - leather specialty
  ...completedOrder("ANA-021", "Leather Belt Premium", "LTH-BLT-01", 1000, FACTORIES.porto, 60, 35, 34, "NORMAL"),
  ...completedOrder("ANA-022", "Leather Bag Tote", "LTH-BAG-01", 500, FACTORIES.porto, 90, 50, 48, "HIGH"),

  // ===== DELIVERED orders (shipped and received) =====
  ...deliveredOrder("ANA-023", "Cotton T-Shirt Basic", "TSH-BAS-01", 3000, FACTORIES.guangzhou, 55, 28),
  ...deliveredOrder("ANA-024", "Denim Jacket Oversized", "DNM-JKT-01", 1000, FACTORIES.shenzhen, 50, 44),

  // ===== ACTIVE / IN PROGRESS orders =====
  {
    orderNumber: "ANA-025", productName: "Summer Collection Polo", productSKU: "POL-SUM-01",
    quantity: 2500, unit: "pieces", status: "IN_PROGRESS" as OrderStatus, priority: "NORMAL" as Priority,
    overallProgress: 65, expectedStartDate: daysAgo(20), expectedDate: daysFromNow(15), actualDate: null,
    factoryId: FACTORIES.guangzhou, stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(18), completedAt: daysAgo(13) },
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(13), completedAt: daysAgo(6) },
      { status: "IN_PROGRESS", progress: 60, startedAt: daysAgo(6), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },
  {
    orderNumber: "ANA-026", productName: "Hoodie Pullover", productSKU: "HOD-PUL-01",
    quantity: 1800, unit: "pieces", status: "IN_PROGRESS" as OrderStatus, priority: "HIGH" as Priority,
    overallProgress: 40, expectedStartDate: daysAgo(15), expectedDate: daysFromNow(20), actualDate: null,
    factoryId: FACTORIES.shenzhen, stages: STAGE_NAMES, tags: ["production", "urgent"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(13), completedAt: daysAgo(8) },
      { status: "IN_PROGRESS", progress: 55, startedAt: daysAgo(8), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },
  {
    orderNumber: "ANA-027", productName: "Linen Shirt Classic", productSKU: "LSH-CLS-01",
    quantity: 1200, unit: "pieces", status: "IN_PROGRESS" as OrderStatus, priority: "NORMAL" as Priority,
    overallProgress: 25, expectedStartDate: daysAgo(10), expectedDate: daysFromNow(25), actualDate: null,
    factoryId: FACTORIES.istanbul, stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(8), completedAt: daysAgo(4) },
      { status: "IN_PROGRESS", progress: 20, startedAt: daysAgo(4), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },
  {
    orderNumber: "ANA-028", productName: "Cargo Pants Utility", productSKU: "CRG-PNT-01",
    quantity: 3000, unit: "pieces", status: "IN_PROGRESS" as OrderStatus, priority: "NORMAL" as Priority,
    overallProgress: 80, expectedStartDate: daysAgo(30), expectedDate: daysFromNow(5), actualDate: null,
    factoryId: FACTORIES.hochiminh, stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(28), completedAt: daysAgo(20) },
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(20), completedAt: daysAgo(10) },
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(10), completedAt: daysAgo(4) },
      { status: "IN_PROGRESS", progress: 70, startedAt: daysAgo(4), completedAt: null },
    ],
  },

  // ===== PENDING orders (just placed) =====
  {
    orderNumber: "ANA-029", productName: "Winter Jacket Puffer", productSKU: "WNT-JKT-01",
    quantity: 800, unit: "pieces", status: "PENDING" as OrderStatus, priority: "NORMAL" as Priority,
    overallProgress: 0, expectedStartDate: daysAgo(2), expectedDate: daysFromNow(45), actualDate: null,
    factoryId: FACTORIES.prato, stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: [
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },
  {
    orderNumber: "ANA-030", productName: "Silk Blend Top", productSKU: "SLK-TOP-01",
    quantity: 600, unit: "pieces", status: "PENDING" as OrderStatus, priority: "HIGH" as Priority,
    overallProgress: 0, expectedStartDate: daysAgo(1), expectedDate: daysFromNow(35), actualDate: null,
    factoryId: FACTORIES.bangkok, stages: STAGE_NAMES, tags: ["sample"],
    stageConfigs: [
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },

  // ===== DELAYED orders =====
  {
    orderNumber: "ANA-031", productName: "Embroidered Kurta", productSKU: "EMB-KRT-01",
    quantity: 2000, unit: "pieces", status: "DELAYED" as OrderStatus, priority: "HIGH" as Priority,
    overallProgress: 50, expectedStartDate: daysAgo(40), expectedDate: daysAgo(5), actualDate: null,
    factoryId: FACTORIES.mumbai, stages: STAGE_NAMES_ALT, tags: ["production", "urgent"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(38), completedAt: daysAgo(30) },
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(30), completedAt: daysAgo(20) },
      { status: "DELAYED", progress: 40, startedAt: daysAgo(20), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },
  {
    orderNumber: "ANA-032", productName: "Jogger Pants Fleece", productSKU: "JGR-FLC-01",
    quantity: 3500, unit: "pieces", status: "DELAYED" as OrderStatus, priority: "URGENT" as Priority,
    overallProgress: 35, expectedStartDate: daysAgo(35), expectedDate: daysAgo(2), actualDate: null,
    factoryId: FACTORIES.dhaka, stages: STAGE_NAMES, tags: ["production", "urgent"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(33), completedAt: daysAgo(25) },
      { status: "DELAYED", progress: 60, startedAt: daysAgo(25), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },
  {
    orderNumber: "ANA-033", productName: "Cotton Dress Summer", productSKU: "CTN-DRS-01",
    quantity: 1500, unit: "pieces", status: "DELAYED" as OrderStatus, priority: "NORMAL" as Priority,
    overallProgress: 70, expectedStartDate: daysAgo(45), expectedDate: daysAgo(8), actualDate: null,
    factoryId: FACTORIES.jakarta, stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(43), completedAt: daysAgo(35) },
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(35), completedAt: daysAgo(22) },
      { status: "DELAYED", progress: 80, startedAt: daysAgo(22), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },

  // ===== DISRUPTED orders =====
  {
    orderNumber: "ANA-034", productName: "Wool Coat Winter", productSKU: "WOL-COT-01",
    quantity: 400, unit: "pieces", status: "DISRUPTED" as OrderStatus, priority: "URGENT" as Priority,
    overallProgress: 30, expectedStartDate: daysAgo(50), expectedDate: daysAgo(10), actualDate: null,
    factoryId: FACTORIES.dhaka, stages: STAGE_NAMES, tags: ["production", "urgent"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(48), completedAt: daysAgo(40) },
      { status: "BLOCKED", progress: 20, startedAt: daysAgo(40), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },
  {
    orderNumber: "ANA-035", productName: "Leather Bag Tote", productSKU: "LTH-BAG-01",
    quantity: 300, unit: "pieces", status: "DISRUPTED" as OrderStatus, priority: "HIGH" as Priority,
    overallProgress: 15, expectedStartDate: daysAgo(25), expectedDate: daysFromNow(10), actualDate: null,
    factoryId: FACTORIES.porto, stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: [
      { status: "BLOCKED", progress: 60, startedAt: daysAgo(23), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },

  // ===== More COMPLETED for recent weeks (fills trend chart) =====
  ...completedOrder("ANA-036", "Cotton T-Shirt Basic", "TSH-BAS-01", 1500, FACTORIES.guangzhou, 14, 28, 27, "NORMAL"),
  ...completedOrder("ANA-037", "Hoodie Pullover", "HOD-PUL-01", 2000, FACTORIES.shenzhen, 21, 40, 38, "NORMAL"),
  ...completedOrder("ANA-038", "Silk Scarf Collection", "SLK-SCF-01", 1000, FACTORIES.hochiminh, 28, 25, 24, "LOW"),
  ...completedOrder("ANA-039", "Linen Shirt Classic", "LSH-CLS-01", 900, FACTORIES.istanbul, 35, 35, 33, "NORMAL"),
  ...completedOrder("ANA-040", "Denim Jacket Oversized", "DNM-JKT-01", 700, FACTORIES.shenzhen, 42, 45, 43, "HIGH"),
  ...completedOrder("ANA-041", "Cotton Dress Summer", "CTN-DRS-01", 1100, FACTORIES.mumbai, 49, 32, 30, "NORMAL"),
  ...completedOrder("ANA-042", "Cargo Pants Utility", "CRG-PNT-01", 2200, FACTORIES.hochiminh, 56, 30, 29, "NORMAL"),
  ...completedOrder("ANA-043", "Leather Belt Premium", "LTH-BLT-01", 800, FACTORIES.porto, 63, 35, 33, "NORMAL"),
  ...completedOrder("ANA-044", "Embroidered Kurta", "EMB-KRT-01", 1300, FACTORIES.mumbai, 70, 38, 36, "NORMAL"),
  ...completedOrder("ANA-045", "Jogger Pants Fleece", "JGR-FLC-01", 2800, FACTORIES.dhaka, 77, 40, 46, "LOW"),

  // ===== SHIPPED =====
  {
    orderNumber: "ANA-046", productName: "Summer Collection Polo", productSKU: "POL-SUM-01",
    quantity: 1800, unit: "pieces", status: "SHIPPED" as OrderStatus, priority: "NORMAL" as Priority,
    overallProgress: 100, expectedStartDate: daysAgo(50), expectedDate: daysAgo(15), actualDate: daysAgo(14),
    factoryId: FACTORIES.guangzhou, stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(48), completedAt: daysAgo(40) },
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(40), completedAt: daysAgo(28) },
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(28), completedAt: daysAgo(18) },
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(18), completedAt: daysAgo(14) },
    ],
  },

  // A few more in-progress across different weeks for trend variety
  {
    orderNumber: "ANA-047", productName: "Wool Blend Cardigan", productSKU: "WOL-CRD-01",
    quantity: 500, unit: "pieces", status: "IN_PROGRESS" as OrderStatus, priority: "NORMAL" as Priority,
    overallProgress: 50, expectedStartDate: daysAgo(18), expectedDate: daysFromNow(12), actualDate: null,
    factoryId: FACTORIES.prato, stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: [
      { status: "COMPLETED", progress: 100, startedAt: daysAgo(16), completedAt: daysAgo(10) },
      { status: "IN_PROGRESS", progress: 50, startedAt: daysAgo(10), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },
  {
    orderNumber: "ANA-048", productName: "Silk Blend Top", productSKU: "SLK-TOP-01",
    quantity: 700, unit: "pieces", status: "IN_PROGRESS" as OrderStatus, priority: "HIGH" as Priority,
    overallProgress: 15, expectedStartDate: daysAgo(7), expectedDate: daysFromNow(30), actualDate: null,
    factoryId: FACTORIES.bangkok, stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: [
      { status: "IN_PROGRESS", progress: 60, startedAt: daysAgo(5), completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
      { status: "NOT_STARTED", progress: 0, startedAt: null, completedAt: null },
    ],
  },
];

// Helper: generate a completed order definition
function completedOrder(
  orderNumber: string, productName: string, sku: string, qty: number,
  factoryId: string, daysAgoOrdered: number, expectedDays: number, actualDays: number,
  priority: Priority
): OrderDef[] {
  const expectedStartDate = daysAgo(daysAgoOrdered);
  const expectedDate = new Date(expectedStartDate);
  expectedDate.setDate(expectedDate.getDate() + expectedDays);
  const actualDate = new Date(expectedStartDate);
  actualDate.setDate(actualDate.getDate() + actualDays);

  const totalDays = actualDays;
  const stageLen = Math.floor(totalDays / 4);

  return [{
    orderNumber, productName, productSKU: sku, quantity: qty, unit: "pieces",
    status: "COMPLETED", priority, overallProgress: 100,
    expectedStartDate, expectedDate, actualDate, factoryId,
    stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: STAGE_NAMES.map((_, i) => {
      const startDay = i * stageLen;
      const endDay = i === 3 ? totalDays : (i + 1) * stageLen;
      return {
        status: "COMPLETED" as StageStatus,
        progress: 100,
        startedAt: new Date(expectedStartDate.getTime() + startDay * 86400000),
        completedAt: new Date(expectedStartDate.getTime() + endDay * 86400000),
      };
    }),
  }];
}

function deliveredOrder(
  orderNumber: string, productName: string, sku: string, qty: number,
  factoryId: string, daysAgoOrdered: number, actualDays: number,
): OrderDef[] {
  const expectedStartDate = daysAgo(daysAgoOrdered);
  const expectedDate = new Date(expectedStartDate);
  expectedDate.setDate(expectedDate.getDate() + actualDays + 2);
  const actualDate = new Date(expectedStartDate);
  actualDate.setDate(actualDate.getDate() + actualDays);

  const stageLen = Math.floor(actualDays / 4);

  return [{
    orderNumber, productName, productSKU: sku, quantity: qty, unit: "pieces",
    status: "DELIVERED", priority: "NORMAL", overallProgress: 100,
    expectedStartDate, expectedDate, actualDate, factoryId,
    stages: STAGE_NAMES, tags: ["production"],
    stageConfigs: STAGE_NAMES.map((_, i) => {
      const startDay = i * stageLen;
      const endDay = i === 3 ? actualDays : (i + 1) * stageLen;
      return {
        status: "COMPLETED" as StageStatus,
        progress: 100,
        startedAt: new Date(expectedStartDate.getTime() + startDay * 86400000),
        completedAt: new Date(expectedStartDate.getTime() + endDay * 86400000),
      };
    }),
  }];
}

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let created = 0;
    for (const order of orders) {
      // Check if order already exists
      const existing = await client.query(
        `SELECT id FROM "Order" WHERE "organizationId" = $1 AND "orderNumber" = $2`,
        [ORG_ID, order.orderNumber]
      );
      if (existing.rows.length > 0) {
        console.log(`  Skipping ${order.orderNumber} (already exists)`);
        continue;
      }

      const orderId = cuid();
      const now = new Date();

      await client.query(
        `INSERT INTO "Order" (
          id, "orderNumber", "productName", "productSKU", quantity, unit,
          "overallProgress", status, "expectedStartDate", "expectedDate", "actualDate",
          priority, tags, "organizationId", "factoryId", "createdAt", "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          orderId, order.orderNumber, order.productName, order.productSKU,
          order.quantity, order.unit, order.overallProgress, order.status,
          order.expectedStartDate.toISOString(), order.expectedDate.toISOString(),
          order.actualDate?.toISOString() || null,
          order.priority, `{${order.tags.map(t => `"${t}"`).join(",")}}`,
          ORG_ID, order.factoryId, now.toISOString(), now.toISOString(),
        ]
      );

      // Insert stages
      for (let i = 0; i < order.stages.length; i++) {
        const sc = order.stageConfigs[i];
        const stageId = cuid();
        await client.query(
          `INSERT INTO "OrderStage" (
            id, "orderId", name, sequence, progress, status,
            "startedAt", "completedAt", "createdAt", "updatedAt"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            stageId, orderId, order.stages[i], i + 1, sc.progress, sc.status,
            sc.startedAt?.toISOString() || null, sc.completedAt?.toISOString() || null,
            now.toISOString(), now.toISOString(),
          ]
        );
      }

      created++;
      console.log(`  Created ${order.orderNumber} — ${order.productName} [${order.status}]`);
    }

    await client.query("COMMIT");
    console.log(`\nDone! Created ${created} orders (skipped ${orders.length - created} existing).`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
