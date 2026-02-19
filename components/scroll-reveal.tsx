"use client";

import {
  motion,
  useScroll,
  useVelocity,
} from "framer-motion";
import { Children, ReactNode, useCallback, useRef, useState } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down";
  className?: string;
  /** Animate each child individually with a stagger delay */
  stagger?: boolean;
  /** Per-child stagger interval in seconds (default 0.12) */
  staggerInterval?: number;
}

const MAX_DURATION = 0.5;
const MIN_DURATION = 0.1;
const FAST_THRESHOLD = 2000;

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className,
  stagger = false,
  staggerInterval = 0.12,
}: ScrollRevealProps) {
  const yOffset = direction === "up" ? 20 : -20;
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [dynamicTransition, setDynamicTransition] = useState({
    duration: MAX_DURATION,
    delayScale: 1,
  });

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  const handleViewportEnter = useCallback(() => {
    if (hasAnimated) return;

    const speed = Math.min(Math.abs(scrollVelocity.get()), FAST_THRESHOLD);
    const ratio = speed / FAST_THRESHOLD;

    setDynamicTransition({
      duration: MAX_DURATION - ratio * (MAX_DURATION - MIN_DURATION),
      delayScale: 1 - ratio,
    });
    setHasAnimated(true);
  }, [hasAnimated, scrollVelocity]);

  const { duration, delayScale } = dynamicTransition;

  if (stagger) {
    const parentVariants = {
      hidden: {},
      visible: {
        transition: {
          delayChildren: delay * delayScale,
          staggerChildren: staggerInterval * delayScale,
        },
      },
    };

    const childVariants = {
      hidden: { opacity: 0, y: yOffset },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration, ease: "easeOut" as const },
      },
    };

    return (
      <motion.div
        ref={ref}
        variants={parentVariants}
        initial="hidden"
        animate={hasAnimated ? "visible" : "hidden"}
        viewport={{ once: true, amount: 0.05 }}
        onViewportEnter={handleViewportEnter}
        className={className}
      >
        {Children.map(children, (child) => (
          <motion.div variants={childVariants} className="min-w-0">
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yOffset }}
      animate={
        hasAnimated ? { opacity: 1, y: 0 } : { opacity: 0, y: yOffset }
      }
      transition={{
        duration,
        delay: delay * delayScale,
        ease: "easeOut",
      }}
      viewport={{ once: true, amount: 0.05 }}
      onViewportEnter={handleViewportEnter}
      className={className}
    >
      {children}
    </motion.div>
  );
}
