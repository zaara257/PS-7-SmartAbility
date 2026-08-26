// src/components/rewards/RhymeOverlay.tsx
// Level 4 — rhyme card with CheerOverlay layered on top.
// CheerOverlay is reused here without duplicating cheer logic.

import { motion } from "framer-motion";
import CheerOverlay from "./CheerOverlay";
import type { RhymeDef } from "../../constants/rhymes";

interface RhymeOverlayProps {
  rhyme: RhymeDef | null;
}

export default function RhymeOverlay({ rhyme }: RhymeOverlayProps) {
  if (!rhyme) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-10 h-10 border-4 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-6 w-full">
      {/* Cheer overlay at the bottom */}
      <CheerOverlay active />

      {/* Emoji */}
      <motion.span
        className="text-7xl select-none"
        role="img"
        aria-label="rhyme icon"
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 20 }}
      >
        {rhyme.emoji}
      </motion.span>

      {/* Rhyme card */}
      <motion.div
        className="bg-white/90 rounded-3xl px-8 py-6 shadow-lg border-2 border-sunshine-yellow/40 text-center max-w-xs w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 22 }}
      >
        {rhyme.lines.map((line, i) => (
          <motion.p
            key={i}
            className="font-fredoka text-lg text-bark-brown leading-relaxed"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    </div>
  );
}
