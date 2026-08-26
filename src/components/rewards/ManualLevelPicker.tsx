// src/components/rewards/ManualLevelPicker.tsx
// Dev/therapist affordance — 5 buttons that trigger a level reward.
// Intentionally simple (no Framer Motion flourish) — this is parent-facing,
// not child-facing. Disabled while a reward is playing.

interface ManualLevelPickerProps {
  onSelect: (level: 1 | 2 | 3 | 4 | 5) => void;
  disabled?: boolean;
}

const LEVELS = [
  { level: 1 as const, emoji: "🔖", label: "Stamp",     subtitle: "2s" },
  { level: 2 as const, emoji: "🎈", label: "Confetti",  subtitle: "4s" },
  { level: 3 as const, emoji: "🐾", label: "Character", subtitle: "7s" },
  { level: 4 as const, emoji: "📜", label: "Rhyme",     subtitle: "10s" },
  { level: 5 as const, emoji: "🎂", label: "Party",     subtitle: "15s" },
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
            onClick={() => onSelect(level)}
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
