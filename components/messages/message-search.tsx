"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, Loader2, MessageSquare } from "lucide-react";
import { searchConversationMessages, searchAllMessages, type Message } from "@/lib/use-conversations";

function formatSearchTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="rounded bg-[#FF8C1A]/20 px-0.5 text-[#F97316]">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

interface MessageSearchProps {
  conversationId?: string;
  onClose: () => void;
  onJumpTo?: (conversationId: string, messageId: string) => void;
}

export function MessageSearch({ conversationId, onClose, onJumpTo }: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(Message & { conversation?: { id: string; subject: string | null; type: string } })[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        if (conversationId) {
          const data = await searchConversationMessages(conversationId, q);
          setResults(data);
        } else {
          const data = await searchAllMessages(q);
          setResults(data);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
        <Search className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={conversationId ? "Search in this conversation..." : "Search all messages..."}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-zinc-500"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-[#F97316]" />}
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {query.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-8 w-8 text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              Type at least 2 characters to search
            </p>
          </div>
        ) : results.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-8 w-8 text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              No messages found for &quot;{query}&quot;
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {results.map((msg) => (
              <button
                key={msg.id}
                onClick={() =>
                  onJumpTo?.(
                    msg.conversation?.id || conversationId || msg.conversationId,
                    msg.id
                  )
                }
                className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50"
              >
                {/* Conversation context (global search) */}
                {msg.conversation && (
                  <p className="mb-1 truncate text-[11px] font-medium text-[#F97316]">
                    {msg.conversation.subject || msg.conversation.type}
                  </p>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {msg.sender?.name || "Unknown"}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                    {formatSearchTime(msg.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-600 dark:text-zinc-400 line-clamp-2">
                  {highlightMatch(msg.content, query)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
