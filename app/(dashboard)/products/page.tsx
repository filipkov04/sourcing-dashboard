import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductsTable } from "./products-table";
import { ProductsTableSkeleton } from "./products-table-skeleton";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ProductsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { organizationId, projectId, role } = session.user;
  const isAdminOrOwner = role === "ADMIN" || role === "OWNER";

  const productCount = await prisma.product.count({
    where: {
      organizationId,
      ...(projectId ? { projectId } : {}),
    },
  });

  return (
    <div className="relative space-y-6">
      {/* HUD Grid Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Products</h1>
            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-zinc-400">
              {productCount} {productCount === 1 ? "product" : "products"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Manage your product catalog and inventory
          </p>
        </div>
        {isAdminOrOwner && (
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        )}
      </div>

      {/* Products Table */}
      <Suspense fallback={<ProductsTableSkeleton />}>
        <ProductsTableContent
          organizationId={organizationId}
          projectId={projectId}
          userRole={role}
        />
      </Suspense>
    </div>
  );
}

async function ProductsTableContent({
  organizationId,
  projectId,
  userRole,
}: {
  organizationId: string;
  projectId: string | null;
  userRole: string;
}) {
  const products = await prisma.product.findMany({
    where: {
      organizationId,
      ...(projectId ? { projectId } : {}),
    },
    include: {
      _count: { select: { stockLevels: true, transactions: true } },
      stockLevels: {
        select: {
          onHand: true,
          reserved: true,
          available: true,
          inTransit: true,
          backorder: true,
          runwayStatus: true,
          totalValue: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return <ProductsTable products={products} userRole={userRole} />;
}
