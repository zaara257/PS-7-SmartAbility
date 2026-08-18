// src/components/home/EmptyState.tsx
import { motion } from "framer-motion";
import Button from "../ui/Button";

interface EmptyStateProps {
  onAddChild: () => void;
}

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Simple garden empty-state illustration
function EmptyGardenSVG() {
  return (
    <svg viewBox="0 0 280 200" className="w-60 h-44" aria-hidden="true">
      {/* Ground */}
      <ellipse cx="140" cy="170" rx="120" ry="22" fill="#8B6247" opacity="0.2" />
      <path d="M20 165 Q140 145 260 165 L260 200 L20 200Z" fill="#7FB069" opacity="0.35" />

      {/* Empty soil patch */}
      <ellipse cx="140" cy="158" rx="50" ry="14" fill="#6B4A3D" opacity="0.6" />
      <ellipse cx="140" cy="152" rx="38" ry="10" fill="#8B6247" opacity="0.5" />

      {/* Small seed */}
      <ellipse cx="140" cy="148" rx="10" ry="7" fill="#6B4A3D" />
      <ellipse cx="140" cy="145" rx="7" ry="5" fill="#8B6247" />

      {/* Watering can */}
      <g transform="translate(190, 100)">
        <rect x="0" y="20" width="35" height="22" rx="6" fill="#A8DADC" />
        <path d="M35 28 Q50 22 52 28 Q54 34 52 38 L35 34Z" fill="#A8DADC" />
        {/* spout drops */}
        {[0,6,12].map((dx, i) => (
          <ellipse key={i} cx={50+dx} cy={42+i*6} rx="2" ry="3" fill="#A8DADC" opacity={0.7 - i * 0.2} />
        ))}
        <path d="M10 20 Q8 8 18 4 Q28 0 30 20" stroke="#A8DADC" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>

      {/* Friendly sun */}
      <circle cx="50" cy="45" r="22" fill="#F4D35E" opacity="0.7" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line
          key={i}
          x1={50 + Math.cos(deg * Math.PI/180) * 26}
          y1={45 + Math.sin(deg * Math.PI/180) * 26}
          x2={50 + Math.cos(deg * Math.PI/180) * 33}
          y2={45 + Math.sin(deg * Math.PI/180) * 33}
          stroke="#F4D35E" strokeWidth="3" strokeLinecap="round" opacity="0.7"
        />
      ))}

      {/* Clouds */}
      <ellipse cx="220" cy="35" rx="28" ry="14" fill="white" opacity="0.7" />
      <ellipse cx="205" cy="40" rx="18" ry="12" fill="white" opacity="0.7" />
      <ellipse cx="235" cy="40" rx="18" ry="12" fill="white" opacity="0.7" />

      {/* Question mark sprout */}
      <text x="135" y="130" fontSize="28" fontFamily="Fredoka" fill="#7FB069" opacity="0.5" textAnchor="middle">?</text>
    </svg>
  );
}

export default function EmptyState({ onAddChild }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          animate={reduced ? {} : { y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <EmptyGardenSVG />
        </motion.div>

        <h2 className="font-baloo text-2xl font-bold text-bark-brown mt-4 mb-2">
          Your garden is waiting!
        </h2>
        <p className="font-fredoka text-soil-brown/70 text-base mb-6 max-w-xs mx-auto leading-relaxed">
          Plant your first garden — add a child and watch their world grow 🌱
        </p>

        <Button
          variant="primary"
          size="lg"
          onClick={onAddChild}
          id="empty-state-add-child"
        >
          🌱 Plant Your First Garden
        </Button>
      </motion.div>
    </div>
  );
}
