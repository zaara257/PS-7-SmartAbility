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
      whileHover={
        reduced
          ? {}
          : {
              scale: 1.04,
              y: -5,
              boxShadow: "0 18px 30px -8px rgba(107, 74, 61, 0.18)",
            }
      }
      whileTap={reduced ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
      className="
        w-full text-left bg-white/90 backdrop-blur-sm
        rounded-3xl shadow-md shadow-soil-brown/10
        border-2 border-leaf-green/25 overflow-hidden
        focus:outline-none focus:ring-4 focus:ring-forest-green/30
        cursor-pointer group relative
      "
    >
      {/* Color accent stripe using child's favourite color */}
      <div
        className="h-2.5 w-full"
        style={{ backgroundColor: child.favouriteColor }}
      />

      {/* Garden plot illustration area with soft sky & soil ground base */}
      <div className="relative flex flex-col items-center justify-center pt-5 pb-3 bg-gradient-to-b from-sky-blue/20 via-leaf-green/10 to-soil-brown/15 overflow-hidden">
        <GardenIllustration stage={child.gardenStage} className="w-24 h-24 relative z-10 filter drop-shadow-xs group-hover:scale-105 transition-transform duration-200" />
        
        {/* Soft grounded grass & soil plot base */}
        <div 
          className="w-22 h-3.5 -mt-2 rounded-full bg-gradient-to-r from-leaf-green/40 via-soil-brown/30 to-leaf-green/40 blur-[0.5px] opacity-85 relative z-0" 
          aria-hidden="true" 
        />
      </div>

      {/* Info section */}
      <div className="px-4 pb-5 pt-2 flex flex-col items-center">
        <h3 className="font-baloo text-lg font-bold text-bark-brown text-center leading-tight">
          {child.name}
        </h3>
        
        {/* Rounded stage pill with soft background */}
        <div className="mt-1 mb-3">
          <span className="text-[11px] font-fredoka font-semibold text-forest-green bg-leaf-green/15 px-2.5 py-0.5 rounded-full inline-block shadow-2xs">
            {stageLabels[child.gardenStage]}
          </span>
        </div>

        {/* Stats row with soft chips */}
        <div className="flex justify-around items-center w-full border-t border-leaf-green/20 pt-3">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg leading-none">⭐</span>
            <span className="text-xs font-fredoka font-bold text-bark-brown">
              {child.stickerCount}
            </span>
            <span className="text-[10px] font-fredoka text-soil-brown/60">stickers</span>
          </div>
          <div className="w-px h-6 bg-leaf-green/25" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg leading-none">🏅</span>
            <span className="text-xs font-fredoka font-bold text-bark-brown">
              {child.badges.length}
            </span>
            <span className="text-[10px] font-fredoka text-soil-brown/60">badges</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
