"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceMessagePlayerProps {
  url: string;
  duration?: number;
  isOwn?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceMessagePlayer({ url, isOwn }: VoiceMessagePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<unknown>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Lazy init: only create wavesurfer when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || initialized) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInitialized(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [initialized]);

  // Create wavesurfer instance when initialized
  useEffect(() => {
    if (!initialized || !containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ws: any = null;

    async function init() {
      try {
        const WaveSurfer = (await import("wavesurfer.js")).default;
        if (!containerRef.current) return;

        ws = WaveSurfer.create({
          container: containerRef.current,
          barWidth: 2,
          barGap: 2,
          barRadius: 2,
          waveColor: isOwn ? "rgba(255,255,255,0.5)" : "#71717a",
          progressColor: isOwn ? "#ffffff" : "#F97316",
          cursorWidth: 0,
          height: 32,
          normalize: true,
          interact: true,
        });

        ws.on("ready", (dur: number) => {
          setReady(true);
          setTotalDuration(dur);
        });

        ws.on("timeupdate", (time: number) => {
          setCurrentTime(time);
        });

        ws.on("finish", () => {
          setPlaying(false);
        });

        ws.load(url);
        wavesurferRef.current = ws;
      } catch (err) {
        console.error("WaveSurfer init error:", err);
      }
    }

    init();

    return () => {
      if (ws) {
        ws.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [initialized, url, isOwn]);

  const togglePlay = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ws = wavesurferRef.current as any;
    if (!ws || !ready) return;
    ws.playPause();
    setPlaying((p) => !p);
  }, [ready]);

  const cycleSpeed = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ws = wavesurferRef.current as any;
    if (!ws) return;
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    ws.setPlaybackRate(next);
  }, [speed]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 min-w-[200px]",
        isOwn ? "bg-white/10" : "bg-gray-100 dark:bg-zinc-700/50"
      )}
    >
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        disabled={!ready}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
          isOwn
            ? "bg-white/20 text-white hover:bg-white/30"
            : "bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20"
        )}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>

      {/* Waveform container */}
      <div ref={containerRef} className="flex-1 min-w-[100px]">
        {!initialized && (
          <div className="flex items-center gap-[3px] h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-[2px] rounded-full",
                  isOwn ? "bg-white/30" : "bg-gray-300 dark:bg-zinc-600"
                )}
                style={{ height: `${8 + Math.sin(i * 0.5) * 12}px` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Duration + Speed */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={cn(
            "text-[10px] tabular-nums",
            isOwn ? "text-white/70" : "text-gray-500 dark:text-zinc-400"
          )}
        >
          {ready ? formatDuration(playing ? currentTime : totalDuration) : "0:00"}
        </span>
        <button
          onClick={cycleSpeed}
          className={cn(
            "rounded px-1 py-0.5 text-[9px] font-bold transition-colors",
            isOwn
              ? "bg-white/15 text-white/80 hover:bg-white/25"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-500"
          )}
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}
