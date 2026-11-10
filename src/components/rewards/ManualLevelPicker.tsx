// src/components/rewards/ManualLevelPicker.tsx
// Dev/therapist affordance — 5 buttons that trigger a level video reward.
// Intentionally simple (no Framer Motion flourish) — this is parent-facing,
// not child-facing. Disabled while a reward is playing.

import type { RewardLevel } from "../../types/reward";
import { primeAudio } from "../../utils/audioUnlocker";

interface ManualLevelPickerProps {
  onSelect: (level: RewardLevel) => void;
  disabled?: boolean;
}

const LEVELS = [
  { level: 1 as const, emoji: "🎉", label: "Level 1", subtitle: "Video" },
  { level: 2 as const, emoji: "✨", label: "Level 2", subtitle: "Video" },
  { level: 3 as const, emoji: "🌟", label: "Level 3", subtitle: "Video" },
  { level: 4 as const, emoji: "🎊", label: "Level 4", subtitle: "Video" },
  { level: 5 as const, emoji: "🏆", label: "Level 5", subtitle: "Video" },
];

export default function ManualLevelPicker({ onSelect, disabled = false }: ManualLevelPickerProps) {
  return (
    <div className="w-full">
      {/* Section label — parent-facing affordance, subdued styling */}
      <p className="font-fredoka text-xs text-soil-brown/50 uppercase tracking-widest mb-3 text-center">
        Award a Reward
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {LEVELS.map(({ level, emoji, label, subtitle }) => (
          <button
            key={level}
            id={`level-picker-${level}`}
            onClick={() => {
              primeAudio();
              onSelect(level);
            }}
            disabled={disabled}
            aria-label={`Trigger Level ${level} reward (${label})`}
            className={`
              flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl
              border-2 border-leaf-green/30 bg-white/70
              font-fredoka text-bark-brown text-sm
              transition-all duration-150
              ${disabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:border-forest-green hover:bg-leaf-green/10 hover:shadow-sm active:scale-95"
              }
            `}
          >
            <span className="text-xl">{emoji}</span>
            <span className="font-semibold text-xs">{label}</span>
            <span className="text-soil-brown/40 text-xs">{subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
