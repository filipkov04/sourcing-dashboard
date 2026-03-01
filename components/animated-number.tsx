"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1,
  formatFn,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });

  // Trigger animation when element enters viewport or value changes
  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  // Update DOM directly via ref to avoid hydration mismatch
  // (MotionValue is not a valid React child for SSR)
  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatFn
          ? formatFn(latest)
          : Math.round(latest).toLocaleString();
      }
    });
    return unsubscribe;
  }, [spring, formatFn]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      0
    </span>
  );
}
