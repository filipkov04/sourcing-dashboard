"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

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

const NUM_BARS = 40;

/**
 * Generate a deterministic waveform pattern from a URL string.
 * This gives each voice message a unique-looking waveform.
 */
function generateWaveformBars(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  const bars: number[] = [];
  for (let i = 0; i < NUM_BARS; i++) {
    // Simple pseudo-random from hash + index
    hash = ((hash << 5) - hash + i * 7 + 13) | 0;
    const raw = Math.abs(hash % 100) / 100;
    // Shape: peak in the middle, taper at edges
    const position = i / NUM_BARS;
    const envelope = Math.sin(position * Math.PI) * 0.6 + 0.4;
    bars.push(0.15 + raw * 0.85 * envelope);
  }
  return bars;
}

export function VoiceMessagePlayer({ url }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const bars = useRef(generateWaveformBars(url)).current;

  // Create audio element
  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      if (isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
        setReady(true);
      }
    });

    audio.addEventListener("durationchange", () => {
      if (isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
        setReady(true);
      }
    });

    audio.addEventListener("canplaythrough", () => {
      setReady(true);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && isFinite(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
      }
    });

    audio.addEventListener("ended", () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [url]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !ready) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [ready, playing]);

  // Click on waveform to seek
  const handleBarClick = useCallback(
    (index: number) => {
      const audio = audioRef.current;
      if (!audio || !ready || !totalDuration) return;
      const seekTo = (index / NUM_BARS) * totalDuration;
      audio.currentTime = seekTo;
      setCurrentTime(seekTo);
      setProgress(seekTo / totalDuration);
    },
    [ready, totalDuration]
  );

  const playedBars = Math.floor(progress * NUM_BARS);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-100 dark:bg-[#1c1c1e] px-4 py-3 min-w-[240px] max-w-[320px]">
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        disabled={!ready}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-900 dark:text-white transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {playing ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform bars */}
      <div className="flex flex-1 items-end gap-[2px] h-9 cursor-pointer">
        {bars.map((amplitude, i) => {
          const isPlayed = i < playedBars;
          const height = Math.max(3, amplitude * 32);

          return (
            <div
              key={i}
              onClick={() => handleBarClick(i)}
              className="w-[3px] shrink-0 rounded-full transition-colors duration-100"
              style={{
                height: `${height}px`,
                backgroundColor: isPlayed
                  ? isDark
                    ? "#ffffff"
                    : "#18181b"
                  : isDark
                    ? "rgba(255,255,255,0.3)"
                    : "rgba(0,0,0,0.2)",
              }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className="shrink-0 text-[13px] font-medium tabular-nums text-zinc-500 dark:text-white/70">
        {ready
          ? formatDuration(playing ? currentTime : totalDuration)
          : "0:00"}
      </span>
    </div>
  );
}
