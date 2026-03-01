"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedChartContainerProps {
  viewKey: string;
  children: ReactNode;
}

export function AnimatedChartContainer({ viewKey, children }: AnimatedChartContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
