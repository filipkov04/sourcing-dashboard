"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Send,
  Loader2,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";

type Comment = {
  id: string;
  content: string;
  authorId: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
};

interface OrderCommentsProps {
  orderId: string;
  currentUserId?: string;
  userRole?: string;
}

const MAX_LENGTH = 2000;

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string | null): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-green-500 to-green-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-teal-500 to-teal-600",
    "from-indigo-500 to-indigo-600",
    "from-red-500 to-red-600",
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderComments({
  orderId,
  currentUserId,
  userRole,
}: OrderCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isViewer = userRole === "VIEWER";
  const isAdminOrOwner = userRole === "OWNER" || userRole === "ADMIN";

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/comments`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePost = async () => {
    if (!newComment.trim() || isViewer) return;

    setPostError(null);
    setIsPosting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setComments((prev) => [...prev, data.data]);
        setNewComment("");
      } else {
        setPostError(data.error || "Failed to post comment");
      }
    } catch {
      setPostError("Failed to post comment. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent }),
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? data.data : c))
        );
        setEditingId(null);
        setEditContent("");
      }
    } catch (err) {
      console.error("Failed to save comment edit:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const res = await fetch(
        `/api/orders/${orderId}/comments/${commentId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-gray-500 dark:text-zinc-500">
              ({comments.length})
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Team discussion about this order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-zinc-500" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-center py-6 text-gray-500 dark:text-zinc-500">
            No comments yet — start the conversation
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarColor(
                    comment.authorName
                  )} flex items-center justify-center text-white text-xs font-medium`}
                >
                  {getInitials(comment.authorName)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.authorName || "Team Member"}
                    </span>
                    <span
                      className="text-xs text-gray-500 dark:text-zinc-500"
                      title={formatFullDate(comment.createdAt)}
                    >
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-xs text-gray-400 dark:text-zinc-600">
                        (edited)
                      </span>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    /* Edit Mode */
                    <div className="mt-1 space-y-2">
                      <Textarea
                        id="edit-comment"
                        name="edit-comment"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        maxLength={MAX_LENGTH}
                        className="text-sm"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={isSaving || !editContent.trim()}
                        >
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5 mr-1" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="group">
                      <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap mt-0.5">
                        {comment.content}
                      </p>

                      {/* Actions */}
                      {(comment.authorId === currentUserId || isAdminOrOwner) && (
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {comment.authorId === currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(comment)}
                              className="h-6 px-1.5 text-xs text-gray-500 dark:text-zinc-500"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-xs text-red-500"
                                disabled={deletingId === comment.id}
                              >
                                {deletingId === comment.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Comment
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this comment?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(comment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Comment Input */}
        <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
          {isViewer ? (
            <p className="text-sm text-center text-gray-500 dark:text-zinc-500">
              Viewers cannot post comments
            </p>
          ) : (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                id="new-comment"
                name="new-comment"
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  setPostError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                rows={2}
                maxLength={MAX_LENGTH}
                className="text-sm resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {newComment.length > MAX_LENGTH - 200 && (
                    <span
                      className={`text-xs ${
                        newComment.length >= MAX_LENGTH
                          ? "text-red-500"
                          : "text-gray-500 dark:text-zinc-500"
                      }`}
                    >
                      {newComment.length}/{MAX_LENGTH}
                    </span>
                  )}
                  {postError && (
                    <span className="text-xs text-red-500">{postError}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-zinc-600 hidden sm:inline">
                    {typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"}+Enter to send
                  </span>
                  <Button
                    size="sm"
                    onClick={handlePost}
                    disabled={isPosting || !newComment.trim()}
                  >
                    {isPosting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
