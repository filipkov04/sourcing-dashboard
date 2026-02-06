"use client";

import { useEffect, useState } from "react";
import { ProductPortfolioChart } from "./product-portfolio-chart";
import type { ProductPortfolioData } from "@/lib/types";

export function ProductPortfolioSection() {
  const [portfolioData, setPortfolioData] = useState<ProductPortfolioData>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const response = await fetch("/api/dashboard/product-portfolio");
        const data = await response.json();
        if (data.success) {
          setPortfolioData(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch product portfolio:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPortfolio();
  }, []);

  const totalProducts = portfolioData.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Product Portfolio</h3>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">Quantity by product</p>
      </div>
      {isLoading ? (
        <div className="h-[140px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EB5D2E]" />
        </div>
      ) : portfolioData.length > 0 ? (
        <>
          <ProductPortfolioChart data={portfolioData} />
          <p className="mt-3 text-[11px] text-gray-400 dark:text-zinc-500 text-center">
            Total Products: {totalProducts}
          </p>
        </>
      ) : (
        <div className="h-[140px] flex items-center justify-center text-xs text-gray-500 dark:text-zinc-400">
          No product data available
        </div>
      )}
    </div>
  );
}
