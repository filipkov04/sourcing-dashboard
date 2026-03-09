"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Info } from "lucide-react";
import Link from "next/link";

type Suggestion = {
  lastOrderId: string;
  productName: string;
  productSKU: string | null;
  productImage: string | null;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

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
      <div className="bg-white rounded-xl border border-gray-100 p-5 dark:bg-[#0d0f13] dark:border-zinc-800/60 card-hover-glow">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Reorder Suggestions</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 dark:bg-zinc-700 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 dark:bg-[#0d0f13] dark:border-zinc-800/60 card-hover-glow">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Reorder Suggestions</h2>
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

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 dark:bg-[#0d0f13] dark:border-zinc-800/60 card-hover-glow">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Reorder Suggestions</h2>
        <Info className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-600" />
      </div>

      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {suggestions.map((s) => (
          <Link
            key={s.productName}
            href={`/orders/new?reorderId=${s.lastOrderId}`}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 -mx-2 px-2 rounded-md transition-colors"
          >
            {/* Initials Circle */}
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                {getInitials(s.productName)}
              </span>
            </div>

            {/* Product Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {s.productName}
              </p>
              {s.productSKU && (
                <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                  SKU: {s.productSKU}
                </p>
              )}
            </div>

            {/* Quantity & Status */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {s.avgQuantity.toLocaleString()}
              </p>
              <p className={`text-xs font-medium ${
                s.isSeasonal
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-green-500 dark:text-green-400"
              }`}>
                {s.isSeasonal ? "Seasonal" : "Overdue"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
