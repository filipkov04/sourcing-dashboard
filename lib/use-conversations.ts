"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isRealtimeAvailable } from "./supabase-client";
import { useConversationRealtime } from "./realtime";

export type ConversationParticipant = {
  id: string;
  userId: string;
  unreadCount: number;
  lastReadAt: string | null;
  muted: boolean;
  user: { id: string; name: string | null; email: string; image: string | null };
};

export type MessageSender = {
  id: string;
  name: string | null;
  email?: string;
  image?: string | null;
};

export type MessageAttachment = {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  url?: string;
  createdAt: string;
};

export type MessageReaction = {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string | null;
  content: string;
  messageType: "TEXT" | "SYSTEM" | "REQUEST" | "APPROVAL" | "BOT";
  requestAction: "APPROVED" | "REJECTED" | "PENDING_INFO" | null;
  sender: MessageSender | null;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  readBy?: Array<{ userId: string; readAt: string }>;
  parentId?: string | null;
  threadCount?: number;
  deletedAt?: string | null;
  createdAt: string;
  editedAt: string | null;
};

export type ConversationType = "SUPPORT" | "FACTORY" | "GENERAL";

export type Conversation = {
  id: string;
  organizationId: string;
  subject: string | null;
  type: ConversationType;
  category: string | null;
  lastMessageAt: string | null;
  orderId: string | null;
  order: { id: string; orderNumber: string; productName: string } | null;
  factoryId: string | null;
  factory: { id: string; name: string; location?: string; contactName?: string | null; contactEmail?: string | null; contactPhone?: string | null } | null;
  participants: ConversationParticipant[];
  unreadCount: number;
  pinned: boolean;
  lastMessage: (Message & { sender: { id: string; name: string | null } | null }) | null;
  createdAt: string;
};

export type ConversationDetail = Omit<Conversation, "lastMessage" | "unreadCount"> & {
  messages: Message[];
};

/** Polls total unread message count every 30s */
export function useMessageUnreadCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/unread-count");
      if (res.ok) {
        const json = await res.json();
        setCount(json.data.count);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { count, refresh };
}

/** Fetches conversation list */
export function useConversations(search?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const url = search
        ? `/api/conversations?search=${encodeURIComponent(search)}`
        : "/api/conversations";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setConversations(json.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  // Poll every 10s
  useEffect(() => {
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { conversations, loading, refresh };
}

/** Fetches a single conversation with messages. Uses realtime when available, polls every 5s as fallback. */
export function useConversationDetail(id: string | null) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const prevIdRef = useRef<string | null>(null);
  const hasRealtime = isRealtimeAvailable();

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const json = await res.json();
        setConversation(json.data);
      }
    } catch {
      // Silently fail
    }
  }, [id]);

  // Initial load + mark as read
  useEffect(() => {
    if (!id) {
      setConversation(null);
      return;
    }

    // Only show loading spinner when switching conversations
    if (id !== prevIdRef.current) {
      setLoading(true);
      prevIdRef.current = id;
    }

    async function load() {
      await refresh();
      setLoading(false);
      // Mark as read
      fetch(`/api/conversations/${id}/read`, { method: "PATCH" }).catch(() => {});
    }
    load();
  }, [id, refresh]);

  // Realtime: instant refresh on conversation events
  useConversationRealtime(id, useCallback(() => {
    refresh();
  }, [refresh]));

  // Polling fallback: only poll if realtime isn't available
  useEffect(() => {
    if (!id || hasRealtime) return;
    const interval = setInterval(refresh, 5_000);
    return () => clearInterval(interval);
  }, [id, refresh, hasRealtime]);

  return { conversation, loading, refresh };
}

/** Send a message (text-only or with files) */
export async function sendMessage(
  conversationId: string,
  content: string,
  files?: File[]
) {
  let res: Response;

  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("content", content);
    for (const file of files) {
      formData.append("files", file);
    }
    res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: formData,
    });
  } else {
    res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Failed to send message (${res.status})`);
  }
  const json = await res.json();
  return json.data as Message;
}

/** Send a quick-reply (support category selection) */
export async function sendQuickReply(conversationId: string, category: string) {
  const res = await fetch(`/api/conversations/${conversationId}/quick-reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error("Failed to send quick reply");
  const json = await res.json();
  return json.data;
}

