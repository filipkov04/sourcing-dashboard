"use client";

import { useState } from "react";
import {
  MessageSquare,
  Smile,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { EmojiPicker } from "./emoji-picker";

interface MessageActionsProps {
  isOwn: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MessageActions({
  isOwn,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: MessageActionsProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="absolute -top-4 right-2 z-10 flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
      {/* Quick reactions */}
      {["👍", "❤️", "😂"].map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700"
        >
          {emoji}
        </button>
      ))}

      {/* Emoji picker */}
      <div className="relative">
        <button
          onClick={() => { setShowEmoji(!showEmoji); setShowMore(false); }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          title="Add reaction"
        >
          <Smile className="h-3.5 w-3.5" />
        </button>
        {showEmoji && (
          <div className="absolute right-0 top-full mt-1">
            <EmojiPicker onSelect={onReact} onClose={() => setShowEmoji(false)} />
          </div>
        )}
      </div>

      {/* Reply */}
      <button
        onClick={onReply}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
        title="Reply in thread"
      >
        <MessageSquare className="h-3.5 w-3.5" />
      </button>

      {/* More (edit/delete) — only for own messages */}
      {isOwn && (
        <div className="relative">
          <button
            onClick={() => { setShowMore(!showMore); setShowEmoji(false); }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {showMore && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
              {onEdit && (
                <button
                  onClick={() => { onEdit(); setShowMore(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit message
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(); setShowMore(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete message
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
