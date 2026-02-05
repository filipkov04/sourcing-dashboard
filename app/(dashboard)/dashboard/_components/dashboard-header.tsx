"use client";

import { useEffect, useState } from "react";

type DashboardHeaderProps = {
  userName: string | null | undefined;
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
        {greeting}, {userName || "there"} 👋
      </p>
    </div>
  );
}
