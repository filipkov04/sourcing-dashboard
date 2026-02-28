"use client";

import { MessageSquare } from "lucide-react";

export function MessagesEmptyState() {
  return (
    <div className="flex h-full items-center justify-center bg-white dark:bg-zinc-900">
      <div className="flex flex-col items-center text-center px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF8C1A]/10">
          <MessageSquare className="h-8 w-8 text-[#F97316]" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
          Select a conversation
        </h3>
        <p className="mt-2 max-w-[260px] text-sm text-gray-500 dark:text-zinc-400">
          Choose a conversation from the list to start messaging, or create a new one.
        </p>
      </div>
    </div>
  );
}
