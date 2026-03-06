"use client";

import { motion } from "framer-motion";
import { getRandomQuote } from "@/lib/quotes";
import { useMemo } from "react";

interface GreetingScreenProps {
  userName: string;
  onContinue: () => void;
}

export function GreetingScreen({ userName, onContinue }: GreetingScreenProps) {
  const quote = useMemo(() => getRandomQuote(), []);
  const firstName = userName.split(" ")[0];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#08090a] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* HUD label */}
      <motion.p
        className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-500/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        User Identified
      </motion.p>

      {/* Welcome line — clips up into view */}
      <div className="overflow-hidden">
        <motion.h1
          className="text-4xl font-bold text-white sm:text-5xl"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
        >
          Welcome back, {firstName}
        </motion.h1>
      </div>

      {/* Divider line */}
      <motion.div
        className="mt-6 h-px w-16 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
      />

      {/* Quote — clips up */}
      <div className="mt-6 max-w-md overflow-hidden text-center">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        >
          <p className="text-base italic leading-relaxed text-zinc-400">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            &mdash; {quote.author}
          </p>
        </motion.div>
      </div>

      {/* Continue button */}
      <motion.button
        className="mt-10 rounded-full border border-zinc-700 px-8 py-2.5 font-mono text-xs uppercase tracking-wider text-zinc-400 transition-colors hover:border-orange-500/40 hover:text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        whileTap={{ scale: 0.97 }}
        onClick={onContinue}
      >
        Continue
      </motion.button>

      {/* Auto-advance after 3s */}
      <motion.div
        onAnimationComplete={onContinue}
        animate={{ opacity: 0 }}
        transition={{ delay: 3, duration: 0 }}
        className="hidden"
      />
    </motion.div>
  );
}
