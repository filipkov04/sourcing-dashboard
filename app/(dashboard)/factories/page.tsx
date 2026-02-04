import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { FactoriesTable } from "./factories-table";
import { FactoriesTableSkeleton } from "./factories-table-skeleton";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function FactoriesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Factories</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            Manage your manufacturing partners and suppliers
          </p>
        </div>
        <Link
          href="/factories/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Factory</span>
        </Link>
      </div>

      {/* Factories Table */}
      <Suspense fallback={<FactoriesTableSkeleton />}>
        <FactoriesTableContent organizationId={session.user.organizationId} />
      </Suspense>
    </div>
  );
}

async function FactoriesTableContent({
  organizationId,
}: {
  organizationId: string;
}) {
  // Fetch factories with order count
  const factories = await prisma.factory.findMany({
    where: {
      organizationId,
    },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <FactoriesTable factories={factories} />;
}