/** Create a new conversation */
export async function createConversation(data: {
  subject: string;
  participantIds?: string[];
  orderId?: string;
  factoryId?: string;
  type?: ConversationType;
  category?: string;
}) {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "Failed to create conversation");
  }
  const json = await res.json();
  return json.data as ConversationDetail;
}

/** Delete an entire conversation */
export async function deleteConversation(conversationId: string) {
  const res = await fetch(`/api/conversations/${conversationId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Failed to delete conversation");
  }
  const json = await res.json();
  return json.data;
}

/** Edit a message */
export async function editMessage(
  conversationId: string,
  messageId: string,
  content: string
) {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  );
  if (!res.ok) throw new Error("Failed to edit message");
  const json = await res.json();
  return json.data as Message;
}

/** Soft-delete a message */
export async function deleteMessage(
  conversationId: string,
  messageId: string
) {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete message");
  const json = await res.json();
  return json.data;
}

/** Toggle emoji reaction on a message */
export async function toggleReaction(
  conversationId: string,
  messageId: string,
  emoji: string
) {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/${messageId}/reactions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    }
  );
  if (!res.ok) throw new Error("Failed to toggle reaction");
  const json = await res.json();
  return json.data as {
    messageId: string;
    reactions: MessageReaction[];
    action: "added" | "removed";
  };
}

/** Search messages within a conversation */
export async function searchConversationMessages(
  conversationId: string,
  query: string
) {
  const res = await fetch(
    `/api/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Failed to search messages");
  const json = await res.json();
  return json.data as Message[];
}

/** Global search across all conversations */
export async function searchAllMessages(query: string) {
  const res = await fetch(
    `/api/messages/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Failed to search messages");
  const json = await res.json();
  return json.data as (Message & {
    conversation: { id: string; subject: string | null; type: string };
  })[];
}

/** Fetch thread replies for a message */
export function useThreadReplies(conversationId: string | null, messageId: string | null) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!conversationId || !messageId) return;
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages/${messageId}/replies`
      );
      if (res.ok) {
        const json = await res.json();
        setReplies(json.data);
      }
    } catch {
      // Silently fail
    }
  }, [conversationId, messageId]);

  useEffect(() => {
    if (!conversationId || !messageId) {
      setReplies([]);
      return;
    }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [conversationId, messageId, refresh]);

  // Poll every 5s when active
  useEffect(() => {
    if (!conversationId || !messageId) return;
    const interval = setInterval(refresh, 5_000);
    return () => clearInterval(interval);
  }, [conversationId, messageId, refresh]);

  return { replies, loading, refresh };
}

/** Send a reply in a thread */
export async function sendReply(
  conversationId: string,
  parentId: string,
  content: string,
  files?: File[]
) {
  let res: Response;

  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("parentId", parentId);
    for (const file of files) {
      formData.append("files", file);
    }
    res = await fetch(`/api/conversations/${conversationId}/messages/${parentId}/replies`, {
      method: "POST",
      body: formData,
    });
  } else {
    res = await fetch(`/api/conversations/${conversationId}/messages/${parentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  if (!res.ok) throw new Error("Failed to send reply");
  const json = await res.json();
  return json.data as Message;
}

/** Get conversation settings for current user */
export async function getConversationSettings(conversationId: string) {
  const res = await fetch(`/api/conversations/${conversationId}/settings`);
  if (!res.ok) throw new Error("Failed to get settings");
  const json = await res.json();
  return json.data as {
    muted: boolean;
    pinned: boolean;
    notifyReplies: boolean;
    notifyMentions: boolean;
  };
}

/** Update conversation settings for current user */
export async function updateConversationSettings(
  conversationId: string,
  settings: Partial<{
    muted: boolean;
    pinned: boolean;
    notifyReplies: boolean;
    notifyMentions: boolean;
  }>
) {
  const res = await fetch(`/api/conversations/${conversationId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  const json = await res.json();
  return json.data;
}
