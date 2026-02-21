import { NextRequest, NextResponse } from "next/server";

// Dev-only mock factory API — simulates a real factory ERP system.
// The REST adapter can be pointed at this to test sync end-to-end.
//
// Example integration config to use with this mock:
// {
//   baseUrl: "http://localhost:3000",
//   ordersEndpoint: "/api/mock-factory/orders",
//   authType: "api_key",
//   apiKeyHeader: "X-Factory-Key",
//   fieldMap: {
//     orderNumber: "po_number",
//     status: "production_status",
//     progress: "completion_pct",
//     stages: "production_stages",
//     stageNameField: "stage_name",
//     stageProgressField: "pct_complete",
//     stageStatusField: "stage_status",
//   }
// }
//
// Example integration credentials (to encrypt via saveCredentials):
// { apiKey: "mock-factory-key-123" }

const MOCK_API_KEY = "mock-factory-key-123";

// Simulated production orders — use real PO numbers from your DB to test matching
const MOCK_ORDERS = [
  {
    po_number: "PO-2024-001",
    product: "Classic White Tee",
    production_status: "in_progress",
    completion_pct: 65,
    factory_ref: "FAC-001",
    production_stages: [
      { stage_name: "Fabric Cutting",   pct_complete: 100, stage_status: "completed" },
      { stage_name: "Sewing",           pct_complete: 80,  stage_status: "in_progress" },
      { stage_name: "Quality Check",    pct_complete: 0,   stage_status: "not_started" },
      { stage_name: "Packing",          pct_complete: 0,   stage_status: "not_started" },
    ],
  },
  {
    po_number: "PO-2024-002",
    product: "Slim Fit Jeans",
    production_status: "delayed",
    completion_pct: 30,
    factory_ref: "FAC-001",
    production_stages: [
      { stage_name: "Fabric Cutting",   pct_complete: 100, stage_status: "completed" },
      { stage_name: "Sewing",           pct_complete: 20,  stage_status: "delayed" },
      { stage_name: "Washing",          pct_complete: 0,   stage_status: "not_started" },
      { stage_name: "Quality Check",    pct_complete: 0,   stage_status: "not_started" },
    ],
  },
  {
    po_number: "PO-2024-003",
    product: "Wool Sweater",
    production_status: "completed",
    completion_pct: 100,
    factory_ref: "FAC-001",
    production_stages: [
      { stage_name: "Yarn Preparation", pct_complete: 100, stage_status: "completed" },
      { stage_name: "Knitting",         pct_complete: 100, stage_status: "completed" },
      { stage_name: "Finishing",        pct_complete: 100, stage_status: "completed" },
      { stage_name: "Quality Check",    pct_complete: 100, stage_status: "completed" },
    ],
  },
  {
    po_number: "PO-2024-004",
    product: "Summer Dress",
    production_status: "blocked",
    completion_pct: 15,
    factory_ref: "FAC-001",
    production_stages: [
      { stage_name: "Fabric Cutting",   pct_complete: 100, stage_status: "completed" },
      { stage_name: "Sewing",           pct_complete: 0,   stage_status: "blocked" },
      { stage_name: "Embroidery",       pct_complete: 0,   stage_status: "not_started" },
      { stage_name: "Quality Check",    pct_complete: 0,   stage_status: "not_started" },
    ],
  },
  {
    po_number: "PO-2024-005",
    product: "Linen Trousers",
    production_status: "pending",
    completion_pct: 0,
    factory_ref: "FAC-001",
    production_stages: [
      { stage_name: "Fabric Cutting",   pct_complete: 0,   stage_status: "not_started" },
      { stage_name: "Sewing",           pct_complete: 0,   stage_status: "not_started" },
      { stage_name: "Quality Check",    pct_complete: 0,   stage_status: "not_started" },
    ],
  },
];

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  // Validate API key
  const apiKey =
    request.headers.get("X-Factory-Key") ??
    request.headers.get("Authorization")?.replace("Bearer ", "");

  if (apiKey !== MOCK_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Simulate slight network delay
  await new Promise((r) => setTimeout(r, 200));

  // Support ?po_number= filter
  const poFilter = request.nextUrl.searchParams.get("po_number");
  const orders = poFilter
    ? MOCK_ORDERS.filter((o) => o.po_number === poFilter)
    : MOCK_ORDERS;

  return NextResponse.json(orders);
}
