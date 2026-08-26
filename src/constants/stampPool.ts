// src/constants/stampPool.ts
// Shared stamp pool with theme weighting.
// "themes" lists which stickerThemes give this stamp extra weight in the random pick.
// v1: single shared pool — useNonRepeatingPick picks from all 10, with theme-weighted
// ordering pushing thematic stamps to the front. Flagged for art direction review.

import type { StickerTheme } from "../types/child";

export interface StampDef {
  id: string;
  emoji: string;
  label: string;
  themes: StickerTheme[];
}

// prettier-ignore
export const STAMP_POOL: StampDef[] = [
  // Forest-weighted
  { id: "mushroom",  emoji: "🍄",  label: "Mushroom",    themes: ["forest"] },
  { id: "leaf",      emoji: "🍃",  label: "Leaf",        themes: ["forest", "flowers"] },
  { id: "acorn",     emoji: "🌰",  label: "Acorn",       themes: ["forest"] },
  { id: "hedgehog",  emoji: "🦔",  label: "Hedgehog",    themes: ["forest"] },
  // Ocean-weighted
  { id: "shell",     emoji: "🐚",  label: "Shell",       themes: ["ocean"] },
  { id: "fish",      emoji: "🐠",  label: "Fish",        themes: ["ocean"] },
  { id: "wave",      emoji: "🌊",  label: "Wave",        themes: ["ocean"] },
  // Space-weighted
  { id: "star",      emoji: "⭐",  label: "Star",        themes: ["space", "forest"] },
  { id: "moon",      emoji: "🌙",  label: "Moon",        themes: ["space"] },
  // Flowers-weighted
  { id: "blossom",   emoji: "🌸",  label: "Blossom",     themes: ["flowers", "forest"] },
];

/**
 * Returns a pool sorted so theme-matching stamps come first,
 * without removing any stamps (so all 10 are always reachable).
 */
export function getSortedPool(theme: StickerTheme): StampDef[] {
  return [
    ...STAMP_POOL.filter((s) => s.themes.includes(theme)),
    ...STAMP_POOL.filter((s) => !s.themes.includes(theme)),
  ];
}
