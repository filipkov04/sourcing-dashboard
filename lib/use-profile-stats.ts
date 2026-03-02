"use client";

import { useState, useEffect, useCallback } from "react";

interface ProfileStats {
  joinDate: string | null;
  lastActive: string | null;
  orderCount: number;
  messagesSent: number;
}

export function useProfileStats() {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile-stats");
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
      }
    } catch {
      // ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}
