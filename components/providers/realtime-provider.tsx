"use client";

import { createContext, useContext, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { isRealtimeAvailable } from "@/lib/supabase-client";
import { useRealtimePresence, type RealtimeEvent } from "@/lib/realtime";

type RealtimeContextValue = {
  /** Whether Supabase Realtime is available (env vars set) */
  isRealtime: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  isRealtime: false,
});

export function useRealtime() {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const isRealtime = isRealtimeAvailable();

  // Track user presence via Supabase Realtime
  useRealtimePresence(isRealtime ? userId : null);

  return (
    <RealtimeContext.Provider value={{ isRealtime }}>
      {children}
    </RealtimeContext.Provider>
  );
}
