/**
 * Seed script: Creates realistic orders with full production data
 * including stages (with expected dates, notes, metadata), events,
 * admin notes, comments, and alerts.
 *
 * Usage: npx tsx scripts/seed-full-orders.ts
 */

import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

// Spotene Ponozky — the org where the actual users and factories live
const ORG_ID = "cml267lu10000ngs1lsuc1rdy";

// Users in this org
const USERS = {
  palo: { id: "cml267lv90001ngs18y53xyf3", name: "Palo Heriban" },
  tong: { id: "cml269sj000010hxvvrlamk8c", name: "tong po" },
  filip: { id: "cmlnpk5n6000003xvqyxpb2mj", name: "Filip Vrablik" },
};

// Factories in this org
const FACTORIES = {
  guangzhou:  "cftwbwo1jrs6mle17xqb",
  shenzhen:   "cpibw75rj3himle17xse",
  dhaka:      "cwptt3lpk28fmle17xu9",
  istanbul:   "cz3jghbwygodmle17xw4",
  hochiminh:  "c5fjkob5r79smle17xy0",
  mumbai:     "cv3r8kxvbcrmle17xzu",
  jakarta:    "c3comlb9cn9rmle17y1x",
  prato:      "cimqsi9cvgqdmle17y3z",
  bangkok:    "cwgbbum9sbd9mle17y5z",
  porto:      "c1h87hi92wspmle17y7x",
};

type OrderStatus = "PENDING" | "IN_PROGRESS" | "DELAYED" | "DISRUPTED" | "COMPLETED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type StageStatus = "NOT_STARTED" | "IN_PROGRESS" | "BEHIND_SCHEDULE" | "COMPLETED" | "SKIPPED" | "DELAYED" | "BLOCKED";
type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

function cuid(): string {
  return "c" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);
}

function d(daysAgo: number, hoursOffset = 0): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(dt.getHours() + hoursOffset);
  return dt;
}

function future(daysFromNow: number): Date {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromNow);
  return dt;
}

// ─── Stage definitions ─────────────────────────────────────────
type StageDef = {
  name: string;
  sequence: number;
  status: StageStatus;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  expectedStartDate: Date | null;
  expectedEndDate: Date | null;
  notes: string | null;
  metadata: Array<{ key: string; value: string }>;
};

type OrderDef = {
  orderNumber: string;
  productName: string;
  productSKU: string;
  quantity: number;
  unit: string;
  status: OrderStatus;
  priority: Priority;
  overallProgress: number;
  orderDate: Date;
  expectedDate: Date;
  actualDate: Date | null;
  notes: string | null;
  tags: string[];
  factoryId: string;
  stages: StageDef[];
};

// ─── Order definitions ─────────────────────────────────────────

