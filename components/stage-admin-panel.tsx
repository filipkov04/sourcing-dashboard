"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Send,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AdminNote = {
  id: string;
  stageId: string;
  orderId: string;
  type: "NOTE" | "COMMENT" | "STATUS_DETAIL" | "CHANGE_LOG";
  content: string;
  authorId: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};

type StageAdminPanelProps = {
  orderId: string;
  stageId: string;
  stageName: string;
  variant: "inline" | "full";
  currentUserId?: string;
  onClose?: () => void;
  onNoteAdded?: (note: AdminNote) => void;
  onNoteUpdated?: () => void;
  onNoteDeleted?: () => void;
};

const noteTypeConfig: Record<
  AdminNote["type"],
  { label: string; color: string; bgColor: string }
> = {
  NOTE: {
    label: "Note",
    color: "text-purple-400",
    bgColor: "bg-purple-900/30 border-purple-700",
  },
  COMMENT: {
    label: "Comment",
    color: "text-blue-400",
    bgColor: "bg-blue-900/30 border-blue-700",
  },
  STATUS_DETAIL: {
    label: "Status Detail",
    color: "text-orange-400",
    bgColor: "bg-orange-900/30 border-orange-700",
  },
  CHANGE_LOG: {
    label: "Change Log",
    color: "text-orange-400",
    bgColor: "bg-orange-900/30 border-orange-700",
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function StageAdminPanel({
  orderId,
  stageId,
  stageName,
  variant,
  currentUserId,
  onClose,
  onNoteAdded,
  onNoteUpdated,
  onNoteDeleted,
}: StageAdminPanelProps) {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [historyCategory, setHistoryCategory] = useState<"progress" | "notes" | "events">("notes");

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/orders/${orderId}/admin-notes?stageId=${stageId}`
      );
      const data = await res.json();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin notes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, stageId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/admin-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId,
          type: historyCategory === "progress" ? "CHANGE_LOG" : historyCategory === "events" ? "STATUS_DETAIL" : "NOTE",
          content: newContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => [data.data, ...prev]);
        setNewContent("");
        onNoteAdded?.(data.data);
      }
    } catch (err) {
      console.error("Failed to add admin note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editingContent.trim()) return;
    try {
      const res = await fetch(
        `/api/orders/${orderId}/admin-notes/${noteId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editingContent.trim() }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? data.data : n))
        );
        setEditingId(null);
        setEditingContent("");
        onNoteUpdated?.();
      }
    } catch (err) {
      console.error("Failed to update admin note:", err);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const res = await fetch(
        `/api/orders/${orderId}/admin-notes/${noteId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        onNoteDeleted?.();
      }
    } catch (err) {
      console.error("Failed to delete admin note:", err);
    }
  };

  // ── INLINE VARIANT ──
  if (variant === "inline") {
    const displayNotes = notes.slice(0, 3);

    return (
      <div
        className="w-[340px] bg-zinc-900/90 border border-purple-700/50 rounded-lg p-3 shadow-lg"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">
              Admin Notes
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Notes list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
          </div>
        ) : displayNotes.length > 0 ? (
          <div className="space-y-1.5 mb-2">
            {displayNotes.map((note) => (
              <div
                key={note.id}
                className="bg-zinc-800/80 rounded p-2 border border-zinc-700/50"
              >
                {editingId === note.id ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdate(note.id);
                        }
                      }}
                      className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-purple-600"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdate(note.id)}
                        disabled={!editingContent.trim()}
                        className="text-[10px] px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingContent("");
                        }}
                        className="text-[10px] px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-zinc-300 line-clamp-2">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-purple-400">
                          {note.authorName || "Admin"}
                        </span>
                        <span className="text-[10px] text-zinc-600" suppressHydrationWarning>
                          {formatTimeAgo(note.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(note.id);
                            setEditingContent(note.content);
                          }}
                          className="text-zinc-500 hover:text-zinc-300"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            {notes.length > 3 && (
              <p className="text-[10px] text-zinc-500 text-center">
                +{notes.length - 3} more
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 mb-2 text-center py-2">
            No notes yet
          </p>
        )}

        {/* Category toggle */}
        <div className="flex items-center gap-1 mb-2">
          {(
            [
              { key: "notes", label: "Notes" },
              { key: "progress", label: "Stage Progress" },
              { key: "events", label: "Events" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setHistoryCategory(key)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                historyCategory === key
                  ? "bg-purple-900/50 text-purple-300 border-purple-600"
                  : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Quick-add input */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Add a note..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-600"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isSubmitting || !newContent.trim()}
            className="h-6 w-6 p-0 bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ── FULL VARIANT ──
  const filteredNotes = notes.filter((note) => {
    if (historyCategory === "progress") return note.type === "CHANGE_LOG";
    if (historyCategory === "events") return note.type === "STATUS_DETAIL";
    return note.type === "NOTE" || note.type === "COMMENT";
  });

  return (
    <div className="bg-zinc-900/80 border border-purple-700/40 rounded-lg p-4 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">
            Admin Notes — {stageName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotes}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Add note */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {(
              [
                { key: "notes", label: "Notes" },
                { key: "progress", label: "Stage Progress" },
                { key: "events", label: "Events" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setHistoryCategory(key)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  historyCategory === key
                    ? "bg-purple-900/50 text-purple-300 border-purple-600"
                    : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isSubmitting || !newContent.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-xs h-7"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
            Add
          </Button>
        </div>
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={`Add a ${historyCategory === "progress" ? "stage progress update" : historyCategory === "events" ? "event" : "note"}...`}
          rows={2}
          className="text-sm bg-zinc-800 border-zinc-700 focus:border-purple-600"
        />
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
          {filteredNotes.map((note) => {
            const config = noteTypeConfig[note.type];
            const isEditing = editingId === note.id;

            return (
              <div
                key={note.id}
                className={`rounded-md p-3 border ${config.bgColor}`}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={2}
                      className="text-sm bg-zinc-800 border-zinc-700"
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(note.id)}
                        className="h-6 text-xs bg-purple-600 hover:bg-purple-700"
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditingContent("");
                        }}
                        className="h-6 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {note.authorName || "Admin"}
                        </span>
                        <span className="text-xs text-zinc-600" suppressHydrationWarning>
                          {formatTimeAgo(note.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(note.id);
                            setEditingContent(note.content);
                          }}
                          className="text-zinc-500 hover:text-zinc-300"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 text-center py-4">
          No {historyCategory === "progress" ? "stage progress entries" : historyCategory === "events" ? "events" : "notes"} yet
        </p>
      )}
    </div>
  );
}
