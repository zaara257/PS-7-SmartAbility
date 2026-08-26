// src/components/rewards/PartyScene.tsx
// Level 5 — most elaborate animation.
// Layers: ConfettiBalloons + character + name banner + cake with theme toppers.
// Cake decoration pulled from cakeThemes.ts via child.stickerTheme.

import { motion } from "framer-motion";
import ConfettiBalloons from "./ConfettiBalloons";
import CheerOverlay from "./CheerOverlay";
import { CAKE_THEMES } from "../../constants/cakeThemes";
import type { Child } from "../../types/child";
import type { FavouriteAnimal } from "../../types/child";

// Mirror of CharacterQuoteCard animal emoji map (kept local to avoid coupling)
const ANIMAL_EMOJI: Record<FavouriteAnimal, string> = {
  rabbit:    "🐰",
  fox:       "🦊",
  owl:       "🦉",
  butterfly: "🦋",
  turtle:    "🐢",
  bird:      "🐦",
  cat:       "🐱",
  dog:       "🐶",
  unicorn:   "🦄",
  dinosaur:  "🦕",
};

interface PartySceneProps {
  child: Child;
  active: boolean;
}

function CakeIllustration({ theme, accentColor, toppers }: {
  theme: string;
  accentColor: string;
  toppers: string[];
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-0"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
      aria-label={`${theme} themed cake`}
    >
      {/* Candles */}
      <div className="flex gap-3 mb-1" aria-hidden="true">
        {["🕯️", "🕯️", "🕯️"].map((c, i) => (
          <motion.span
            key={i}
            className="text-2xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
          >
            {c}
          </motion.span>
        ))}
      </div>

      {/* Top tier */}
      <div
        className="rounded-t-2xl w-28 h-10 flex items-center justify-center shadow-md"
        style={{ background: accentColor, opacity: 0.85 }}
      >
        <span className="font-baloo text-white text-xs font-bold tracking-wide">🎂</span>
      </div>

      {/* Bottom tier */}
      <div
        className="rounded-b-2xl w-40 h-14 flex items-center justify-center shadow-lg border-2 border-white/40"
        style={{ background: accentColor }}
      >
        {/* Topper row */}
        <div className="flex gap-1.5" aria-hidden="true">
          {toppers.map((t, i) => (
            <motion.span
              key={i}
              className="text-xl select-none"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              {t}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Plate */}
      <div className="w-44 h-3 rounded-full bg-white/50 shadow-sm" />
    </motion.div>
  );
}

export default function PartyScene({ child, active }: PartySceneProps) {
  const cakeTheme = CAKE_THEMES[child.stickerTheme];
  const animalEmoji = ANIMAL_EMOJI[child.favouriteAnimal];

  if (!active) return null;

  return (
    <div className="relative flex flex-col items-center gap-4 w-full overflow-hidden">
      {/* Confetti + balloons layer */}
      <ConfettiBalloons color={child.favouriteColor} active={active} />

      {/* Cheer layer */}
      <CheerOverlay active={active} />

      {/* Name banner */}
      <motion.div
        className="relative z-10 mt-2"
        initial={{ y: -40, opacity: 0, rotate: -3 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 20 }}
      >
        <div
          className="px-8 py-3 rounded-full border-4 border-sunshine-yellow shadow-lg"
          style={{ background: "linear-gradient(135deg, #F4D35E, #F4A259)" }}
        >
          <p className="font-baloo text-2xl font-bold text-white text-center"
             style={{ textShadow: "0 2px 4px rgba(0,0,0,0.18)" }}>
            🎉 {child.name}'s Party! 🎉
          </p>
        </div>
        {/* Bunting dots */}
        <div className="flex justify-between mt-1 px-4" aria-hidden="true">
          {["🔴","🟡","🟢","🔵","🟣","🔴","🟡"].map((dot, i) => (
            <span key={i} className="text-xs">{dot}</span>
          ))}
        </div>
      </motion.div>

      {/* Character + cake row */}
      <div className="relative z-10 flex items-end gap-8 justify-center w-full px-4">
        {/* Character */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 22 }}
        >
          <motion.span
            className="text-7xl select-none"
            role="img"
            aria-label={child.favouriteAnimal}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {animalEmoji}
          </motion.span>
        </motion.div>

        {/* Cake */}
        <CakeIllustration
          theme={child.stickerTheme}
          accentColor={cakeTheme.accentColor}
          toppers={cakeTheme.topperEmojis}
        />
      </div>

      {/* Stars burst at bottom */}
      <motion.div
        className="relative z-10 flex gap-3 text-3xl mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        aria-hidden="true"
      >
        {["⭐", "🌟", "✨", "🌟", "⭐"].map((s, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -10, 0], rotate: [0, 15, -15, 0] }}
            transition={{ duration: 1.5, delay: 0.9 + i * 0.12, repeat: Infinity }}
          >
            {s}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
