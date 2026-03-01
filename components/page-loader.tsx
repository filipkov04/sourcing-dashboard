"use client";

import { motion } from "framer-motion";
import { SaltoLogo } from "@/components/salto-logo";

export function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950"
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className="flex flex-col items-center space-y-3"
        >
          {/* Icon */}
          <SaltoLogo size={64} />

          {/* App Name */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            salto
          </h2>
        </motion.div>

        {/* Loading Bar */}
        <div className="w-64 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF0F0F] to-[#FFB21A]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-zinc-400">
            Loading...
          </p>
        </div>
      </div>
    </motion.div>
  );
}
