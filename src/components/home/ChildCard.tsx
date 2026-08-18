import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Child } from "../../types/child";
import GardenIllustration from "../ui/GardenIllustration";

interface ChildCardProps {
  child: Child;
}

const stageLabels: Record<Child["gardenStage"], string> = {
  seed:      "🌱 Seed",
  sprout:    "🌿 Sprout",
  sapling:   "🌳 Sapling",
  smallTree: "🌲 Small Tree",
  cocoon:    "🫘 Cocoon",
  butterfly: "🦋 Butterfly",
  fullTree:  "🌳 Full Garden",
};

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ChildCard({ child }: ChildCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate(`/child/${child.id}`)}
      aria-label={`Open ${child.name}'s garden`}
      initial={reduced ? {} : { opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={reduced ? {} : { scale: 1.04, y: -4 }}
      whileTap={reduced ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="
        w-full text-left bg-white/85 backdrop-blur-sm
        rounded-3xl shadow-lg shadow-soil-brown/10
        border border-white/70 overflow-hidden
        focus:outline-none focus:ring-4 focus:ring-forest-green/30
        cursor-pointer group
      "
    >
      {/* Color accent stripe using child's favourite color */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: child.favouriteColor }}
      />

      {/* Garden illustration */}
      <div className="flex justify-center pt-5 pb-2 bg-gradient-to-b from-sky-blue/10 to-transparent">
        <GardenIllustration stage={child.gardenStage} className="w-24 h-24" />
      </div>

      {/* Info section */}
      <div className="px-4 pb-5">
        <h3 className="font-baloo text-lg font-bold text-bark-brown text-center">
          {child.name}
        </h3>
        <p className="text-xs font-fredoka text-soil-brown/70 text-center mb-3">
          {stageLabels[child.gardenStage]}
        </p>

        {/* Stats row */}
        <div className="flex justify-around border-t border-leaf-green/20 pt-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl">⭐</span>
            <span className="text-xs font-fredoka font-semibold text-bark-brown">
              {child.stickerCount}
            </span>
            <span className="text-[10px] font-fredoka text-soil-brown/50">stickers</span>
          </div>
          <div className="w-px bg-leaf-green/20" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl">🏅</span>
            <span className="text-xs font-fredoka font-semibold text-bark-brown">
              {child.badges.length}
            </span>
            <span className="text-[10px] font-fredoka text-soil-brown/50">badges</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
