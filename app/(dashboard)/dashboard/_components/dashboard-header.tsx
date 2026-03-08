"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type DashboardHeaderProps = {
  userName: string | null | undefined;
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("Welcome back");
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }

    const updateTime = () => {
      setTimeString(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-end justify-between">
      <div>
        <motion.p
          className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-500/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Command Center
        </motion.p>
        <motion.h1
          className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {greeting}, {userName || "there"}
        </motion.h1>
        <motion.p
          className="mt-1 text-sm text-gray-500 dark:text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          Here&apos;s your sourcing overview
        </motion.p>
      </div>
      <motion.div
        className="hidden sm:flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-green-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-600">
            LIVE
          </span>
        </div>
        <span className="font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-600">
          {timeString}
        </span>
      </motion.div>
    </div>
  );
}
