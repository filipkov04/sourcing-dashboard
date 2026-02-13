"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { NewsItem } from "@/lib/news/types";

const ROTATE_INTERVAL = 6000;
const HOVER_ZONE_HEIGHT = 12;

const CATEGORY_LABELS: Record<string, string> = {
  tariff: "Tariff",
  "supply-chain": "Supply Chain",
  commodities: "Commodities",
  trade: "Trade",
  logistics: "Logistics",
};

interface NewsTickerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export function NewsTicker({ onVisibilityChange }: NewsTickerProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch news
  useEffect(() => {
    fetch("/api/news/feed")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.items.length > 0) {
          setItems(json.data.items);
        }
      })
      .catch(() => {});
  }, []);

  // Mouse-near-top detection
  useEffect(() => {
    if (items.length === 0) return;

    function handleMouseMove(e: MouseEvent) {
      if (e.clientY <= HOVER_ZONE_HEIGHT) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        setVisible(true);
        onVisibilityChange?.(true);
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [items.length]);

  function handleBarMouseLeave() {
    setPaused(false);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      onVisibilityChange?.(false);
    }, 400);
  }

  function handleBarMouseEnter() {
    setPaused(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }

  const goTo = useCallback(
    (next: number) => {
      if (items.length === 0) return;
      setFading(true);
      setTimeout(() => {
        setIndex(((next % items.length) + items.length) % items.length);
        setFading(false);
      }, 200);
    },
    [items.length]
  );

  // Auto-rotate
  useEffect(() => {
    if (paused || items.length <= 1) return;
    timerRef.current = setInterval(() => {
      goTo(index + 1);
    }, ROTATE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, index, items.length, goTo]);

  if (items.length === 0) return null;

  const current = items[index];

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 flex h-9 items-center justify-center gap-3 border-b border-[#d4501f] bg-[#EB5D2E] px-4 text-white transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
      onMouseEnter={handleBarMouseEnter}
      onMouseLeave={handleBarMouseLeave}
    >
      {/* Left: nav arrows */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(index - 1)}
          className="rounded p-0.5 text-white/60 hover:text-white"
          aria-label="Previous headline"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => goTo(index + 1)}
          className="rounded p-0.5 text-white/60 hover:text-white"
          aria-label="Next headline"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Center: badge + headline */}
      <div className="flex min-w-0 items-center gap-2 overflow-hidden">
        <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-white">
          {CATEGORY_LABELS[current.category] || current.category}
        </span>
        <span
          className={`truncate text-xs transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}
        >
          {current.url ? (
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              {current.title}
              <ExternalLink className="inline h-3 w-3 shrink-0 text-white/60" />
            </a>
          ) : (
            current.title
          )}
        </span>
      </div>

      {/* Right: source + counter */}
      <div className="flex shrink-0 items-center gap-2 text-[10px] text-white/70">
        <span className="hidden sm:inline">{current.source}</span>
        <span>
          {index + 1}/{items.length}
        </span>
      </div>
    </div>
  );
}
