"use client";

import { useEffect, useState } from "react";
import { Package, TrendingUp } from "lucide-react";

type BestSeller = {
  productName: string;
  productSKU: string | null;
  productImage: string | null;
  totalQuantity: number;
  unit: string;
  orderCount: number;
  lastOrderDate: string;
  factoryName: string;
};

function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="flex-shrink-0 w-8 h-8 rounded-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function BestSellers() {
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBestSellers() {
      try {
        const response = await fetch("/api/dashboard/best-sellers");
        const data = await response.json();
        if (data.success) {
          setBestSellers(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch best sellers:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBestSellers();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Best Sellers</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Based on order volume</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-6 h-4 bg-gray-200 dark:bg-zinc-700 rounded" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bestSellers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Best Sellers</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Based on order volume</p>
        </div>
        <div className="text-center py-8">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-500 mb-3" />
          <p className="text-sm text-gray-600 dark:text-zinc-400">No order data yet</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
            Create orders to see your best sellers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 card-hover-glow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Best Sellers</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Based on order volume</p>
        </div>
      </div>

      <div className="space-y-1">
        {bestSellers.map((product, index) => (
          <div
            key={product.productName}
            className="flex items-center gap-3 -mx-2 px-2 py-2.5 rounded-lg hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {/* Rank */}
            <span className="w-5 text-center text-sm font-semibold text-gray-400 dark:text-zinc-500">
              {index + 1}
            </span>

            {/* Product Image */}
            <ProductImage src={product.productImage} alt={product.productName} />

            {/* Product Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {product.productName}
                {product.productSKU && (
                  <span className="ml-1.5 text-xs text-gray-500 dark:text-zinc-500 font-normal">
                    {product.productSKU}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                {product.orderCount} order{product.orderCount !== 1 ? "s" : ""} · {product.factoryName}
              </p>
            </div>

            {/* Quantity Badge */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {product.totalQuantity.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500">{product.unit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
