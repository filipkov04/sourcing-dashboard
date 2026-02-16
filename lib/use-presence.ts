"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const PRESENCE_POLL_INTERVAL = 30_000; // 30 seconds

/** Sends a heartbeat POST every 30s to keep user's presence alive. Call once at app level. */
export function usePresenceHeartbeat() {
  useEffect(() => {
    function sendHeartbeat() {
      fetch("/api/presence/heartbeat", { method: "POST" }).catch(() => {});
    }

    // Send immediately on mount
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, []);
}

/** Polls presence status for a list of user IDs every 30s. Returns a map of userId → online boolean. */
export function usePresence(userIds: string[]) {
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const userIdsKey = userIds.sort().join(",");
  const prevKeyRef = useRef(userIdsKey);

  const refresh = useCallback(async () => {
    if (userIds.length === 0) return;
    try {
      const res = await fetch(`/api/presence?userIds=${encodeURIComponent(userIds.join(","))}`);
      if (res.ok) {
        const json = await res.json();
        setOnlineMap(json.data);
      }
    } catch {
      // Silently fail
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdsKey]);

  // Reset when user IDs change
  useEffect(() => {
    if (userIdsKey !== prevKeyRef.current) {
      setOnlineMap({});
      prevKeyRef.current = userIdsKey;
    }
  }, [userIdsKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, PRESENCE_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { onlineMap, refresh };
}
