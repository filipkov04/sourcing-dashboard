"use client";

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-[11px] text-gray-400 dark:text-zinc-500">
        {label}
      </span>
    </div>
  );
}
