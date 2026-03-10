"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Map, RefreshCw, Globe, Factory, MapPin, ShieldCheck, Activity } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { AnimatedNumber } from "@/components/animated-number";
import { MapControls } from "./map-controls";
import { MapLegend } from "./map-legend";
import { MapFactoryDrawer } from "./map-factory-drawer";
import { MapSearch } from "./map-search";
import type { MapFactory, MapStats } from "./types";
import type { MapCanvasHandle } from "./map-canvas";

const MapCanvas = dynamic(
  () => import("./map-canvas").then((m) => m.MapCanvas),
  { ssr: false }
);

export function ManufacturerMap() {
  const { resolvedTheme } = useTheme();
  const mapTheme = resolvedTheme === "dark" ? "dark" : "light";
  const mapRef = useRef<MapCanvasHandle | null>(null);

  const [factories, setFactories] = useState<MapFactory[]>([]);
  const [stats, setStats] = useState<MapStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFactory, setSelectedFactory] = useState<MapFactory | null>(null);
  const [routesEnabled, setRoutesEnabled] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/factory-locations");
      const data = await res.json();
      if (data.success) {
        setFactories(data.data.factories);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch factory locations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredFactories = useMemo(() => {
    let result = factories;
    if (verifiedOnly) {
      result = result.filter((f) => f.verificationStatus === "VERIFIED");
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.city.toLowerCase().includes(q) ||
          f.country.toLowerCase().includes(q)
      );
    }
    return result;
  }, [factories, verifiedOnly, searchQuery]);

  // Auto-fit when search changes
  useEffect(() => {
    if (searchQuery && filteredFactories.length > 0) {
      setTimeout(() => mapRef.current?.fitToMarkers(), 100);
    }
  }, [searchQuery, filteredFactories]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Map className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
            Manufacturer Network
          </h3>
        </div>
        <div className="flex items-center justify-center h-[380px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF4D15]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Summary Rail */}
        <div className="lg:w-56 flex-shrink-0 p-5 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-5">
            <Map className="h-4 w-4 text-[#FF4D15]" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Manufacturer Network
            </h3>
          </div>

          <div className="space-y-4">
            <StatItem
              icon={<Factory className="h-3.5 w-3.5" />}
              label="Manufacturers"
              value={stats?.totalManufacturers ?? 0}
            />
            <StatItem
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Countries"
              value={stats?.countriesCovered ?? 0}
            />
            <StatItem
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Active Productions"
              value={stats?.activeProductions ?? 0}
            />
            <StatItem
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Verified"
              value={stats?.verifiedPercent ?? 0}
              suffix="%"
            />
          </div>

          {stats?.lastUpdated && (
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-5">
              Updated {new Date(stats.lastUpdated).toLocaleTimeString()}
            </p>
          )}

          <button
            onClick={() => {
              setIsLoading(true);
              fetchData();
            }}
            className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative min-h-[420px]">
          <MapCanvas
            ref={mapRef}
            factories={filteredFactories}
            theme={mapTheme}
            clusteringEnabled={clusteringEnabled}
            routesEnabled={routesEnabled}
            onSelectFactory={(f) => {
              setSelectedFactory(f);
              if (f) {
                mapRef.current?.easeTo(f.lng, f.lat);
              }
            }}
            selectedFactoryId={selectedFactory?.id ?? null}
          />

          <MapSearch value={searchQuery} onChange={setSearchQuery} />

          <MapControls
            mapRef={mapRef}
            clusteringEnabled={clusteringEnabled}
            onToggleClustering={() => setClusteringEnabled((v) => !v)}
            verifiedOnly={verifiedOnly}
            onToggleVerifiedOnly={() => setVerifiedOnly((v) => !v)}
            routesEnabled={routesEnabled}
            onToggleRoutes={() => setRoutesEnabled((v) => !v)}
          />

          <MapLegend />

          <MapFactoryDrawer
            factory={selectedFactory}
            onClose={() => setSelectedFactory(null)}
          />
        </div>
      </div>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500 mb-1">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        <AnimatedNumber value={value} />
        {suffix && <span className="text-sm text-gray-400 dark:text-zinc-500 ml-0.5">{suffix}</span>}
      </p>
    </div>
  );
}
