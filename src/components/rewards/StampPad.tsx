// src/components/rewards/StampPad.tsx
// Level 1 — stamp bounces onto a pad element, pad clears after 2s.
// Framer Motion spring: scale + translateY.

import { motion } from "framer-motion";
import type { StampDef } from "../../constants/stampPool";

interface StampPadProps {
  stamp: StampDef | null;
}

export default function StampPad({ stamp }: StampPadProps) {
  if (!stamp) {
    return (
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Stamp pad base */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 180, height: 180 }}
      >
        {/* Pad surface */}
        <div
          className="absolute inset-0 rounded-3xl border-4 border-soil-brown/30 bg-white/60 shadow-inner"
          style={{ boxShadow: "inset 0 4px 16px rgba(107,74,61,0.12)" }}
          aria-hidden="true"
        />

        {/* Stamp landing */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-2"
          initial={{ scale: 3, y: -60, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 18,
            mass: 0.8,
          }}
        >
          <span className="text-8xl select-none" role="img" aria-label={stamp.label}>
            {stamp.emoji}
          </span>
        </motion.div>

        {/* Impact rings */}
        {[1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full border-2 border-forest-green/30"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: ring * 2.2, opacity: 0 }}
            transition={{ delay: 0.15 + ring * 0.05, duration: 0.55, ease: "easeOut" }}
            style={{ width: 60, height: 60 }}
          />
        ))}
      </div>

      {/* Label */}
      <motion.p
        className="font-baloo text-2xl font-bold text-bark-brown"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {stamp.label}!
      </motion.p>

      {/* Stars burst */}
      <motion.div
        className="flex gap-2 text-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        aria-hidden="true"
      >
        {["⭐", "✨", "⭐"].map((s, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.7, delay: 0.5 + i * 0.12, repeat: 2 }}
          >
            {s}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
