"use client";

import { cn } from "@/lib/utils";

interface GradientCoreProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

const blobSizeMap = {
  sm: "h-8 w-8",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export function GradientCore({ size = "md", className }: GradientCoreProps) {
  return (
    <div className={cn("relative flex items-center justify-center", sizeMap[size], className)}>
      {/* Ambient glow */}
      <div
        className={cn("absolute rounded-full opacity-25", blobSizeMap[size])}
        style={{
          background: "radial-gradient(ellipse at 40% 45%, rgba(235,93,46,0.5), rgba(249,115,22,0.3) 50%, transparent 70%)",
          filter: size === "sm" ? "blur(2px)" : size === "md" ? "blur(3px)" : "blur(4px)",
          animation: "gradient-breathe 8s ease-in-out infinite",
        }}
      />

      {/* Primary blob — asymmetric organic shape */}
      <div
        className="absolute"
        style={{
          width: size === "sm" ? "36px" : size === "md" ? "72px" : "96px",
          height: size === "sm" ? "32px" : size === "md" ? "64px" : "88px",
          background: `
            radial-gradient(ellipse at 30% 60%, #F97316 0%, transparent 50%),
            radial-gradient(ellipse at 55% 35%, #f97316 0%, transparent 50%),
            radial-gradient(ellipse at 70% 55%, #d44a1a 0%, transparent 55%),
            radial-gradient(ellipse at 75% 30%, #fbbf24 0%, transparent 45%),
            radial-gradient(ellipse at 20% 30%, #f97316 0%, transparent 40%)
          `,
          filter: size === "sm" ? "blur(1px)" : size === "md" ? "blur(2px)" : "blur(3px)",
          opacity: 0.95,
          animation: "gradient-breathe 6s ease-in-out infinite",
        }}
      />

      {/* Inner bright core for depth */}
      <div
        className="absolute"
        style={{
          width: size === "sm" ? "18px" : size === "md" ? "36px" : "48px",
          height: size === "sm" ? "16px" : size === "md" ? "30px" : "42px",
          borderRadius: "55% 45% 52% 48% / 45% 55% 45% 55%",
          background: `
            radial-gradient(ellipse at 45% 50%, rgba(235,93,46,0.95) 0%, rgba(249,115,22,0.6) 45%, transparent 70%)
          `,
          filter: size === "sm" ? "blur(1px)" : size === "md" ? "blur(1px)" : "blur(2px)",
          animation: "gradient-breathe-reverse 8s ease-in-out infinite",
        }}
      />
    </div>
  );
}
