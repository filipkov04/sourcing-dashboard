"use client";

import { useTheme } from "@/components/theme-provider";
import dynamic from "next/dynamic";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const EmojiPicker = dynamic(
  () => import("@emoji-mart/react").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="h-[350px] w-[352px] animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-lg" /> }
);

// Lazy-loaded emoji data
let emojiData: unknown = null;
async function getEmojiData() {
  if (!emojiData) {
    const mod = await import("@emoji-mart/data");
    emojiData = mod.default;
  }
  return emojiData;
}

interface EmojiPickerPopoverProps {
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export function EmojiPickerPopover({
  onSelect,
  children,
  side = "top",
  align = "end",
}: EmojiPickerPopoverProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children ?? (
          <button
            type="button"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
              "dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            )}
          >
            <Smile className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
        sideOffset={8}
      >
        <EmojiPickerInner
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

function EmojiPickerInner({
  theme,
  onSelect,
}: {
  theme: "light" | "dark";
  onSelect: (emoji: string) => void;
}) {
  return (
    <EmojiPicker
      data={getEmojiData}
      theme={theme}
      previewPosition="none"
      skinTonePosition="search"
      onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)}
      set="native"
      maxFrequentRows={2}
    />
  );
}
