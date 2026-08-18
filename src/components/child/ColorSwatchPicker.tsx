// src/components/child/ColorSwatchPicker.tsx
interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const COLORS = [
  { label: "Forest Green",  hex: "#4A7C59" },
  { label: "Leaf Green",    hex: "#7FB069" },
  { label: "Sky Blue",      hex: "#A8DADC" },
  { label: "Sunshine Yellow", hex: "#F4D35E" },
  { label: "Flower Pink",   hex: "#F2A6B0" },
  { label: "Flower Orange", hex: "#F4A259" },
  { label: "Flower Purple", hex: "#B784A7" },
  { label: "Ocean Blue",    hex: "#4ECDC4" },
  { label: "Coral",         hex: "#FF6B6B" },
  { label: "Lavender",      hex: "#C9B8E8" },
  { label: "Peach",         hex: "#FFB347" },
  { label: "Mint",          hex: "#98D8C8" },
];

export default function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Favourite colour">
      {COLORS.map(({ label, hex }) => (
        <button
          key={hex}
          type="button"
          title={label}
          aria-label={label}
          aria-checked={value === hex}
          role="radio"
          onClick={() => onChange(hex)}
          style={{ backgroundColor: hex }}
          className={`
            w-9 h-9 rounded-full transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-forest-green/30
            ${value === hex
              ? "ring-4 ring-offset-2 ring-bark-brown scale-110 shadow-lg"
              : "hover:scale-110 hover:shadow-md opacity-80 hover:opacity-100"
            }
          `}
        />
      ))}
    </div>
  );
}
