"use client";

import { ArrowLeft, Factory as FactoryIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourcyAvatar } from "./sourcy-avatar";
import {
  SUPPORT_CATEGORIES,
  FACTORY_CATEGORIES,
  type CategoryDef,
} from "@/lib/chat-constants";

interface CategoryPickerProps {
  chatType: "SUPPORT" | "FACTORY";
  onSelect: (category: string) => void;
  onBack: () => void;
}

export function CategoryPicker({ chatType, onSelect, onBack }: CategoryPickerProps) {
  const categories: CategoryDef[] =
    chatType === "SUPPORT" ? SUPPORT_CATEGORIES : FACTORY_CATEGORIES;

  const isSupport = chatType === "SUPPORT";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#EB5D2E] px-3 py-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {isSupport ? (
          <SourcyAvatar size="md" className="!bg-white/20 shadow-none" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
            <FactoryIcon className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {isSupport ? "Sourcy Agent" : "Factory Chat"}
          </p>
          <p className="text-[10px] text-white/70">Pick a topic to get started</p>
        </div>
      </div>

      {/* Greeting + Categories */}
      <div className="flex-1 overflow-y-auto">
        {/* Greeting card */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-start gap-3">
            {isSupport && <SourcyAvatar size="lg" pulse />}
            <div className={cn(!isSupport && "pt-1")}>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {isSupport ? "Hi there! How can I help?" : "Start a factory conversation"}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                {isSupport
                  ? "Select a topic below and I'll assist you right away."
                  : "Choose a topic, then select which factory you'd like to contact."}
              </p>
            </div>
          </div>
        </div>

        {/* Category cards */}
        <div className="space-y-1.5 px-4 pb-4">
          {categories.map((cat, i) => (
            <button
              key={cat.key}
              onClick={() => onSelect(cat.key)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-150",
                "border-gray-150 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                "hover:border-[#EB5D2E]/40 hover:bg-[#EB5D2E]/[0.03] hover:shadow-sm",
                "active:scale-[0.98]"
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-zinc-800 text-lg group-hover:bg-[#EB5D2E]/10 transition-colors">
                {cat.emoji}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200">
                {cat.label}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-600 group-hover:text-[#EB5D2E] group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
