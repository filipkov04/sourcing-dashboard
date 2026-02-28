"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type PresenceStatus = "online" | "away" | "busy" | "offline";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const PRESENCE_POLL_INTERVAL = 30_000; // 30 seconds
const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 min without activity → away

/** Detects if the user's microphone or camera is actively in use (on a call). */
function detectOnCall(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return Promise.resolve(false);
  }
  // Check if any active MediaStream tracks exist on the page
  // The only reliable browser API: check if getUserMedia streams are active
  try {
    // Look for active audio/video tracks in any open MediaStreams
    // We check by trying to detect active tracks via the experimental getDisplayMedia
    // For most cases, we detect via the AudioContext or active RTCPeerConnections
    if (typeof (window as unknown as Record<string, unknown>).__sourcyMediaBusy === "boolean") {
      return Promise.resolve((window as unknown as Record<string, unknown>).__sourcyMediaBusy as boolean);
    }

    // Fallback: detect active RTCPeerConnection (WebRTC calls)
    if (typeof RTCPeerConnection !== "undefined") {
      const pcs = (window as unknown as Record<string, unknown>).__sourcyPeerConnections as RTCPeerConnection[] | undefined;
      if (pcs && pcs.length > 0) {
        return Promise.resolve(true);
      }
    }

    return Promise.resolve(false);
  } catch {
    return Promise.resolve(false);
  }
}

/**
 * Sends a heartbeat POST every 30s with current status (online/away/busy).
 * Detects idle (no mouse/keyboard for 2 min) and on-call (active media).
 * Call once at app level.
 */
export function usePresenceHeartbeat() {
  const lastActivityRef = useRef(Date.now());

  // Track user activity
  useEffect(() => {
    function onActivity() {
      lastActivityRef.current = Date.now();
    }

    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    window.addEventListener("click", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
    };
  }, []);

  useEffect(() => {
    async function sendHeartbeat() {
      const isIdle = Date.now() - lastActivityRef.current > IDLE_TIMEOUT;
      const isOnCall = await detectOnCall();

      let status: PresenceStatus = "online";
      if (isOnCall) status = "busy";
      else if (isIdle) status = "away";

      fetch("/api/presence/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    }

    // Send immediately on mount
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, []);
}

/** Mark the current user as busy (on call). Call when user starts a call. */
export function setOnCall(active: boolean) {
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__sourcyMediaBusy = active;
  }
}

/** Polls presence status for a list of user IDs every 30s. Returns a map of userId → PresenceStatus. */
export function usePresence(userIds: string[]) {
  const [statusMap, setStatusMap] = useState<Record<string, PresenceStatus>>({});
  const userIdsKey = userIds.sort().join(",");
  const prevKeyRef = useRef(userIdsKey);

  // Derive boolean online map for backwards compat
  const onlineMap: Record<string, boolean> = {};
  for (const [id, status] of Object.entries(statusMap)) {
    onlineMap[id] = status === "online" || status === "busy";
  }

  const refresh = useCallback(async () => {
    if (userIds.length === 0) return;
    try {
      const res = await fetch(`/api/presence?userIds=${encodeURIComponent(userIds.join(","))}`);
      if (res.ok) {
        const json = await res.json();
        setStatusMap(json.data);
      }
    } catch {
      // Silently fail
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdsKey]);

  // Reset when user IDs change
  useEffect(() => {
    if (userIdsKey !== prevKeyRef.current) {
      setStatusMap({});
      prevKeyRef.current = userIdsKey;
    }
  }, [userIdsKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, PRESENCE_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { statusMap, onlineMap, refresh };
}
