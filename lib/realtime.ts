"use client";

import { useEffect, useRef, useCallback } from "react";
import { getSupabaseClient, isRealtimeAvailable } from "./supabase-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Event types for the messaging system
export type RealtimeEventType =
  | "new_message"
  | "message_edited"
  | "message_deleted"
  | "reaction_changed"
  | "typing"
  | "presence";

export type RealtimeEvent = {
  type: RealtimeEventType;
  conversationId: string;
  messageId?: string;
  userId?: string;
  payload?: Record<string, unknown>;
};

/**
 * Subscribe to realtime events for a conversation channel.
 * Returns a cleanup function, or null if realtime isn't available.
 */
export function subscribeToConversation(
  conversationId: string,
  onEvent: (event: RealtimeEvent) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  const channel = client.channel(`conversation:${conversationId}`, {
    config: { broadcast: { self: false } },
  });

  channel
    .on("broadcast", { event: "message" }, (payload) => {
      onEvent({
        type: payload.payload?.type ?? "new_message",
        conversationId,
        messageId: payload.payload?.messageId,
        userId: payload.payload?.userId,
        payload: payload.payload,
      });
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Broadcast an event to a conversation channel (called from API routes via server-side).
 * For client-side, we use REST mutations + server broadcasts.
 */
export async function broadcastToConversation(
  conversationId: string,
  event: Omit<RealtimeEvent, "conversationId">
) {
  const client = getSupabaseClient();
  if (!client) return;

  const channel = client.channel(`conversation:${conversationId}`);
  await channel.send({
    type: "broadcast",
    event: "message",
    payload: { ...event, conversationId },
  });
  channel.unsubscribe();
}

/**
 * Hook to subscribe to a conversation's realtime events.
 * Falls back gracefully to polling (no-op) if Supabase Realtime isn't configured.
 */
export function useConversationRealtime(
  conversationId: string | null,
  onEvent: (event: RealtimeEvent) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!conversationId || !isRealtimeAvailable()) return;

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client.channel(`conversation:${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "message" }, (payload) => {
        onEventRef.current({
          type: payload.payload?.type ?? "new_message",
          conversationId,
          messageId: payload.payload?.messageId,
          userId: payload.payload?.userId,
          payload: payload.payload,
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId]);
}

/**
 * Hook for user presence using Supabase Realtime Presence.
 * Falls back to polling if not available.
 */
export function useRealtimePresence(
  userId: string | null,
  onPresenceUpdate?: (presenceState: Record<string, boolean>) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId || !isRealtimeAvailable()) return;

    const client = getSupabaseClient();
    if (!client) return;

    const channel = client.channel("presence:global", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const onlineMap: Record<string, boolean> = {};
        for (const key of Object.keys(state)) {
          onlineMap[key] = true;
        }
        onPresenceUpdate?.(onlineMap);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [userId, onPresenceUpdate]);
}

/**
 * Server-side helper: broadcast via Supabase Realtime from API routes.
 * Uses the server-side Supabase client (service role).
 */
export async function serverBroadcast(
  conversationId: string,
  event: Omit<RealtimeEvent, "conversationId">
) {
  // Import server-side client lazily to avoid bundling in client
  const { supabase } = await import("./supabase");

  const channel = supabase.channel(`conversation:${conversationId}`);
  await channel.send({
    type: "broadcast",
    event: "message",
    payload: { ...event, conversationId },
  });
  supabase.removeChannel(channel);
}
