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
      transition={{ duration: 0.4 }}
    >
      <motion.h1
        className="text-4xl font-bold text-white sm:text-5xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Welcome back, {firstName}
      </motion.h1>

      <motion.div
        className="mt-8 max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <p className="text-lg italic text-zinc-400">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          &mdash; {quote.author}
        </p>
      </motion.div>

      <motion.button
        className="mt-12 rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
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
