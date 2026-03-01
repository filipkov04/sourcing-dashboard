"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

type BreadcrumbContextValue = {
  detail: string | null;
  setDetail: (label: string) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  detail: null,
  setDetail: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [detail, setDetailState] = useState<string | null>(null);

  // Auto-clear detail when pathname changes
  useEffect(() => {
    setDetailState(null);
  }, [pathname]);

  const setDetail = useCallback((label: string) => {
    setDetailState(label);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ detail, setDetail }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}
