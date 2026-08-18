import { useState } from "react";
import type { KeyboardEvent } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter…",
}: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && input === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div
      className="
        flex flex-wrap gap-2 p-3 min-h-[56px] rounded-2xl
        border-2 border-leaf-green/30 bg-white/70
        focus-within:border-forest-green focus-within:ring-2 focus-within:ring-forest-green/20
        transition-all duration-200 cursor-text
      "
      onClick={() => document.getElementById("tag-input-field")?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="
            flex items-center gap-1 px-3 py-1 rounded-full
            bg-leaf-green/20 text-forest-green font-fredoka text-sm
            border border-leaf-green/40
          "
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
            className="text-forest-green/60 hover:text-forest-green ml-1 leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        id="tag-input-field"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={addTag}
        placeholder={value.length === 0 ? placeholder : ""}
        className="
          flex-1 min-w-[120px] bg-transparent font-fredoka text-bark-brown
          placeholder-soil-brown/40 focus:outline-none text-sm
        "
      />
    </div>
  );
}
