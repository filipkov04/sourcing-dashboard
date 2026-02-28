import { supabase } from "./supabase";
import type { RealtimeEvent } from "./realtime";

/**
 * Server-side helper: broadcast via Supabase Realtime from API routes.
 * Uses the server-side Supabase client (service role).
 */
export async function serverBroadcast(
  conversationId: string,
  event: Omit<RealtimeEvent, "conversationId">
) {
  const channel = supabase.channel(`conversation:${conversationId}`);
  await channel.send({
    type: "broadcast",
    event: "message",
    payload: { ...event, conversationId },
  });
  supabase.removeChannel(channel);
}
