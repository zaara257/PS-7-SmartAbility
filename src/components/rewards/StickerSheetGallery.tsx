// src/components/rewards/StickerSheetGallery.tsx
// Chronological gallery of all past rewards for a child.
// Supports both v1 (generated) and v2 (video/interactive) sticker entries.

import { motion } from "framer-motion";
import type { StickerEntry } from "../../types/reward";

interface StickerSheetGalleryProps {
  entries: StickerEntry[];
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const LEVEL_LABELS: Record<number, string> = {
  1: "Stamp",
  2: "Cheer",
  3: "Character",
  4: "Rhyme",
  5: "Party!",
};

const LEVEL_COLORS: Record<number, string> = {
  1: "#7FB069",
  2: "#A8DADC",
  3: "#F4A259",
  4: "#F4D35E",
  5: "#F2A6B0",
};

function StampCard({ entry }: { entry: StickerEntry }) {
  const p = entry.payload;
  // Render v1 emoji if present, else fallback to a pretty stamp ticket emoji
  const emoji = String(p.emoji ?? "🎟️");
  const label = String(p.label ?? "Stamp reward");
  const categoryText = p.category ? ` (${String(p.category)})` : "";

  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl" role="img" aria-label={label}>{emoji}</span>
      <div>
        <p className="font-fredoka text-bark-brown font-semibold text-sm">
          {label}
          <span className="text-xs text-soil-brown/50 font-normal capitalize ml-1">{categoryText}</span>
        </p>
        <p className="font-fredoka text-soil-brown/50 text-xs">{formatTime(entry.timestamp)}</p>
      </div>
    </div>
  );
}

function ConfettiCard({ entry }: { entry: StickerEntry }) {
  const color = String(entry.payload.color ?? "#7FB069");
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-8 h-8 rounded-full border-2 border-white/60 shadow-sm flex-shrink-0"
        style={{ background: color }}
        aria-label="confetti color swatch"
      />
      <div>
        <p className="font-fredoka text-bark-brown font-semibold text-sm">Cheer burst!</p>
        <p className="font-fredoka text-soil-brown/50 text-xs">{formatTime(entry.timestamp)}</p>
      </div>
      <span className="text-xl ml-auto" aria-hidden="true">🎈</span>
    </div>
  );
}

function QuoteCard({ entry }: { entry: StickerEntry }) {
  const p = entry.payload;
  
  // Handing v2 character video entries
  if (p.videoSrc) {
    const label = String(p.label ?? "Character reward");
    return (
      <div className="flex items-center gap-3">
        <span className="text-3xl flex-shrink-0" role="img" aria-label={label}>🐾</span>
        <div>
          <p className="font-fredoka text-bark-brown font-semibold text-sm">
            {label}
          </p>
          <p className="font-fredoka text-soil-brown/50 text-xs">{formatTime(entry.timestamp)}</p>
        </div>
        <span className="text-xl ml-auto" aria-hidden="true">🎬</span>
      </div>
    );
  }

  // Handling v1 text/quote entries
  const ANIMAL_EMOJI: Record<string, string> = {
    rabbit: "🐰", fox: "🦊", owl: "🦉", butterfly: "🦋", turtle: "🐢",
    bird: "🐦", cat: "🐱", dog: "🐶", unicorn: "🦄", dinosaur: "🦕",
  };
  const emoji = ANIMAL_EMOJI[String(p.animal)] ?? "🐾";
  const line = String(p.line ?? "");

  return (
    <div className="flex items-start gap-3">
      <span className="text-3xl flex-shrink-0" role="img" aria-label={String(p.animal)}>{emoji}</span>
      <div className="min-w-0">
        <p className="font-fredoka text-bark-brown font-semibold text-sm capitalize">{String(p.animal)} said:</p>
        <p className="font-fredoka text-soil-brown/70 text-xs leading-snug line-clamp-2">{line}</p>
        <p className="font-fredoka text-soil-brown/40 text-xs mt-0.5">{formatTime(entry.timestamp)}</p>
      </div>
    </div>
  );
}

function RhymeCard({ entry }: { entry: StickerEntry }) {
  const p = entry.payload;
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl" role="img" aria-label="rhyme">{String(p.emoji ?? "📜")}</span>
      <div>
        <p className="font-fredoka text-bark-brown font-semibold text-sm">Rhyme time!</p>
        <p className="font-fredoka text-soil-brown/50 text-xs">{formatTime(entry.timestamp)}</p>
      </div>
      <span className="text-xl ml-auto" aria-hidden="true">🎶</span>
    </div>
  );
}

function PartyCard({ entry }: { entry: StickerEntry }) {
  const p = entry.payload;
  const isGame = p.completedGame ? "Cake Slice Game" : `${String(p.theme)} theme`;

  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl" aria-hidden="true">🎂</span>
      <div>
        <p className="font-fredoka text-bark-brown font-semibold text-sm">
          Party time! <span className="text-xs font-normal capitalize">{isGame}</span>
        </p>
        <p className="font-fredoka text-soil-brown/50 text-xs">{formatTime(entry.timestamp)}</p>
      </div>
      <span className="text-xl ml-auto" aria-hidden="true">🎉</span>
    </div>
  );
}

function StickerCard({ entry, index }: { entry: StickerEntry; index: number }) {
  const accentColor = LEVEL_COLORS[entry.level] ?? "#7FB069";

  return (
    <motion.div
      key={entry.id}
      className="bg-white/80 rounded-3xl p-4 border-2 shadow-sm"
      style={{ borderColor: accentColor + "50" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      {/* Level badge */}
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-fredoka font-semibold text-white mb-2"
        style={{ background: accentColor }}
      >
        Lv {entry.level} — {LEVEL_LABELS[entry.level]}
      </div>

      {/* Type-specific content */}
      {entry.type === "stamp"     && <StampCard    entry={entry} />}
      {entry.type === "confetti"  && <ConfettiCard  entry={entry} />}
      {entry.type === "quoteCard" && <QuoteCard    entry={entry} />}
      {entry.type === "rhyme"     && <RhymeCard    entry={entry} />}
      {entry.type === "party"     && <PartyCard    entry={entry} />}
    </motion.div>
  );
}

export default function StickerSheetGallery({ entries }: StickerSheetGalleryProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-5xl" aria-hidden="true">🌱</span>
        <p className="font-fredoka text-soil-brown/60 text-base">
          No stickers yet — trigger a reward to start!
        </p>
      </div>
    );
  }

  // Show newest first
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((entry, i) => (
        <StickerCard key={entry.id} entry={entry} index={i} />
      ))}
    </div>
  );
}
