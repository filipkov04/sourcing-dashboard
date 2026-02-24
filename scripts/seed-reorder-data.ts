import "dotenv/config";
import { prisma } from "../lib/db";

async function seed() {
  // Seed into SockIT org (danieldalen user)
  const orgId = "cml269sho00000hxvv42km0r2";
  const factory = await prisma.factory.findFirst({ where: { organizationId: orgId } });
  if (!factory) { console.log("No factory found in SockIT org"); return; }
  console.log("Org:", orgId, "| Factory:", factory.id, factory.name);

  const orders = [
    // Summer T-Shirt — ordered in Feb (seasonal match)
    { orderNumber: "SEED-101", productName: "Summer T-Shirt Collection", productSKU: "TSH-SUM-24", quantity: 500, unit: "pieces", status: "COMPLETED" as const, orderDate: new Date("2025-02-10"), expectedDate: new Date("2025-03-15"), actualDate: new Date("2025-03-12"), overallProgress: 100 },
    { orderNumber: "SEED-102", productName: "Summer T-Shirt Collection", productSKU: "TSH-SUM-24", quantity: 750, unit: "pieces", status: "COMPLETED" as const, orderDate: new Date("2024-02-05"), expectedDate: new Date("2024-03-10"), actualDate: new Date("2024-03-08"), overallProgress: 100 },

    // Organic Cotton Hoodie — ordered in Feb & Aug (seasonal)
    { orderNumber: "SEED-103", productName: "Organic Cotton Hoodie", productSKU: "HOD-ORG-24", quantity: 300, unit: "pieces", status: "DELIVERED" as const, orderDate: new Date("2025-08-15"), expectedDate: new Date("2025-09-20"), actualDate: new Date("2025-09-18"), overallProgress: 100 },
    { orderNumber: "SEED-104", productName: "Organic Cotton Hoodie", productSKU: "HOD-ORG-24", quantity: 400, unit: "pieces", status: "COMPLETED" as const, orderDate: new Date("2025-02-20"), expectedDate: new Date("2025-03-25"), actualDate: new Date("2025-03-22"), overallProgress: 100 },

    // Denim Fabric Roll — last ordered 90+ days ago (overdue recurring)
    { orderNumber: "SEED-105", productName: "Denim Fabric Roll", productSKU: "DEN-FAB-01", quantity: 200, unit: "meters", status: "COMPLETED" as const, orderDate: new Date("2025-11-01"), expectedDate: new Date("2025-12-01"), actualDate: new Date("2025-11-28"), overallProgress: 100 },
    { orderNumber: "SEED-106", productName: "Denim Fabric Roll", productSKU: "DEN-FAB-01", quantity: 250, unit: "meters", status: "COMPLETED" as const, orderDate: new Date("2025-07-15"), expectedDate: new Date("2025-08-15"), actualDate: new Date("2025-08-10"), overallProgress: 100 },
    { orderNumber: "SEED-107", productName: "Denim Fabric Roll", productSKU: "DEN-FAB-01", quantity: 180, unit: "meters", status: "DELIVERED" as const, orderDate: new Date("2025-03-10"), expectedDate: new Date("2025-04-10"), actualDate: new Date("2025-04-08"), overallProgress: 100 },

    // Silk Scarf Collection — last ordered 80+ days ago (overdue)
    { orderNumber: "SEED-108", productName: "Silk Scarf Collection", productSKU: "SLK-SCF-24", quantity: 1000, unit: "pieces", status: "COMPLETED" as const, orderDate: new Date("2025-11-15"), expectedDate: new Date("2025-12-20"), actualDate: new Date("2025-12-18"), overallProgress: 100 },
    { orderNumber: "SEED-109", productName: "Silk Scarf Collection", productSKU: "SLK-SCF-24", quantity: 800, unit: "pieces", status: "DELIVERED" as const, orderDate: new Date("2025-08-01"), expectedDate: new Date("2025-09-01"), actualDate: new Date("2025-08-28"), overallProgress: 100 },

    // Wool Blend Yarn — ordered in Jan & Feb (seasonal match)
    { orderNumber: "SEED-110", productName: "Wool Blend Yarn", productSKU: "WOL-YRN-01", quantity: 500, unit: "kg", status: "COMPLETED" as const, orderDate: new Date("2025-01-20"), expectedDate: new Date("2025-02-20"), actualDate: new Date("2025-02-18"), overallProgress: 100 },
    { orderNumber: "SEED-111", productName: "Wool Blend Yarn", productSKU: "WOL-YRN-01", quantity: 600, unit: "kg", status: "COMPLETED" as const, orderDate: new Date("2024-02-10"), expectedDate: new Date("2024-03-10"), actualDate: new Date("2024-03-05"), overallProgress: 100 },
  ];

  for (const order of orders) {
    await prisma.order.create({
      data: {
        ...order,
        organizationId: orgId,
        factoryId: factory.id,
      },
    });
    console.log("Created:", order.orderNumber, "-", order.productName);
  }

  console.log("\nDone! Created", orders.length, "seed orders.");
  await prisma.$disconnect();
}

seed();
