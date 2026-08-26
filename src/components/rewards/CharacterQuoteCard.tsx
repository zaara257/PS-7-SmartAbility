// src/components/rewards/CharacterQuoteCard.tsx
// Level 3 — renders the child's favourite animal + speech bubble with a picked line.
// Character = child.favouriteAnimal (no separate picker — driven by intake data).

import { motion } from "framer-motion";
import type { FavouriteAnimal } from "../../types/child";

// Simple emoji map matching the Add Child animal picker set
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

interface CharacterQuoteCardProps {
  animal: FavouriteAnimal | null;
  line: string | null;
}

export default function CharacterQuoteCard({ animal, line }: CharacterQuoteCardProps) {
  if (!animal || !line) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-10 h-10 border-4 border-forest-green/30 border-t-forest-green rounded-full animate-spin" />
      </div>
    );
  }

  const emoji = ANIMAL_EMOJI[animal];

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
      {/* Speech bubble */}
      <motion.div
        className="relative bg-white/90 rounded-3xl px-6 py-5 shadow-lg border-2 border-leaf-green/30 text-center"
        initial={{ opacity: 0, scale: 0.7, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 22, delay: 0.2 }}
      >
        <p className="font-fredoka text-lg text-bark-brown leading-snug">{line}</p>
        {/* Bubble tail pointing down */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-0 h-0"
          style={{
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "14px solid white",
          }}
          aria-hidden="true"
        />
      </motion.div>

      {/* Character */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: 30, scale: 0.6 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.span
          className="text-8xl select-none"
          role="img"
          aria-label={animal}
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {emoji}
        </motion.span>
        <span className="font-fredoka text-sm text-soil-brown/60 capitalize">{animal}</span>
      </motion.div>
    </div>
  );
}
