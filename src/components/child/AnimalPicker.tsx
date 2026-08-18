import type { FavouriteAnimal } from "../../types/child";


interface AnimalPickerProps {
  value: FavouriteAnimal | "";
  onChange: (animal: FavouriteAnimal) => void;
}

const ANIMALS: { id: FavouriteAnimal; label: string; emoji: string }[] = [
  { id: "rabbit",    label: "Rabbit",    emoji: "🐰" },
  { id: "fox",       label: "Fox",       emoji: "🦊" },
  { id: "owl",       label: "Owl",       emoji: "🦉" },
  { id: "butterfly", label: "Butterfly", emoji: "🦋" },
  { id: "turtle",    label: "Turtle",    emoji: "🐢" },
  { id: "bird",      label: "Bird",      emoji: "🐦" },
  { id: "cat",       label: "Cat",       emoji: "🐱" },
  { id: "dog",       label: "Dog",       emoji: "🐶" },
  { id: "unicorn",   label: "Unicorn",   emoji: "🦄" },
  { id: "dinosaur",  label: "Dinosaur",  emoji: "🦕" },
];

export default function AnimalPicker({ value, onChange }: AnimalPickerProps) {
  return (
    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Favourite animal">
      {ANIMALS.map(({ id, label, emoji }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          aria-label={label}
          onClick={() => onChange(id)}
          className={`
            flex flex-col items-center gap-1 p-2 rounded-2xl
            border-2 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-forest-green/30
            ${value === id
              ? "border-forest-green bg-leaf-green/20 scale-105 shadow-md"
              : "border-transparent bg-white/60 hover:border-leaf-green/50 hover:bg-leaf-green/10 hover:scale-105"
            }
          `}
        >
          <span className="text-2xl leading-none" aria-hidden="true">{emoji}</span>
          <span className="text-xs font-fredoka text-bark-brown font-semibold">{label}</span>
        </button>
      ))}
    </div>
  );
}
