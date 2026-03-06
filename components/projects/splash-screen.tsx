"use client";

import { motion } from "framer-motion";
import { SaltoLogo } from "@/components/salto-logo";
import { useEffect, useState, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&";
const TARGET = "SALTO";

function useDecodingText(target: string, startDelay: number) {
  const [text, setText] = useState(target.split("").map(() => " "));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    const resolved = new Array(target.length).fill(false);
    let frame: number;
    let count = 0;

    const tick = () => {
      count++;
      setText(
        target.split("").map((char, i) => {
          if (resolved[i]) return char;
          // Each letter resolves after a staggered number of ticks
          if (count > 6 + i * 4) {
            resolved[i] = true;
            return char;
          }
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
      );
      if (resolved.every(Boolean)) return;
      frame = requestAnimationFrame(tick);
    };

    // Run at ~20fps for that digital readout feel
    const interval = setInterval(() => {
      cancelAnimationFrame(frame);
      tick();
    }, 50);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(frame);
    };
  }, [started, target]);

  return text;
}

function HUDCorner({ position, delay }: { position: string; delay: number }) {
  const size = 20;
  const paths: Record<string, string> = {
    "top-left": `M 0 ${size} L 0 0 L ${size} 0`,
    "top-right": `M ${0} 0 L ${size} 0 L ${size} ${size}`,
    "bottom-left": `M 0 ${0} L 0 ${size} L ${size} ${size}`,
    "bottom-right": `M 0 ${size} L ${size} ${size} L ${size} 0`,
  };

  const posClass: Record<string, string> = {
    "top-left": "-left-3 -top-3",
    "top-right": "-right-3 -top-3",
    "bottom-left": "-left-3 -bottom-3",
    "bottom-right": "-right-3 -bottom-3",
  };

  return (
    <motion.svg
      width={size}
      height={size}
      className={`absolute ${posClass[position]}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ delay, duration: 0.15 }}
    >
      <motion.path
        d={paths[position]}
        fill="none"
        stroke="#f97316"
        strokeWidth={1.5}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.3, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

function ScanLine({ delay }: { delay: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent"
      initial={{ top: "0%", opacity: 0 }}
      animate={{
        top: ["0%", "100%"],
        opacity: [0, 1, 1, 0],
      }}
      transition={{ delay, duration: 0.8, ease: "linear" }}
    />
  );
}

function DataReadout({ label, value, delay }: { label: string; value: string; delay: number }) {
  const [display, setDisplay] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!show) return;
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count > 5) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(
          value
            .split("")
            .map((c) =>
              c === " " ? " " : CHARS[Math.floor(Math.random() * CHARS.length)]
            )
            .join("")
        );
      }
    }, 40);
    return () => clearInterval(interval);
  }, [show, value]);

  return (
    <motion.div
      className="flex items-center gap-2 font-mono text-[10px]"
      initial={{ opacity: 0 }}
      animate={show ? { opacity: 1 } : {}}
      transition={{ duration: 0.15 }}
    >
      <span className="text-orange-500/60">{label}</span>
      <span className="text-zinc-500">{display || "\u00A0".repeat(value.length)}</span>
    </motion.div>
  );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const decodedText = useDecodingText(TARGET, 1200);
  const hasCompleted = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        onComplete();
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090a]"
      exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
    >
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Scan lines */}
      <ScanLine delay={0.2} />
      <ScanLine delay={1.4} />

      {/* Horizontal HUD lines — left */}
      <motion.div
        className="absolute left-[10%] top-1/2 h-px bg-gradient-to-r from-orange-500/30 to-transparent"
        initial={{ width: 0 }}
        animate={{ width: "15%" }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
      />
      {/* Horizontal HUD lines — right */}
      <motion.div
        className="absolute right-[10%] top-1/2 h-px bg-gradient-to-l from-orange-500/30 to-transparent"
        initial={{ width: 0 }}
        animate={{ width: "15%" }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
      />

      {/* Center content */}
      <div className="relative flex flex-col items-center">
        {/* HUD bracket corners around logo area */}
        <div className="relative">
          <HUDCorner position="top-left" delay={0.3} />
          <HUDCorner position="top-right" delay={0.4} />
          <HUDCorner position="bottom-left" delay={0.5} />
          <HUDCorner position="bottom-right" delay={0.6} />

          {/* Rotating ring */}
          <motion.div
            className="absolute -inset-6 flex items-center justify-center"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.15, rotate: 360 }}
            transition={{
              opacity: { delay: 0.5, duration: 0.3 },
              rotate: { delay: 0.5, duration: 8, repeat: Infinity, ease: "linear" },
            }}
          >
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r="65"
                fill="none"
                stroke="#f97316"
                strokeWidth="0.5"
                strokeDasharray="8 12"
              />
            </svg>
          </motion.div>

          {/* Logo materializes */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.8, filter: "brightness(2)" }}
            animate={{ opacity: 1, scale: 1, filter: "brightness(1)" }}
            transition={{
              delay: 0.7,
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <SaltoLogo size={80} />
          </motion.div>
        </div>

        {/* Decoded text */}
        <div className="mt-6 flex gap-[3px]">
          {decodedText.map((char, i) => (
            <motion.span
              key={i}
              className="inline-block w-[18px] text-center font-mono text-xl font-bold tracking-[0.25em] text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 + i * 0.05, duration: 0.1 }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Status line */}
        <motion.div
          className="mt-4 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.3 }}
        >
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-orange-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
            System initialized
          </span>
        </motion.div>

        {/* Data readouts — flanking the logo */}
        <div className="absolute -left-44 top-0 flex flex-col gap-1.5">
          <DataReadout label="SYS" value="ONLINE" delay={0.8} />
          <DataReadout label="VER" value="4.2.1" delay={1.0} />
          <DataReadout label="ENV" value="PROD" delay={1.2} />
        </div>
        <div className="absolute -right-44 top-0 flex flex-col items-end gap-1.5">
          <DataReadout label="NODE" value="EU-W1" delay={0.9} />
          <DataReadout label="LAT" value="12MS" delay={1.1} />
          <DataReadout label="ENC" value="AES256" delay={1.3} />
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <motion.div
          className="h-px w-64 overflow-hidden rounded-full bg-zinc-800/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.2 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.6, duration: 1, ease: [0.4, 0, 0.2, 1] }}
          />
        </motion.div>
        <motion.p
          className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.2 }}
        >
          Loading modules
        </motion.p>
      </div>
    </motion.div>
  );
}
