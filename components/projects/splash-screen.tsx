"use client";

import { motion, useAnimationControls } from "framer-motion";
import { SaltoLogo } from "@/components/salto-logo";
import { useEffect } from "react";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const lineControls = useAnimationControls();
  const logoControls = useAnimationControls();
  const textControls = useAnimationControls();
  const fillControls = useAnimationControls();

  useEffect(() => {
    const sequence = async () => {
      // 1. Horizontal line draws from center
      await lineControls.start({
        scaleX: 1,
        transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] },
      });

      // 2. Logo + text reveal simultaneously
      await Promise.all([
        logoControls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
        }),
        textControls.start({
          clipPath: "inset(0 0 0% 0)",
          opacity: 1,
          transition: { duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
        }),
      ]);

      // 3. Line fills with gradient (progress)
      await fillControls.start({
        scaleX: 1,
        transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] },
      });

      // 4. Done
      setTimeout(onComplete, 200);
    };

    sequence();
  }, [lineControls, logoControls, textControls, fillControls, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950"
      exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } }}
    >
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="flex flex-col items-center">
        {/* Logo — reveals upward from the line */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={logoControls}
          className="mb-6"
        >
          <SaltoLogo size={80} />
        </motion.div>

        {/* Center line — the signature element */}
        <div className="relative h-px w-64">
          {/* Base line draws in */}
          <motion.div
            className="absolute inset-0 bg-zinc-700"
            initial={{ scaleX: 0 }}
            animate={lineControls}
            style={{ transformOrigin: "center" }}
          />
          {/* Gradient fill overlays */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"
            initial={{ scaleX: 0 }}
            animate={fillControls}
            style={{ transformOrigin: "left" }}
          />
        </div>

        {/* Text — clips up from below the line */}
        <motion.div
          className="mt-6"
          initial={{ clipPath: "inset(100% 0 0 0)", opacity: 0 }}
          animate={textControls}
        >
          <span className="text-2xl font-semibold tracking-[0.2em] text-white uppercase">
            salto
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
