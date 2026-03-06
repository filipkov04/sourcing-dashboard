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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
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
        className="mt-6 h-px w-16 bg-zinc-700"
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
        className="mt-10 rounded-full border border-zinc-700 px-8 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
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
