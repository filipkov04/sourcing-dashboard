"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioWaveformPlayerProps {
  src: string;
  fileName?: string;
  /** Whether this is inside the sender's own bubble (orange) */
  isOwn?: boolean;
}

const BAR_COUNT = 48;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function extractPeaks(src: string, count: number): Promise<number[]> {
  const res = await fetch(src);
  const buffer = await res.arrayBuffer();
  const ctx = new OfflineAudioContext(1, 1, 44100);
  const audioBuffer = await ctx.decodeAudioData(buffer);
  const rawData = audioBuffer.getChannelData(0);

  const blockSize = Math.floor(rawData.length / count);
  const peaks: number[] = [];

  for (let i = 0; i < count; i++) {
    let sum = 0;
    const start = i * blockSize;
    for (let j = start; j < start + blockSize && j < rawData.length; j++) {
      sum += Math.abs(rawData[j]);
    }
    peaks.push(sum / blockSize);
  }

  const max = Math.max(...peaks, 0.01);
  return peaks.map((p) => p / max);
}

export function AudioWaveformPlayer({
  src,
  fileName,
  isOwn = false,
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

  useEffect(() => {
    let cancelled = false;
    extractPeaks(src, BAR_COUNT)
      .then((p) => {
        if (!cancelled) setPeaks(p);
      })
      .catch(() => {
        if (!cancelled)
          setPeaks(
            Array.from({ length: BAR_COUNT }, () => 0.2 + Math.random() * 0.8)
          );
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

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
        // AbortError or NotAllowedError
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

  // Display remaining time when playing, total duration when stopped
  const displayTime =
    playing || currentTime > 0
      ? formatTime(totalDuration - currentTime)
      : formatTime(totalDuration);

  return (
    <div className="flex items-center gap-2.5">
      {/* Play / Pause button */}
      <button
        onClick={togglePlay}
        disabled={!loaded}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
          isOwn
            ? "text-white/90 hover:text-white"
            : loaded
              ? "text-gray-700 dark:text-zinc-200 hover:text-gray-900 dark:hover:text-white"
              : "text-gray-400 dark:text-zinc-500"
        )}
      >
        {playing ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform bars */}
      <div
        ref={waveformRef}
        className="flex flex-1 cursor-pointer items-center gap-[1.5px] h-8"
        onClick={handleSeek}
      >
        {peaks.map((peak, i) => {
          const barProgress = i / BAR_COUNT;
          const isPlayed = barProgress < progress;
          // Height: min 3px, max 28px
          const height = Math.max(3, peak * 28);

          return (
            <div
              key={i}
              className={cn(
                "w-[2px] rounded-full transition-colors duration-100",
                isOwn
                  ? isPlayed
                    ? "bg-white"
                    : "bg-white/40"
                  : isPlayed
                    ? "bg-gray-700 dark:bg-zinc-200"
                    : "bg-gray-300 dark:bg-zinc-600"
              )}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span
        className={cn(
          "shrink-0 text-[11px] font-medium tabular-nums",
          isOwn ? "text-white/70" : "text-gray-400 dark:text-zinc-500"
        )}
      >
        {displayTime}
      </span>
    </div>
  );
}
