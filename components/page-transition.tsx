"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState, useRef } from "react";
import { PageLoader } from "./page-loader";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);
  const loaderDelayTimer = useRef<NodeJS.Timeout>(undefined);
  const loadingCompleteTimer = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    // Detect route change
    if (pathname !== previousPath) {
      setIsLoading(true);
      setPreviousPath(pathname);

      // Start a delay timer - only show loader if loading takes > 200ms
      loaderDelayTimer.current = setTimeout(() => {
        if (isLoading) {
          setShowLoader(true);
        }
      }, 200); // Delay threshold: 200ms

      // Mark loading as complete after content is likely rendered
      loadingCompleteTimer.current = setTimeout(() => {
        setIsLoading(false);

        // If loader is showing, keep it visible for minimum 400ms for smooth UX
        if (showLoader) {
          setTimeout(() => {
            setShowLoader(false);
          }, 400);
        }
      }, 100); // Content render check

      return () => {
        if (loaderDelayTimer.current) {
          clearTimeout(loaderDelayTimer.current);
        }
        if (loadingCompleteTimer.current) {
          clearTimeout(loadingCompleteTimer.current);
        }
      };
    }
  }, [pathname, previousPath, isLoading, showLoader]);

  return (
    <>
      {/* Page Loader - Only shows if loading is slow */}
      <AnimatePresence>
        {showLoader && <PageLoader />}
      </AnimatePresence>

      {/* Page Content - Always has slide transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
