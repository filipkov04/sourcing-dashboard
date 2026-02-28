"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioWaveformPlayerProps {
  src: string;
  fileName?: string;
}

const BAR_COUNT = 40;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function extractPeaks(src: string): Promise<number[]> {
  const res = await fetch(src);
  const buffer = await res.arrayBuffer();
  const ctx = new OfflineAudioContext(1, 1, 44100);
  const audioBuffer = await ctx.decodeAudioData(buffer);
  const rawData = audioBuffer.getChannelData(0);

  const blockSize = Math.floor(rawData.length / BAR_COUNT);
  const peaks: number[] = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    let sum = 0;
    const start = i * blockSize;
    for (let j = start; j < start + blockSize && j < rawData.length; j++) {
      sum += Math.abs(rawData[j]);
    }
    peaks.push(sum / blockSize);
  }

  // Normalize to 0-1
  const max = Math.max(...peaks, 0.01);
  return peaks.map((p) => p / max);
}

export function AudioWaveformPlayer({
  src,
  fileName,
}: AudioWaveformPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>(() =>
    Array(BAR_COUNT).fill(0.3)
  );
  const [loaded, setLoaded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const waveformRef = useRef<HTMLDivElement>(null);

  // Extract waveform peaks (memoized by src)
  useEffect(() => {
    let cancelled = false;
    extractPeaks(src)
      .then((p) => {
        if (!cancelled) setPeaks(p);
      })
      .catch(() => {
        // Fallback: random-looking bars
        if (!cancelled)
          setPeaks(
            Array.from({ length: BAR_COUNT }, () => 0.2 + Math.random() * 0.8)
          );
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Create audio element
  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onMetadata = () => {
      setTotalDuration(audio.duration);
      setLoaded(true);
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      cancelAnimationFrame(rafRef.current);
    };
  }, [src]);

  // Animation frame for current time updates
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    function tick() {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !loaded) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        // AbortError or NotAllowedError — don't update state
      }
    }
  }, [playing, loaded]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !waveformRef.current || !loaded) return;
      const rect = waveformRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      audioRef.current.currentTime = ratio * totalDuration;
      setCurrentTime(audioRef.current.currentTime);
    },
    [totalDuration, loaded]
  );

  const progress = totalDuration > 0 ? currentTime / totalDuration : 0;

  return (
    <div className="mt-1 flex items-center gap-3 rounded-xl bg-gray-100 dark:bg-zinc-700/50 px-3 py-2.5">
      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        disabled={!loaded}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
          loaded
            ? "bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] text-white hover:bg-[#d44a1a]"
            : "bg-gray-300 dark:bg-zinc-600 text-gray-500 dark:text-zinc-400"
        )}
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5 ml-0.5" />
        )}
      </button>

      {/* Waveform bars */}
      <div
        ref={waveformRef}
        className="flex flex-1 cursor-pointer items-end gap-[2px] h-8"
        onClick={handleSeek}
      >
        {peaks.map((peak, i) => {
          const barProgress = i / BAR_COUNT;
          const isPlayed = barProgress < progress;
          const height = Math.max(4, peak * 32);

          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-full transition-colors duration-150",
                isPlayed
                  ? "bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316]"
                  : "bg-gray-300 dark:bg-zinc-500"
              )}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className="shrink-0 text-[11px] tabular-nums text-gray-500 dark:text-zinc-400">
        {formatTime(currentTime)}
        {totalDuration > 0 && ` / ${formatTime(totalDuration)}`}
      </span>
    </div>
  );
}
