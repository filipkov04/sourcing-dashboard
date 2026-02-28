"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Factory, Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type FactoryOption = { id: string; name: string; location: string };

interface FactorySelectorProps {
  onSelect: (factoryId: string, factoryName: string) => void;
  onBack: () => void;
}

export function FactorySelector({ onSelect, onBack }: FactorySelectorProps) {
  const [factories, setFactories] = useState<FactoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/factories");
        if (res.ok) {
          const json = await res.json();
          setFactories(json.data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = factories.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase())
  );

  // Generate a consistent color for each factory
  function getFactoryColor(name: string): string {
    const colors = [
      "bg-blue-500", "bg-emerald-500", "bg-violet-500",
      "bg-amber-500", "bg-rose-500", "bg-cyan-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] px-3 py-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Factory className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Select Factory</p>
          <p className="text-[10px] text-white/70">Choose which factory to contact</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search factories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF8C1A] focus:outline-none focus:ring-1 focus:ring-[#FF8C1A]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Factory list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-zinc-700" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/3 rounded bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-zinc-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 mb-3">
              <Factory className="h-5 w-5 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">
              {search ? "No factories found" : "No factories yet"}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
              {search ? "Try a different search" : "Add factories to start chatting"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 p-3">
            {filtered.map((factory, i) => (
              <button
                key={factory.id}
                onClick={() => onSelect(factory.id, factory.name)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150",
                  "border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                  "hover:border-[#FF8C1A]/40 hover:shadow-sm",
                  "active:scale-[0.98]"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm",
                  getFactoryColor(factory.name)
                )}>
                  {factory.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#F97316] transition-colors">
                    {factory.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5 text-gray-400 dark:text-zinc-500" />
                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {factory.location}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
