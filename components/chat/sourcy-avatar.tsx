"use client";

import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourcyAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-7 w-7",
  lg: "h-9 w-9",
};

const iconClasses = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

export function SourcyAvatar({ size = "md", className, pulse }: SourcyAvatarProps) {
  return (
    <div className={cn("relative shrink-0", sizeClasses[size])}>
      {pulse && (
        <div className={cn(
          "absolute inset-0 animate-ping rounded-full bg-[#FF8C1A]/30",
          sizeClasses[size]
        )} />
      )}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-[#F97316] to-[#d44a1a]",
          "shadow-[0_0_0_2px_rgba(235,93,46,0.15)]",
          sizeClasses[size],
          className
        )}
      >
        <Bot className={cn("text-white drop-shadow-sm", iconClasses[size])} />
      </div>
    </div>
  );
}
