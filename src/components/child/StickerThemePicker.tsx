import type { StickerTheme } from "../../types/child";

interface StickerThemePickerProps {
  value: StickerTheme | "";
  onChange: (theme: StickerTheme) => void;
}

const THEMES: { id: StickerTheme; label: string; emoji: string; description: string }[] = [
  { id: "forest",  label: "Forest",  emoji: "🌲", description: "Trees, mushrooms & woodland friends" },
  { id: "ocean",   label: "Ocean",   emoji: "🌊", description: "Waves, fish & sea creatures" },
  { id: "space",   label: "Space",   emoji: "🚀", description: "Rockets, stars & planets" },
  { id: "flowers", label: "Flowers", emoji: "🌸", description: "Blooms, butterflies & gardens" },
];

export default function StickerThemePicker({ value, onChange }: StickerThemePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Sticker theme">
      {THEMES.map(({ id, label, emoji, description }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={`
            flex flex-col items-center gap-2 p-4 rounded-2xl
            border-2 text-left transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-forest-green/30
            ${value === id
              ? "border-forest-green bg-forest-green/10 shadow-md"
              : "border-transparent bg-white/60 hover:border-leaf-green/50 hover:bg-leaf-green/5"
            }
          `}
        >
          <span className="text-3xl" aria-hidden="true">{emoji}</span>
          <span className="font-baloo font-bold text-bark-brown text-sm">{label}</span>
          <span className="text-xs font-fredoka text-soil-brown/70 text-center leading-tight">{description}</span>
        </button>
      ))}
    </div>
  );
}
