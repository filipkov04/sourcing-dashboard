"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Package,
  Edit,
  Loader2,
  Trash2,
  Weight,
  Ruler,
  DollarSign,
  BarChart3,
  Tag,
  Warehouse,
} from "lucide-react";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
import { tagColor, runwayStatusColor, formatCurrency } from "@/lib/inventory-utils";

interface StockLevel {
  id: string;
  onHand: number;
  reserved: number;
  available: number;
  inTransit: number;
  backorder: number;
  runwayStatus: string | null;
  totalValue: number | null;
  location: { id: string; name: string; type: string };
}

interface ProductDetail {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  volumeCBM: number | null;
  isBulkCargo: boolean;
  cogs: number | null;
  currency: string;
  hsCode: string | null;
  originCountry: string | null;
  minStock: number | null;
  maxStock: number | null;
  safetyStock: number | null;
  tags: string[];
  leadTimeProdDays: number | null;
  leadTimeShipDays: number | null;
  moq: number | null;
  stockLevels: StockLevel[];
  _count: { transactions: number };
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { setDetail } = useBreadcrumb();
  const isAdminOrOwner = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load product");
          return;
        }

        if (data.success) {
          setProduct(data.data);
          setDetail(data.data.name);
        }
      } catch {
        setError("Failed to load product");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, setDetail]);

  const handleDeleteClick = () => {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!product) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || "Failed to delete product");
        setIsDeleting(false);
        return;
      }

      router.push("/products");
    } catch {
      setDeleteError("Failed to delete product");
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteError(null);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const hasStock = product?.stockLevels.some((sl) => sl.onHand > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-zinc-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <Package className="h-12 w-12 text-gray-500 dark:text-zinc-500" />
            <p className="text-gray-600 dark:text-zinc-400">{error || "Product not found"}</p>
            <Link href="/products">
              <Button variant="outline" className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300">
                View All Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Back</span>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {product.name}
              </h1>
              <span className="flex-shrink-0 inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs font-mono text-gray-700 dark:text-zinc-300">
                {product.sku}
              </span>
              {product.category && (
                <Badge variant="secondary" className="flex-shrink-0 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  {product.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {isAdminOrOwner && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDeleteClick}
              className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-400 justify-center"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Link href={`/products/${product.id}/edit`} className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 text-white">
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Product Details Card */}
      <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500 mb-4">
        Details
      </p>
      <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] card-hover-glow hud-corners">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-zinc-800/60">
          {/* Product Info */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">PRD</span>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Product</h3>
            </div>
            <div className="space-y-2">
              {product.description && (
                <p className="text-sm text-gray-700 dark:text-zinc-300">{product.description}</p>
              )}
              {product.originCountry && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-zinc-500">Origin:</span>
                  <span className="text-gray-900 dark:text-white">{product.originCountry}</span>
                </div>
              )}
              {product.hsCode && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-zinc-500">HS Code:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{product.hsCode}</span>
                </div>
              )}
              {!product.description && !product.originCountry && !product.hsCode && (
                <p className="text-sm text-gray-400 dark:text-zinc-500">No additional details</p>
              )}
            </div>
          </div>

          {/* Physical Properties */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">PHY</span>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Physical</h3>
            </div>
            <div className="space-y-2">
              {product.weight !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Weight className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white">{product.weight} kg</span>
                </div>
              )}
              {(product.length !== null || product.width !== null || product.height !== null) && (
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white">
                    {product.length ?? "—"} x {product.width ?? "—"} x {product.height ?? "—"} cm
                  </span>
                </div>
              )}
              {product.volumeCBM !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-zinc-500">Volume:</span>
                  <span className="text-gray-900 dark:text-white">{product.volumeCBM.toFixed(4)} CBM</span>
                  {product.isBulkCargo && (
                    <span className="inline-flex items-center rounded-full bg-orange-500/10 dark:bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                      Bulk Cargo
                    </span>
                  )}
                </div>
              )}
              {product.weight === null && product.length === null && product.volumeCBM === null && (
                <p className="text-sm text-gray-400 dark:text-zinc-500">No physical data recorded</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Procurement & Inventory Stats */}
      <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500 mb-4">
        Procurement
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* COGS */}
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">COGS</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF4D15]/10">
              <DollarSign className="h-4 w-4 text-[#FF4D15]" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(product.cogs, product.currency)}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">per unit</p>
        </div>

        {/* MOQ */}
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">MOQ</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Package className="h-4 w-4 text-blue-500" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {product.moq ?? "—"}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">minimum order</p>
        </div>

        {/* Lead Time Prod */}
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Production</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {product.leadTimeProdDays !== null ? `${product.leadTimeProdDays}d` : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">lead time</p>
        </div>

        {/* Lead Time Ship */}
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Shipping</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Warehouse className="h-4 w-4 text-emerald-500" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {product.leadTimeShipDays !== null ? `${product.leadTimeShipDays}d` : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">lead time</p>
        </div>
      </div>

      {/* Inventory Thresholds */}
      {(product.minStock !== null || product.maxStock !== null || product.safetyStock !== null) && (
        <>
          <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500 mb-4">
            Inventory Thresholds
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Min Stock</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {product.minStock ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Max Stock</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {product.maxStock ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Safety Stock</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {product.safetyStock ?? "—"}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Tags */}
      {product.tags.length > 0 && (
        <>
          <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500 mb-4">
            Tags
          </p>
          <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Product Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => {
                const color = tagColor(tag);
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${color.bg} ${color.text}`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Stock Levels */}
      <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500 mb-4">
        Stock Levels
      </p>
      <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">STK</span>
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Stock Levels</CardTitle>
                <CardDescription className="text-gray-600 dark:text-zinc-400">
                  Inventory across all locations
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">
              {product.stockLevels.length} {product.stockLevels.length === 1 ? "Location" : "Locations"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {product.stockLevels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Warehouse className="h-12 w-12 text-gray-400 dark:text-zinc-600" />
              <p className="text-gray-500 dark:text-zinc-500">No stock records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">On Hand</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">Reserved</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">Available</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">In Transit</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {product.stockLevels.map((sl) => {
                    const statusColor = runwayStatusColor(sl.runwayStatus);
                    return (
                      <tr
                        key={sl.id}
                        className="border-b border-gray-200 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                          {sl.location.name}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-zinc-300 text-sm">
                          {sl.location.type.replace(/_/g, " ")}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-mono">
                          {sl.onHand}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 dark:text-zinc-300 font-mono">
                          {sl.reserved}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-mono">
                          {sl.available}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 dark:text-zinc-300 font-mono">
                          {sl.inTransit}
                        </td>
                        <td className="py-3 px-4">
                          {sl.runwayStatus ? (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusColor.dot}`} />
                              {sl.runwayStatus.replace(/_/g, " ")}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">TXN</span>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Transactions</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          {product._count.transactions} transaction{product._count.transactions === 1 ? "" : "s"} recorded
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">Full transaction log coming soon</p>
      </div>

      {/* Metadata */}
      <div className="text-sm text-gray-500 dark:text-zinc-500">
        Created {formatDateTime(product.createdAt)} &bull; Last updated{" "}
        {formatDateTime(product.updatedAt)}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Delete Product</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{product.name}</span>?
              This action cannot be undone.
              {hasStock && (
                <span className="block mt-2 text-red-400">
                  This product has stock on hand. Please zero out stock before deleting.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-lg bg-red-900/20 border border-red-800 p-3">
              <p className="text-sm text-red-400">{deleteError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting || !!hasStock}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
