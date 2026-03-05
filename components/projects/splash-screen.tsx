"use client";

import { motion } from "framer-motion";
import { SaltoLogo } from "@/components/salto-logo";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, duration: 0.6 }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 900);
        }}
      >
        <SaltoLogo size={96} />
      </motion.div>

      <motion.span
        className="mt-4 text-3xl font-bold tracking-tight text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        salto
      </motion.span>

      {/* Progress bar */}
      <motion.div
        className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-zinc-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
