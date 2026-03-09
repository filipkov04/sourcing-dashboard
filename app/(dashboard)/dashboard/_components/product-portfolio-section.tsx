"use client";

import { useEffect, useState, useRef } from "react";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { ProductPortfolioChart } from "./product-portfolio-chart";
import { ProductPortfolioBarChart } from "./product-portfolio-bar-chart";
import { ChartToggle, type ChartView } from "@/components/chart-toggle";
import { ChartExportButton } from "@/components/chart-export-button";
import { AnimatedChartContainer } from "@/components/animated-chart-container";
import type { ProductPortfolioData } from "@/lib/types";

const views: ChartView[] = [
  { id: "donut", icon: PieChartIcon, label: "Donut chart" },
  { id: "bar", icon: BarChart3, label: "Bar chart" },
];

export function ProductPortfolioSection() {
  const [portfolioData, setPortfolioData] = useState<ProductPortfolioData>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState("donut");
  const chartRef = useRef<HTMLDivElement>(null);

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
    <div className="bg-white rounded-xl border border-gray-100 p-5 dark:bg-[#0d0f13] dark:border-zinc-800/60 card-hover-glow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Product Portfolio</h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">Quantity by product</p>
        </div>
        {portfolioData.length > 0 && (
          <div className="flex items-center gap-1">
            <ChartExportButton targetRef={chartRef} filename="product-portfolio" />
            <ChartToggle
              views={views}
              activeView={activeView}
              onViewChange={setActiveView}
              storageKey="product-portfolio"
            />
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="h-[140px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF4D15]" />
        </div>
      ) : portfolioData.length > 0 ? (
        <>
          <div ref={chartRef}>
            <AnimatedChartContainer viewKey={activeView}>
              {activeView === "donut" ? (
                <ProductPortfolioChart data={portfolioData} />
              ) : (
                <ProductPortfolioBarChart data={portfolioData} />
              )}
            </AnimatedChartContainer>
          </div>
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
