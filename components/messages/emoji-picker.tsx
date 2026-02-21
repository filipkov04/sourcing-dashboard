"use client";

import { useRef, useEffect } from "react";

const EMOJI_GROUPS = [
  {
    label: "Frequent",
    emojis: ["👍", "❤️", "😂", "🎉", "🔥", "👀", "✅", "🙏"],
  },
  {
    label: "Smileys",
    emojis: ["😀", "😊", "😄", "🤔", "😅", "😍", "🥳", "😎", "🤩", "😢", "😤", "🤯"],
  },
  {
    label: "Gestures",
    emojis: ["👏", "🤝", "💪", "🙌", "✌️", "🤞", "👋", "🫡"],
  },
  {
    label: "Objects",
    emojis: ["🚀", "💡", "⚡", "🎯", "📌", "🔗", "📦", "🏭"],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
    >
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label} className="mb-2 last:mb-0">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-0.5">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onSelect(emoji); onClose(); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
