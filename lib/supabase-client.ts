import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Client-side Supabase client for Realtime subscriptions.
 * Uses NEXT_PUBLIC_ env vars (safe for browser).
 * Falls back to null if env vars are not set — callers should check.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });
  }
  return _client;
}

export function isRealtimeAvailable(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}