const orders: OrderDef[] = [

  // ═══════════════════════════════════════════
  // 1) COMPLETED — Guangzhou, on time, fast
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-001", productName: "Cotton T-Shirt Basic", productSKU: "TSH-BAS-WHT",
    quantity: 3000, unit: "pieces", status: "COMPLETED", priority: "NORMAL",
    overallProgress: 100, orderDate: d(85), expectedDate: d(45), actualDate: d(48),
    notes: "Standard white tee, 180gsm cotton. Client approved final sample on day 3.",
    tags: ["production", "basics"], factoryId: FACTORIES.guangzhou,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(83), completedAt: d(76), expectedStartDate: d(83), expectedEndDate: d(75),
        notes: "Fabric sourced from local supplier, no delays.",
        metadata: [{ key: "Responsible", value: "Li Wei" }, { key: "Machine", value: "CUT-A3" }, { key: "Fabric Lot", value: "LOT-2025-0412" }] },
      { name: "Sewing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(75), completedAt: d(62), expectedStartDate: d(74), expectedEndDate: d(60),
        notes: null,
        metadata: [{ key: "Responsible", value: "Chen Mei" }, { key: "Lines Used", value: "3" }] },
      { name: "Quality Check", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(62), completedAt: d(55), expectedStartDate: d(59), expectedEndDate: d(52),
        notes: "AQL 2.5 passed. Minor color inconsistency on 12 pieces — accepted by client.",
        metadata: [{ key: "Inspector", value: "Zhang Tao" }, { key: "Defect Rate", value: "0.4%" }, { key: "AQL Level", value: "2.5" }] },
      { name: "Packaging", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(55), completedAt: d(48), expectedStartDate: d(51), expectedEndDate: d(45),
        notes: "Poly-bagged, carton packed per client spec. 60 cartons.",
        metadata: [{ key: "Carton Count", value: "60" }, { key: "Packing Style", value: "Poly-bag individual" }] },
    ],
  },

  // ═══════════════════════════════════════════
  // 2) COMPLETED — Shenzhen, slightly late
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-002", productName: "Denim Jacket Oversized", productSKU: "DNM-JKT-OVR",
    quantity: 1200, unit: "pieces", status: "COMPLETED", priority: "HIGH",
    overallProgress: 100, orderDate: d(95), expectedDate: d(50), actualDate: d(46),
    notes: "Oversized fit, raw selvedge denim. Wash test needed before sewing.",
    tags: ["production", "denim", "premium"], factoryId: FACTORIES.shenzhen,
    stages: [
      { name: "Fabric Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(92), completedAt: d(82), expectedStartDate: d(93), expectedEndDate: d(83),
        notes: null,
        metadata: [{ key: "Responsible", value: "Wang Jun" }, { key: "Denim Weight", value: "14oz" }] },
      { name: "Sewing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(82), completedAt: d(65), expectedStartDate: d(82), expectedEndDate: d(68),
        notes: "Additional bar-tacking on stress points per client request.",
        metadata: [{ key: "Responsible", value: "Liu Fang" }, { key: "Stitch Count", value: "8 SPI" }] },
      { name: "Washing", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(65), completedAt: d(58), expectedStartDate: d(67), expectedEndDate: d(60),
        notes: "Stone wash + enzyme rinse. Color consistency confirmed.",
        metadata: [{ key: "Wash Type", value: "Stone + Enzyme" }, { key: "Shrinkage", value: "3.2%" }] },
      { name: "Quality Check", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(58), completedAt: d(51), expectedStartDate: d(59), expectedEndDate: d(54),
        notes: "2 pieces failed button pull test — replaced. AQL passed.",
        metadata: [{ key: "Inspector", value: "Chen Li" }, { key: "Defect Rate", value: "0.2%" }] },
      { name: "Packing", sequence: 5, status: "COMPLETED", progress: 100,
        startedAt: d(51), completedAt: d(46), expectedStartDate: d(53), expectedEndDate: d(50),
        notes: null,
        metadata: [{ key: "Carton Count", value: "48" }] },
    ],
  },

  // ═══════════════════════════════════════════
  // 3) COMPLETED — Istanbul, right on time
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-003", productName: "Wool Coat Winter", productSKU: "WOL-COT-BLK",
    quantity: 500, unit: "pieces", status: "COMPLETED", priority: "URGENT",
    overallProgress: 100, orderDate: d(130), expectedDate: d(68), actualDate: d(69),
    notes: "Premium 80/20 wool blend. Sample approved after 2 rounds.",
    tags: ["production", "premium", "outerwear"], factoryId: FACTORIES.istanbul,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(125), completedAt: d(112), expectedStartDate: d(126), expectedEndDate: d(113),
        notes: null,
        metadata: [{ key: "Responsible", value: "Mehmet Yilmaz" }, { key: "Fabric", value: "80/20 Wool-Poly" }] },
      { name: "Sewing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(112), completedAt: d(88), expectedStartDate: d(112), expectedEndDate: d(90),
        notes: "Hand-finished lapels. 6 seamstresses assigned.",
        metadata: [{ key: "Responsible", value: "Ayse Kaya" }, { key: "Lines Used", value: "2" }, { key: "Hand Finishing", value: "Yes" }] },
      { name: "Quality Check", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(88), completedAt: d(78), expectedStartDate: d(89), expectedEndDate: d(80),
        notes: "Lining puckering found in 8 pieces — reworked. All passed final inspection.",
        metadata: [{ key: "Inspector", value: "Emre Demir" }, { key: "Rework Count", value: "8" }] },
      { name: "Packaging", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(78), completedAt: d(69), expectedStartDate: d(79), expectedEndDate: d(68),
        notes: "Garment bags + branded hangtags. Ready for shipping.",
        metadata: [{ key: "Carton Count", value: "25" }, { key: "Packing Style", value: "Garment bag" }] },
    ],
  },

  // ═══════════════════════════════════════════
  // 4) COMPLETED — Ho Chi Minh, very fast
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-004", productName: "Silk Scarf Collection", productSKU: "SLK-SCF-MIX",
    quantity: 2000, unit: "pieces", status: "COMPLETED", priority: "NORMAL",
    overallProgress: 100, orderDate: d(55), expectedDate: d(25), actualDate: d(28),
    notes: "4 colorways, digital print on silk twill.",
    tags: ["production", "accessories", "silk"], factoryId: FACTORIES.hochiminh,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(53), completedAt: d(48), expectedStartDate: d(53), expectedEndDate: d(48),
        notes: null, metadata: [{ key: "Responsible", value: "Nguyen Van" }] },
      { name: "Printing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(48), completedAt: d(40), expectedStartDate: d(47), expectedEndDate: d(39),
        notes: "Digital inkjet on 19mm silk twill. Colors matched to Pantone refs.",
        metadata: [{ key: "Print Method", value: "Digital Inkjet" }, { key: "Colorways", value: "4" }] },
      { name: "Quality Check", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(40), completedAt: d(34), expectedStartDate: d(38), expectedEndDate: d(33),
        notes: "3 pieces with ink bleed — rejected and reprinted.",
        metadata: [{ key: "Inspector", value: "Tran Linh" }, { key: "Reject Rate", value: "0.15%" }] },
      { name: "Packing", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(34), completedAt: d(28), expectedStartDate: d(32), expectedEndDate: d(25),
        notes: "Gift boxes with tissue paper. 500 per colorway.",
        metadata: [{ key: "Packing Style", value: "Gift box" }] },
    ],
  },

  // ═══════════════════════════════════════════
  // 5) COMPLETED — Dhaka, late delivery
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-005", productName: "Hoodie Pullover", productSKU: "HOD-PUL-GRY",
    quantity: 5000, unit: "pieces", status: "COMPLETED", priority: "NORMAL",
    overallProgress: 100, orderDate: d(100), expectedDate: d(55), actualDate: d(42),
    notes: "High volume order. French terry 300gsm. Budget line.",
    tags: ["production", "bulk", "basics"], factoryId: FACTORIES.dhaka,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(97), completedAt: d(85), expectedStartDate: d(98), expectedEndDate: d(86),
        notes: null, metadata: [{ key: "Responsible", value: "Rahim Ahmed" }] },
      { name: "Sewing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(85), completedAt: d(62), expectedStartDate: d(85), expectedEndDate: d(68),
        notes: "Sewing delayed 5 days due to machine breakdown on line 2.",
        metadata: [{ key: "Responsible", value: "Fatima Begum" }, { key: "Lines Used", value: "4" }, { key: "Delay Reason", value: "Machine breakdown" }] },
      { name: "Quality Check", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(62), completedAt: d(52), expectedStartDate: d(67), expectedEndDate: d(60),
        notes: "High defect rate (3.1%) in first batch. Second inspection after rework passed.",
        metadata: [{ key: "Inspector", value: "Kamal Hossain" }, { key: "Initial Defect Rate", value: "3.1%" }, { key: "Final Defect Rate", value: "0.8%" }] },
      { name: "Packaging", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(52), completedAt: d(42), expectedStartDate: d(59), expectedEndDate: d(55),
        notes: null, metadata: [{ key: "Carton Count", value: "125" }] },
    ],
  },

  // ═══════════════════════════════════════════
  // 6) COMPLETED — Porto, leather specialty
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-006", productName: "Leather Belt Premium", productSKU: "LTH-BLT-TAN",
    quantity: 1000, unit: "pieces", status: "COMPLETED", priority: "HIGH",
    overallProgress: 100, orderDate: d(70), expectedDate: d(30), actualDate: d(32),
    notes: "Full grain Italian leather. Brass hardware. Handmade in Portugal.",
    tags: ["production", "leather", "premium"], factoryId: FACTORIES.porto,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(68), completedAt: d(60), expectedStartDate: d(68), expectedEndDate: d(60),
        notes: null, metadata: [{ key: "Responsible", value: "João Silva" }, { key: "Leather Grade", value: "Full Grain A" }] },
      { name: "Assembly", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(60), completedAt: d(45), expectedStartDate: d(59), expectedEndDate: d(44),
        notes: "Hand-stitched edges. Buckle attachment and hole punching.",
        metadata: [{ key: "Responsible", value: "Ana Costa" }, { key: "Hardware", value: "Brass buckle" }] },
      { name: "Quality Check", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(45), completedAt: d(38), expectedStartDate: d(43), expectedEndDate: d(36),
        notes: "All belts measured and flex-tested. 100% pass.",
        metadata: [{ key: "Inspector", value: "Miguel Rodrigues" }] },
      { name: "Packing", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(38), completedAt: d(32), expectedStartDate: d(35), expectedEndDate: d(30),
        notes: null, metadata: [{ key: "Packing Style", value: "Branded box" }] },
    ],
  },

  // ═══════════════════════════════════════════
  // 7) COMPLETED — Mumbai, recent (for trend chart)
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-007", productName: "Embroidered Kurta", productSKU: "EMB-KRT-NVY",
    quantity: 1500, unit: "pieces", status: "COMPLETED", priority: "NORMAL",
    overallProgress: 100, orderDate: d(60), expectedDate: d(20), actualDate: d(22),
    notes: "Navy base with gold thread embroidery. Traditional patterns.",
    tags: ["production", "embroidery"], factoryId: FACTORIES.mumbai,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(58), completedAt: d(50), expectedStartDate: d(58), expectedEndDate: d(50),
        notes: null, metadata: [{ key: "Responsible", value: "Priya Sharma" }] },
      { name: "Embroidery", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(50), completedAt: d(35), expectedStartDate: d(49), expectedEndDate: d(36),
        notes: "4 embroidery machines running in parallel. Pattern digitized in-house.",
        metadata: [{ key: "Responsible", value: "Amit Patel" }, { key: "Machines", value: "4" }, { key: "Thread", value: "Madeira gold" }] },
      { name: "Sewing", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(35), completedAt: d(27), expectedStartDate: d(35), expectedEndDate: d(27),
        notes: null, metadata: [{ key: "Responsible", value: "Ravi Kumar" }] },
      { name: "Quality Check", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(27), completedAt: d(22), expectedStartDate: d(26), expectedEndDate: d(20),
        notes: "Embroidery density check passed on all pieces.",
        metadata: [{ key: "Inspector", value: "Sunita Rao" }] },
    ],
  },

  // ═══════════════════════════════════════════
  // 8) COMPLETED — Prato, premium wool (recent)
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-008", productName: "Wool Blend Cardigan", productSKU: "WOL-CRD-CRM",
    quantity: 400, unit: "pieces", status: "COMPLETED", priority: "HIGH",
    overallProgress: 100, orderDate: d(75), expectedDate: d(18), actualDate: d(20),
    notes: "Cream wool-cashmere blend. Horn buttons. Made in Italy.",
    tags: ["production", "premium", "knitwear"], factoryId: FACTORIES.prato,
    stages: [
      { name: "Knitting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(72), completedAt: d(55), expectedStartDate: d(73), expectedEndDate: d(56),
        notes: "Gauge tension calibrated for cashmere blend.",
        metadata: [{ key: "Responsible", value: "Marco Bianchi" }, { key: "Yarn", value: "70/30 Wool-Cashmere" }] },
      { name: "Linking", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(55), completedAt: d(42), expectedStartDate: d(55), expectedEndDate: d(42),
        notes: null, metadata: [{ key: "Responsible", value: "Giulia Rossi" }] },
      { name: "Quality Check", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(42), completedAt: d(30), expectedStartDate: d(41), expectedEndDate: d(30),
        notes: "Pill test and dimensional stability check passed.",
        metadata: [{ key: "Inspector", value: "Luca Moretti" }, { key: "Pill Grade", value: "4/5" }] },
      { name: "Packaging", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(30), completedAt: d(20), expectedStartDate: d(29), expectedEndDate: d(18),
        notes: "Tissue-wrapped in branded boxes.",
        metadata: [{ key: "Packing Style", value: "Premium box" }] },
    ],
  },

  // ═══════════════════════════════════════════
  // 9) SHIPPED — Guangzhou, finished and shipped
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-009", productName: "Cotton Dress Summer", productSKU: "CTN-DRS-FLR",
    quantity: 800, unit: "pieces", status: "SHIPPED", priority: "NORMAL",
    overallProgress: 100, orderDate: d(65), expectedDate: d(25), actualDate: d(24),
    notes: "Floral print cotton poplin. Shipped via sea freight, ETA 3 weeks.",
    tags: ["production", "womenswear"], factoryId: FACTORIES.guangzhou,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(63), completedAt: d(56), expectedStartDate: d(63), expectedEndDate: d(56),
        notes: null, metadata: [{ key: "Responsible", value: "Li Wei" }] },
      { name: "Sewing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(56), completedAt: d(40), expectedStartDate: d(55), expectedEndDate: d(40),
        notes: null, metadata: [{ key: "Responsible", value: "Chen Mei" }] },
      { name: "Quality Check", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(40), completedAt: d(32), expectedStartDate: d(39), expectedEndDate: d(32),
        notes: "Passed. Seam strength good, print alignment verified.", metadata: [] },
      { name: "Packaging", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(32), completedAt: d(24), expectedStartDate: d(31), expectedEndDate: d(25),
        notes: null, metadata: [{ key: "Carton Count", value: "32" }] },
    ],
  },

  // ═══════════════════════════════════════════
  // 10) DELIVERED — Bangkok, fully received
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-010", productName: "Silk Blend Top", productSKU: "SLK-TOP-IVR",
    quantity: 600, unit: "pieces", status: "DELIVERED", priority: "HIGH",
    overallProgress: 100, orderDate: d(90), expectedDate: d(48), actualDate: d(50),
    notes: "Ivory silk-cotton blend. Received and checked into warehouse.",
    tags: ["production", "premium", "womenswear"], factoryId: FACTORIES.bangkok,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(88), completedAt: d(80), expectedStartDate: d(88), expectedEndDate: d(80),
        notes: null, metadata: [{ key: "Responsible", value: "Somchai Phan" }] },
      { name: "Sewing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(80), completedAt: d(64), expectedStartDate: d(79), expectedEndDate: d(63),
        notes: "French seams throughout. Extra care on silk handling.",
        metadata: [{ key: "Responsible", value: "Nattaya Sri" }, { key: "Seam Type", value: "French seam" }] },
      { name: "Quality Check", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(64), completedAt: d(56), expectedStartDate: d(62), expectedEndDate: d(55),
        notes: null, metadata: [{ key: "Inspector", value: "Pimchanok K." }] },
      { name: "Packing", sequence: 4, status: "COMPLETED", progress: 100,
        startedAt: d(56), completedAt: d(50), expectedStartDate: d(54), expectedEndDate: d(48),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 11) IN_PROGRESS — Guangzhou, on track
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-011", productName: "Summer Collection Polo", productSKU: "POL-SUM-NVY",
    quantity: 2500, unit: "pieces", status: "IN_PROGRESS", priority: "NORMAL",
    overallProgress: 65, orderDate: d(22), expectedDate: future(18), actualDate: null,
    notes: "Navy polo, pique cotton. Part of Summer 2026 collection.",
    tags: ["production", "menswear", "SS26"], factoryId: FACTORIES.guangzhou,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(20), completedAt: d(14), expectedStartDate: d(20), expectedEndDate: d(14),
        notes: null, metadata: [{ key: "Responsible", value: "Li Wei" }] },
      { name: "Sewing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(14), completedAt: d(5), expectedStartDate: d(13), expectedEndDate: d(5),
        notes: "Rib collar attachment method approved mid-production.",
        metadata: [{ key: "Responsible", value: "Chen Mei" }, { key: "Lines Used", value: "2" }] },
      { name: "Quality Check", sequence: 3, status: "IN_PROGRESS", progress: 60,
        startedAt: d(5), completedAt: null, expectedStartDate: d(4), expectedEndDate: future(4),
        notes: null,
        metadata: [{ key: "Inspector", value: "Zhang Tao" }, { key: "Method", value: "AQL 2.5" }] },
      { name: "Packaging", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(5), expectedEndDate: future(16),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 12) IN_PROGRESS — Shenzhen, early stage
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-012", productName: "Cargo Pants Utility", productSKU: "CRG-PNT-KHK",
    quantity: 1800, unit: "pieces", status: "IN_PROGRESS", priority: "HIGH",
    overallProgress: 35, orderDate: d(14), expectedDate: future(28), actualDate: null,
    notes: "Khaki utility cargo. 6-pocket design. YKK zippers throughout.",
    tags: ["production", "menswear"], factoryId: FACTORIES.shenzhen,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(12), completedAt: d(7), expectedStartDate: d(12), expectedEndDate: d(7),
        notes: null, metadata: [{ key: "Responsible", value: "Wang Jun" }] },
      { name: "Sewing", sequence: 2, status: "IN_PROGRESS", progress: 40,
        startedAt: d(7), completedAt: null, expectedStartDate: d(6), expectedEndDate: future(8),
        notes: "Pocket construction more complex than expected. On track overall.",
        metadata: [{ key: "Responsible", value: "Liu Fang" }, { key: "Lines Used", value: "3" }, { key: "Zipper", value: "YKK #5" }] },
      { name: "Quality Check", sequence: 3, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(9), expectedEndDate: future(18),
        notes: null, metadata: [] },
      { name: "Packing", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(19), expectedEndDate: future(27),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 13) IN_PROGRESS — Ho Chi Minh, almost done
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-013", productName: "Linen Shirt Classic", productSKU: "LSH-CLS-WHT",
    quantity: 1000, unit: "pieces", status: "IN_PROGRESS", priority: "NORMAL",
    overallProgress: 85, orderDate: d(35), expectedDate: future(5), actualDate: null,
    notes: "White 100% European linen. Pre-washed for softness.",
    tags: ["production", "linen", "menswear"], factoryId: FACTORIES.hochiminh,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(33), completedAt: d(28), expectedStartDate: d(33), expectedEndDate: d(28),
        notes: null, metadata: [{ key: "Responsible", value: "Nguyen Van" }] },
      { name: "Sewing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(28), completedAt: d(14), expectedStartDate: d(27), expectedEndDate: d(14),
        notes: null, metadata: [{ key: "Responsible", value: "Tran Minh" }] },
      { name: "Washing", sequence: 3, status: "COMPLETED", progress: 100,
        startedAt: d(14), completedAt: d(8), expectedStartDate: d(13), expectedEndDate: d(8),
        notes: "Enzyme wash for softness. Controlled shrinkage within 2%.",
        metadata: [{ key: "Wash Type", value: "Enzyme softener" }, { key: "Shrinkage", value: "1.8%" }] },
      { name: "Quality Check", sequence: 4, status: "IN_PROGRESS", progress: 70,
        startedAt: d(8), completedAt: null, expectedStartDate: d(7), expectedEndDate: future(1),
        notes: null, metadata: [{ key: "Inspector", value: "Tran Linh" }] },
      { name: "Packing", sequence: 5, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(2), expectedEndDate: future(5),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 14) IN_PROGRESS — Prato, just started
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-014", productName: "Cashmere Sweater V-Neck", productSKU: "CSH-SWT-BLU",
    quantity: 300, unit: "pieces", status: "IN_PROGRESS", priority: "URGENT",
    overallProgress: 15, orderDate: d(8), expectedDate: future(40), actualDate: null,
    notes: "100% Mongolian cashmere. Blue heather. Rush order for VIP client.",
    tags: ["production", "premium", "rush"], factoryId: FACTORIES.prato,
    stages: [
      { name: "Knitting", sequence: 1, status: "IN_PROGRESS", progress: 60,
        startedAt: d(6), completedAt: null, expectedStartDate: d(7), expectedEndDate: future(8),
        notes: "Cashmere yarn received from supplier. Gauge approved.",
        metadata: [{ key: "Responsible", value: "Marco Bianchi" }, { key: "Yarn Source", value: "Mongolia Grade A" }, { key: "Gauge", value: "7 GG" }] },
      { name: "Linking", sequence: 2, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(9), expectedEndDate: future(22),
        notes: null, metadata: [] },
      { name: "Quality Check", sequence: 3, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(23), expectedEndDate: future(32),
        notes: null, metadata: [] },
      { name: "Packaging", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(33), expectedEndDate: future(40),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 15) PENDING — Jakarta, just placed
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-015", productName: "Jogger Pants Fleece", productSKU: "JGR-FLC-BLK",
    quantity: 3000, unit: "pieces", status: "PENDING", priority: "NORMAL",
    overallProgress: 0, orderDate: d(2), expectedDate: future(42), actualDate: null,
    notes: "Black fleece joggers. Elastic waistband with drawstring. For Q4 drop.",
    tags: ["production", "basics", "Q4"], factoryId: FACTORIES.jakarta,
    stages: [
      { name: "Cutting", sequence: 1, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(5), expectedEndDate: future(12),
        notes: null, metadata: [] },
      { name: "Sewing", sequence: 2, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(13), expectedEndDate: future(26),
        notes: null, metadata: [] },
      { name: "Quality Check", sequence: 3, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(27), expectedEndDate: future(34),
        notes: null, metadata: [] },
      { name: "Packaging", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(35), expectedEndDate: future(42),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 16) PENDING — Mumbai, sample order
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-016", productName: "Block Print Scarf", productSKU: "BLK-PRT-SCF",
    quantity: 200, unit: "pieces", status: "PENDING", priority: "LOW",
    overallProgress: 0, orderDate: d(1), expectedDate: future(30), actualDate: null,
    notes: "Hand block print sample run. 4 designs. For buyer approval before bulk.",
    tags: ["sample", "handmade"], factoryId: FACTORIES.mumbai,
    stages: [
      { name: "Block Preparation", sequence: 1, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(3), expectedEndDate: future(10),
        notes: null, metadata: [{ key: "Designs", value: "4 patterns" }] },
      { name: "Printing", sequence: 2, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(11), expectedEndDate: future(20),
        notes: null, metadata: [] },
      { name: "Quality Check", sequence: 3, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(21), expectedEndDate: future(25),
        notes: null, metadata: [] },
      { name: "Packing", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(26), expectedEndDate: future(30),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 17) DELAYED — Dhaka, sewing problems
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-017", productName: "Cotton T-Shirt Premium", productSKU: "TSH-PRM-BLK",
    quantity: 4000, unit: "pieces", status: "DELAYED", priority: "HIGH",
    overallProgress: 55, orderDate: d(45), expectedDate: d(5), actualDate: null,
    notes: "Premium Supima cotton. Black. Was expected last week but sewing is behind.",
    tags: ["production", "basics", "urgent"], factoryId: FACTORIES.dhaka,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(43), completedAt: d(36), expectedStartDate: d(43), expectedEndDate: d(36),
        notes: null, metadata: [{ key: "Responsible", value: "Rahim Ahmed" }] },
      { name: "Sewing", sequence: 2, status: "DELAYED", progress: 70,
        startedAt: d(36), completedAt: null, expectedStartDate: d(35), expectedEndDate: d(18),
        notes: "Power outages this week caused 5-day setback. Running overtime to catch up. ETA revised to +8 days.",
        metadata: [{ key: "Responsible", value: "Fatima Begum" }, { key: "Delay Reason", value: "Power outages" }, { key: "Revised ETA", value: "+8 days" }] },
      { name: "Quality Check", sequence: 3, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(17), expectedEndDate: d(10),
        notes: null, metadata: [] },
      { name: "Packaging", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(9), expectedEndDate: d(5),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 18) DELAYED — Jakarta, QC issues
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-018", productName: "Printed Maxi Dress", productSKU: "PRT-MXI-FLR",
    quantity: 1200, unit: "pieces", status: "DELAYED", priority: "NORMAL",
    overallProgress: 68, orderDate: d(50), expectedDate: d(8), actualDate: null,
    notes: "Floral print on rayon. QC found color bleeding — requires re-washing.",
    tags: ["production", "womenswear"], factoryId: FACTORIES.jakarta,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(48), completedAt: d(40), expectedStartDate: d(48), expectedEndDate: d(40),
        notes: null, metadata: [{ key: "Responsible", value: "Budi Santoso" }] },
      { name: "Sewing", sequence: 2, status: "COMPLETED", progress: 100,
        startedAt: d(40), completedAt: d(25), expectedStartDate: d(39), expectedEndDate: d(25),
        notes: null, metadata: [{ key: "Responsible", value: "Dewi Putri" }] },
      { name: "Quality Check", sequence: 3, status: "DELAYED", progress: 70,
        startedAt: d(25), completedAt: null, expectedStartDate: d(24), expectedEndDate: d(15),
        notes: "Color bleeding detected in 15% of pieces during wash test. All affected pieces sent back for re-washing and re-inspection. Adding 10 days to schedule.",
        metadata: [{ key: "Inspector", value: "Agus Wibowo" }, { key: "Issue", value: "Color bleeding 15%" }, { key: "Action", value: "Re-wash + re-inspect" }] },
      { name: "Packing", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(14), expectedEndDate: d(8),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 19) DISRUPTED — Porto, material blocked
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-019", productName: "Leather Tote Bag", productSKU: "LTH-TOT-BRN",
    quantity: 350, unit: "pieces", status: "DISRUPTED", priority: "URGENT",
    overallProgress: 25, orderDate: d(30), expectedDate: future(10), actualDate: null,
    notes: "Brown vegetable-tanned leather tote. Production halted — leather shipment stuck in customs.",
    tags: ["production", "leather", "urgent"], factoryId: FACTORIES.porto,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(28), completedAt: d(22), expectedStartDate: d(28), expectedEndDate: d(22),
        notes: "First batch of hides cut. Remaining hides blocked in customs.",
        metadata: [{ key: "Responsible", value: "João Silva" }, { key: "Leather", value: "Veg-tan Italian" }] },
      { name: "Assembly", sequence: 2, status: "BLOCKED", progress: 30,
        startedAt: d(22), completedAt: null, expectedStartDate: d(21), expectedEndDate: d(5),
        notes: "BLOCKED: Remaining leather hides stuck in customs since Feb 20. Customs requires additional certification for the tanning chemicals used. Supplier working on documentation. Estimated clearance: 5-7 business days.",
        metadata: [{ key: "Responsible", value: "Ana Costa" }, { key: "Block Reason", value: "Customs hold" }, { key: "Customs Ref", value: "PT-2025-88432" }] },
      { name: "Quality Check", sequence: 3, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(4), expectedEndDate: future(3),
        notes: null, metadata: [] },
      { name: "Packing", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(4), expectedEndDate: future(10),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 20) DISRUPTED — Dhaka, worker strike
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-020", productName: "Fleece Zip Hoodie", productSKU: "FLC-ZIP-GRY",
    quantity: 2500, unit: "pieces", status: "DISRUPTED", priority: "HIGH",
    overallProgress: 40, orderDate: d(38), expectedDate: future(2), actualDate: null,
    notes: "Grey fleece with full zip. DISRUPTED due to factory-wide labor dispute.",
    tags: ["production", "urgent"], factoryId: FACTORIES.dhaka,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(36), completedAt: d(28), expectedStartDate: d(36), expectedEndDate: d(28),
        notes: null, metadata: [{ key: "Responsible", value: "Rahim Ahmed" }] },
      { name: "Sewing", sequence: 2, status: "BLOCKED", progress: 50,
        startedAt: d(28), completedAt: null, expectedStartDate: d(27), expectedEndDate: d(12),
        notes: "BLOCKED: Factory-wide work stoppage since Feb 25 due to wage dispute. Management in negotiations. Production paused indefinitely.",
        metadata: [{ key: "Responsible", value: "Fatima Begum" }, { key: "Block Reason", value: "Labor dispute" }, { key: "Stoppage Date", value: "Feb 25" }] },
      { name: "Quality Check", sequence: 3, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(11), expectedEndDate: d(4),
        notes: null, metadata: [] },
      { name: "Packaging", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(3), expectedEndDate: future(2),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 21) CANCELLED — Istanbul
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-021", productName: "Silk Evening Gown", productSKU: "SLK-EVN-RED",
    quantity: 150, unit: "pieces", status: "CANCELLED", priority: "HIGH",
    overallProgress: 10, orderDate: d(40), expectedDate: future(5), actualDate: null,
    notes: "CANCELLED: Client pulled the collection. Partial fabric already cut — to be credited.",
    tags: ["cancelled", "womenswear"], factoryId: FACTORIES.istanbul,
    stages: [
      { name: "Cutting", sequence: 1, status: "SKIPPED", progress: 30,
        startedAt: d(38), completedAt: null, expectedStartDate: d(38), expectedEndDate: d(30),
        notes: "Partially cut when cancellation received. 30% of fabric used.",
        metadata: [{ key: "Responsible", value: "Mehmet Yilmaz" }, { key: "Fabric Used", value: "30%" }] },
      { name: "Sewing", sequence: 2, status: "SKIPPED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(29), expectedEndDate: d(15),
        notes: "Cancelled before start.", metadata: [] },
      { name: "Quality Check", sequence: 3, status: "SKIPPED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(14), expectedEndDate: d(8),
        notes: null, metadata: [] },
      { name: "Packaging", sequence: 4, status: "SKIPPED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(7), expectedEndDate: future(5),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 22) IN_PROGRESS — Istanbul, due soon (at risk)
  // ═══════════════════════════════════════════
  {
    orderNumber: "PO-2025-022", productName: "Linen Blazer Unstructured", productSKU: "LIN-BLZ-BEG",
    quantity: 450, unit: "pieces", status: "IN_PROGRESS", priority: "HIGH",
    overallProgress: 55, orderDate: d(28), expectedDate: future(2), actualDate: null,
    notes: "Beige unstructured linen blazer. Due in 2 days but only 55% complete — AT RISK.",
    tags: ["production", "menswear", "at-risk"], factoryId: FACTORIES.istanbul,
    stages: [
      { name: "Cutting", sequence: 1, status: "COMPLETED", progress: 100,
        startedAt: d(26), completedAt: d(20), expectedStartDate: d(26), expectedEndDate: d(20),
        notes: null, metadata: [{ key: "Responsible", value: "Mehmet Yilmaz" }] },
      { name: "Sewing", sequence: 2, status: "IN_PROGRESS", progress: 65,
        startedAt: d(20), completedAt: null, expectedStartDate: d(19), expectedEndDate: d(5),
        notes: "Running behind due to pattern complexity. Weekend overtime approved.",
        metadata: [{ key: "Responsible", value: "Ayse Kaya" }, { key: "Overtime", value: "Approved" }] },
      { name: "Quality Check", sequence: 3, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: d(4), expectedEndDate: future(0),
        notes: null, metadata: [] },
      { name: "Packaging", sequence: 4, status: "NOT_STARTED", progress: 0,
        startedAt: null, completedAt: null, expectedStartDate: future(1), expectedEndDate: future(2),
        notes: null, metadata: [] },
    ],
  },

  // ═══════════════════════════════════════════
  // 23-28) Additional COMPLETED for trend variety
  // ═══════════════════════════════════════════
  ...makeCompletedSimple("PO-2025-023", "Cotton T-Shirt Basic", "TSH-BAS-BLK", 2000, FACTORIES.guangzhou, 30, 25, "LOW", ["production", "basics"]),
  ...makeCompletedSimple("PO-2025-024", "Denim Jacket Slim", "DNM-JKT-SLM", 800, FACTORIES.shenzhen, 50, 43, "NORMAL", ["production", "denim"]),
  ...makeCompletedSimple("PO-2025-025", "Cargo Shorts Utility", "CRG-SHT-OLV", 2200, FACTORIES.hochiminh, 40, 28, "NORMAL", ["production", "menswear"]),
  ...makeCompletedSimple("PO-2025-026", "Silk Camisole", "SLK-CMS-BLK", 500, FACTORIES.bangkok, 55, 30, "HIGH", ["production", "womenswear"]),
  ...makeCompletedSimple("PO-2025-027", "Linen Shorts Relaxed", "LSH-SHT-KHK", 1500, FACTORIES.istanbul, 42, 35, "NORMAL", ["production", "menswear"]),
  ...makeCompletedSimple("PO-2025-028", "Cotton Polo Classic", "POL-CLS-WHT", 3500, FACTORIES.dhaka, 65, 48, "LOW", ["production", "basics"]),
];

function makeCompletedSimple(
  orderNumber: string, productName: string, sku: string, qty: number,
  factoryId: string, daysAgoOrdered: number, actualDays: number,
  priority: Priority, tags: string[]
): OrderDef[] {
  const orderDate = d(daysAgoOrdered);
  const expectedDate = new Date(orderDate.getTime() + (actualDays + 2) * 86400000);
  const actualDate = new Date(orderDate.getTime() + actualDays * 86400000);
  const stageLen = Math.floor(actualDays / 4);

  const stageNames = ["Cutting", "Sewing", "Quality Check", "Packaging"];
  return [{
    orderNumber, productName, productSKU: sku, quantity: qty, unit: "pieces",
    status: "COMPLETED", priority, overallProgress: 100,
    orderDate, expectedDate, actualDate, factoryId,
    notes: null, tags,
    stages: stageNames.map((name, i) => {
      const start = new Date(orderDate.getTime() + i * stageLen * 86400000);
      const end = new Date(orderDate.getTime() + (i === 3 ? actualDays : (i + 1) * stageLen) * 86400000);
      const expectedEnd = new Date(end.getTime() + 2 * 86400000);
      return {
        name, sequence: i + 1, status: "COMPLETED" as StageStatus, progress: 100,
        startedAt: start, completedAt: end,
        expectedStartDate: start, expectedEndDate: expectedEnd,
        notes: null, metadata: [],
      };
    }),
  }];
}

// ─── Events, comments, admin notes, alerts ─────────────────────

type EventDef = { orderId: string; stageId: string | null; eventType: string; field: string | null; oldValue: string | null; newValue: string | null; stageName: string | null; createdAt: Date };
type CommentDef = { orderId: string; content: string; authorId: string; authorName: string; createdAt: Date };
type AdminNoteDef = { stageId: string; orderId: string; type: string; content: string; authorId: string; authorName: string; createdAt: Date };
type AlertDef = { title: string; message: string; severity: string; orderId: string; factoryId: string; read: boolean; resolved: boolean; createdAt: Date };

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // First delete old ANA orders from the wrong org (SockIT)
    const anaOrders = await client.query(
      `SELECT id FROM "Order" WHERE "organizationId" = 'cml269sho00000hxvv42km0r2' AND "orderNumber" LIKE 'ANA-%'`
    );
    if (anaOrders.rows.length > 0) {
      const anaIds = anaOrders.rows.map((r: any) => r.id);
      // Stages cascade, but let's be explicit
      await client.query(`DELETE FROM "OrderStage" WHERE "orderId" = ANY($1)`, [anaIds]);
      await client.query(`DELETE FROM "OrderEvent" WHERE "orderId" = ANY($1)`, [anaIds]);
      await client.query(`DELETE FROM "Order" WHERE id = ANY($1)`, [anaIds]);
      console.log(`Cleaned up ${anaIds.length} old ANA orders from SockIT org.`);
    }

    let created = 0;
    const allEvents: EventDef[] = [];
    const allComments: CommentDef[] = [];
    const allAdminNotes: AdminNoteDef[] = [];
    const allAlerts: AlertDef[] = [];

    for (const order of orders) {
      // Check if order already exists in this org
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
          "overallProgress", status, "orderDate", "expectedDate", "actualDate",
          notes, priority, tags, "organizationId", "factoryId", "createdAt", "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          orderId, order.orderNumber, order.productName, order.productSKU,
          order.quantity, order.unit, order.overallProgress, order.status,
          order.orderDate.toISOString(), order.expectedDate.toISOString(),
          order.actualDate?.toISOString() || null,
          order.notes, order.priority,
          `{${order.tags.map(t => `"${t}"`).join(",")}}`,
          ORG_ID, order.factoryId, now.toISOString(), now.toISOString(),
        ]
      );

      // Insert stages
      const stageIds: string[] = [];
      for (const stage of order.stages) {
        const stageId = cuid();
        stageIds.push(stageId);

        const metadataJson = stage.metadata.length > 0
          ? JSON.stringify(stage.metadata)
          : "[]";

        await client.query(
          `INSERT INTO "OrderStage" (
            id, "orderId", name, sequence, progress, status,
            "startedAt", "completedAt", "expectedStartDate", "expectedEndDate",
            notes, metadata, "createdAt", "updatedAt"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [
            stageId, orderId, stage.name, stage.sequence, stage.progress, stage.status,
            stage.startedAt?.toISOString() || null, stage.completedAt?.toISOString() || null,
            stage.expectedStartDate?.toISOString() || null, stage.expectedEndDate?.toISOString() || null,
            stage.notes, metadataJson,
            now.toISOString(), now.toISOString(),
          ]
        );
      }

      // ── Generate ORDER_CREATED event ──
      allEvents.push({
        orderId, stageId: null, eventType: "ORDER_CREATED",
        field: null, oldValue: null, newValue: null, stageName: null,
        createdAt: order.orderDate,
      });

      // ── Generate STATUS_CHANGE events for stages that have started/completed ──
      for (let i = 0; i < order.stages.length; i++) {
        const stage = order.stages[i];
        if (stage.startedAt) {
          allEvents.push({
            orderId, stageId: stageIds[i], eventType: "STATUS_CHANGE",
            field: "status", oldValue: "NOT_STARTED", newValue: "IN_PROGRESS",
            stageName: stage.name, createdAt: stage.startedAt,
          });
        }
        if (stage.completedAt) {
          allEvents.push({
            orderId, stageId: stageIds[i], eventType: "STATUS_CHANGE",
            field: "status", oldValue: "IN_PROGRESS", newValue: "COMPLETED",
            stageName: stage.name, createdAt: stage.completedAt,
          });
        }
        if (stage.status === "DELAYED" && stage.startedAt) {
          allEvents.push({
            orderId, stageId: stageIds[i], eventType: "STATUS_CHANGE",
            field: "status", oldValue: "IN_PROGRESS", newValue: "DELAYED",
            stageName: stage.name,
            createdAt: new Date(stage.startedAt.getTime() + 10 * 86400000),
          });
        }
        if (stage.status === "BLOCKED" && stage.startedAt) {
          allEvents.push({
            orderId, stageId: stageIds[i], eventType: "STATUS_CHANGE",
            field: "status", oldValue: "IN_PROGRESS", newValue: "BLOCKED",
            stageName: stage.name,
            createdAt: new Date(stage.startedAt.getTime() + 5 * 86400000),
          });
        }
      }

      // ── Generate progress events for in-progress stages ──
      for (let i = 0; i < order.stages.length; i++) {
        const stage = order.stages[i];
        if (stage.status === "IN_PROGRESS" && stage.progress > 0 && stage.startedAt) {
          // Mid-point progress update
          const midProgress = Math.floor(stage.progress / 2);
          const midDate = new Date(stage.startedAt.getTime() + 3 * 86400000);
          allEvents.push({
            orderId, stageId: stageIds[i], eventType: "PROGRESS_CHANGE",
            field: "progress", oldValue: "0", newValue: String(midProgress),
            stageName: stage.name, createdAt: midDate,
          });
        }
      }

      // ── Generate comments for interesting orders ──
      const users = [USERS.palo, USERS.tong, USERS.filip];

      if (order.status === "DELAYED") {
        allComments.push({
          orderId, content: `This order is running behind schedule. ${order.notes || "We need to follow up with the factory."}`,
          authorId: USERS.filip.id, authorName: USERS.filip.name,
          createdAt: d(3),
        });
        allComments.push({
          orderId, content: "I've contacted the factory manager. They're adding extra shifts to catch up. Will update once we have a revised timeline.",
          authorId: USERS.palo.id, authorName: USERS.palo.name,
          createdAt: d(2),
        });
      }

      if (order.status === "DISRUPTED") {
        allComments.push({
          orderId, content: "This is critical — production is completely halted. We need to escalate immediately.",
          authorId: USERS.filip.id, authorName: USERS.filip.name,
          createdAt: d(5),
        });
        allComments.push({
          orderId, content: "Should we look into transferring this order to another factory? We can't afford to miss the delivery window.",
          authorId: USERS.tong.id, authorName: USERS.tong.name,
          createdAt: d(4),
        });
        allComments.push({
          orderId, content: "Let's give them 3 more days. If no progress by then, we'll activate the backup factory plan.",
          authorId: USERS.palo.id, authorName: USERS.palo.name,
          createdAt: d(3),
        });
      }

      if (order.status === "IN_PROGRESS" && order.overallProgress > 60) {
        allComments.push({
          orderId, content: "Good progress so far. QC team is standing by. Let me know when we're ready for inspection.",
          authorId: USERS.palo.id, authorName: USERS.palo.name,
          createdAt: d(2),
        });
      }

      if (order.status === "SHIPPED") {
        allComments.push({
          orderId, content: "Shipped! Tracking number has been shared. Expected arrival at warehouse in 3 weeks.",
          authorId: USERS.filip.id, authorName: USERS.filip.name,
          createdAt: d(1),
        });
      }

      if (order.priority === "URGENT") {
        allComments.push({
          orderId, content: "This is marked URGENT. Please prioritize and keep daily updates on progress.",
          authorId: USERS.palo.id, authorName: USERS.palo.name,
          createdAt: new Date(order.orderDate.getTime() + 86400000),
        });
      }

      // ── Generate admin notes for stages with issues ──
      for (let i = 0; i < order.stages.length; i++) {
        const stage = order.stages[i];
        if (stage.notes && (stage.status === "DELAYED" || stage.status === "BLOCKED")) {
          allAdminNotes.push({
            stageId: stageIds[i], orderId, type: "STATUS_DETAIL",
            content: stage.notes,
            authorId: USERS.filip.id, authorName: USERS.filip.name,
            createdAt: d(4),
          });
        }
        if (stage.notes && stage.name === "Quality Check" && stage.status === "COMPLETED") {
          allAdminNotes.push({
            stageId: stageIds[i], orderId, type: "NOTE",
            content: `QC Summary: ${stage.notes}`,
            authorId: USERS.filip.id, authorName: USERS.filip.name,
            createdAt: stage.completedAt || d(1),
          });
        }
      }

      // Order-level admin note for urgent/disrupted
      if (order.priority === "URGENT" || order.status === "DISRUPTED") {
        allAdminNotes.push({
          stageId: "order-info", orderId, type: "NOTE",
          content: `Priority escalation: ${order.notes || "Requires immediate attention."}`,
          authorId: USERS.palo.id, authorName: USERS.palo.name,
          createdAt: new Date(order.orderDate.getTime() + 2 * 86400000),
        });
      }

      // ── Generate alerts ──
      const now2 = new Date();
      if (order.status === "DELAYED" && order.expectedDate < now2) {
        const daysOverdue = Math.floor((now2.getTime() - order.expectedDate.getTime()) / 86400000);
        allAlerts.push({
          title: "Order overdue",
          message: `${order.orderNumber} (${order.productName}) is ${daysOverdue} days past expected delivery.`,
          severity: daysOverdue > 7 ? "CRITICAL" : "ERROR",
          orderId, factoryId: order.factoryId,
          read: false, resolved: false,
          createdAt: order.expectedDate,
        });
      }

      if (order.status === "IN_PROGRESS" && order.expectedDate < new Date(now2.getTime() + 3 * 86400000) && order.overallProgress < 80) {
        allAlerts.push({
          title: "Order at risk",
          message: `${order.orderNumber} is due in less than 3 days but only ${order.overallProgress}% complete.`,
          severity: "WARNING",
          orderId, factoryId: order.factoryId,
          read: false, resolved: false,
          createdAt: d(1),
        });
      }

      for (let i = 0; i < order.stages.length; i++) {
        const stage = order.stages[i];
        if (stage.status === "BLOCKED") {
          allAlerts.push({
            title: "Stage blocked",
            message: `${stage.name} stage is blocked on ${order.orderNumber} (${order.productName}). ${stage.notes || ""}`.trim(),
            severity: "CRITICAL",
            orderId, factoryId: order.factoryId,
            read: false, resolved: false,
            createdAt: d(3),
          });
        }
        if (stage.status === "DELAYED") {
          allAlerts.push({
            title: "Stage delayed",
            message: `${stage.name} stage is behind schedule on ${order.orderNumber}. ${stage.notes || ""}`.trim(),
            severity: "WARNING",
            orderId, factoryId: order.factoryId,
            read: false, resolved: false,
            createdAt: d(5),
          });
        }
      }

      created++;
      console.log(`  Created ${order.orderNumber} — ${order.productName} [${order.status}]`);
    }

    // ── Insert events ──
    for (const ev of allEvents) {
      await client.query(
        `INSERT INTO "OrderEvent" (id, "orderId", "stageId", "eventType", field, "oldValue", "newValue", "stageName", "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [cuid(), ev.orderId, ev.stageId, ev.eventType, ev.field, ev.oldValue, ev.newValue, ev.stageName, ev.createdAt.toISOString()]
      );
    }
    console.log(`  Inserted ${allEvents.length} events`);

    // ── Insert comments ──
    for (const cm of allComments) {
      const now = new Date();
      await client.query(
        `INSERT INTO "OrderComment" (id, "orderId", content, "authorId", "authorName", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [cuid(), cm.orderId, cm.content, cm.authorId, cm.authorName, cm.createdAt.toISOString(), now.toISOString()]
      );
    }
    console.log(`  Inserted ${allComments.length} comments`);

    // ── Insert admin notes ──
    for (const an of allAdminNotes) {
      const now = new Date();
      await client.query(
        `INSERT INTO "StageAdminNote" (id, "stageId", "orderId", type, content, "authorId", "authorName", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [cuid(), an.stageId, an.orderId, an.type, an.content, an.authorId, an.authorName, an.createdAt.toISOString(), now.toISOString()]
      );
    }
    console.log(`  Inserted ${allAdminNotes.length} admin notes`);

    // ── Insert alerts ──
    for (const al of allAlerts) {
      await client.query(
        `INSERT INTO "Alert" (id, "organizationId", title, message, severity, "orderId", "factoryId", read, resolved, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [cuid(), ORG_ID, al.title, al.message, al.severity, al.orderId, al.factoryId, al.read, al.resolved, al.createdAt.toISOString()]
      );
    }
    console.log(`  Inserted ${allAlerts.length} alerts`);

    await client.query("COMMIT");
    console.log(`\nDone! Created ${created} orders with full production data.`);
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
