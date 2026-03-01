"use client";

interface DateSeparatorProps {
  date: Date;
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700/50" />
      <span className="shrink-0 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
        {formatDateLabel(date)}
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-700/50" />
    </div>
  );
}
