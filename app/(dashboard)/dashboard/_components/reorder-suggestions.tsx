"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

type Suggestion = {
  productName: string;
  productSKU: string | null;
  lastQuantity: number;
  unit: string;
  avgQuantity: number;
  lastOrderDate: string;
  factoryId: string;
  factoryName: string;
  orderCount: number;
  seasonLabel: string;
  isSeasonal: boolean;
};

export function ReorderSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const response = await fetch("/api/dashboard/reorder-suggestions");
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch reorder suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSuggestions();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reorder Suggestions</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Based on your ordering history</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-full mb-1" />
              <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reorder Suggestions</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Based on your ordering history</p>
        </div>
        <div className="text-center py-8">
          <RefreshCw className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-500 mb-3" />
          <p className="text-sm text-gray-600 dark:text-zinc-400">No reorder suggestions yet</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
            Complete more orders to get suggestions
          </p>
        </div>
      </div>
    );
  }

  function formatDate(iso: string) {
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reorder Suggestions</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Based on your ordering history</p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((s) => {
          const params = new URLSearchParams({
            product: s.productName,
            quantity: String(s.avgQuantity),
            factoryId: s.factoryId,
            ...(s.productSKU ? { sku: s.productSKU } : {}),
            unit: s.unit,
          });

          return (
            <div
              key={s.productName}
              className="flex items-start justify-between gap-3 -mx-2 px-2 py-2.5 rounded-lg hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-orange-100 dark:bg-orange-900/30">
                  <Package className="h-4 w-4 text-[#EB5D2E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {s.productName}
                    {s.productSKU && (
                      <span className="ml-1.5 text-xs text-gray-500 dark:text-zinc-500 font-normal">
                        {s.productSKU}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                    Last ordered {formatDate(s.lastOrderDate)} · {s.lastQuantity} {s.unit} · {s.factoryName}
                  </p>
                  <p className="text-xs text-[#EB5D2E] dark:text-[#EB5D2E] mt-0.5 font-medium">
                    {s.seasonLabel}
                  </p>
                </div>
              </div>

              <Link
                href={`/orders/new?${params.toString()}`}
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#EB5D2E] text-white hover:bg-[#d4522a] transition-colors"
              >
                Reorder
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
