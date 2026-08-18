// src/components/home/AddChildCard.tsx
import { motion } from "framer-motion";

interface AddChildCardProps {
  onClick: () => void;
}

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function AddChildCard({ onClick }: AddChildCardProps) {
  return (
    <motion.button
      onClick={onClick}
      id="add-child-card"
      aria-label="Add a new child"
      whileHover={reduced ? {} : { scale: 1.04, y: -4 }}
      whileTap={reduced ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="
        w-full h-full min-h-[220px]
        border-2 border-dashed border-leaf-green/50
        rounded-3xl bg-white/50 backdrop-blur-sm
        flex flex-col items-center justify-center gap-3
        text-forest-green hover:border-forest-green hover:bg-white/70
        focus:outline-none focus:ring-4 focus:ring-forest-green/30
        transition-colors duration-200 cursor-pointer group
      "
    >
      <motion.div
        whileHover={reduced ? {} : { rotate: 90 }}
        transition={{ type: "spring", stiffness: 400, damping: 12 }}
        className="
          w-14 h-14 rounded-full
          bg-forest-green/10 group-hover:bg-forest-green/20
          flex items-center justify-center
          text-3xl text-forest-green
          transition-colors duration-200
        "
      >
        +
      </motion.div>
      <span className="font-baloo font-bold text-forest-green text-base">
        Add a Child
      </span>
      <span className="font-fredoka text-sm text-soil-brown/60 text-center px-4">
        Plant a new garden 🌱
      </span>
    </motion.button>
  );
}
