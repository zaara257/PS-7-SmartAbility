// src/constants/cakeThemes.ts
// Mapping from stickerTheme → cake decoration style for Level 5 (Party scene).
// TODO: review mapping — all entries below are placeholder for functional testing.
// Replace topperEmojis and label with final art-directed choices before production.

import type { StickerTheme } from "../types/child";

export interface CakeThemeDef {
  topperEmojis: string[];  // decorative topper emojis layered on the cake
  accentColor: string;     // CSS color for the cake tier accent
  label: string;           // short description for aria / alt text
}

export const CAKE_THEMES: Record<StickerTheme, CakeThemeDef> = {
  forest: {
    topperEmojis: ["🍃", "🍄", "🌿", "🌰"],  // TODO: review
    accentColor: "#4A7C59",
    label: "forest leaf and mushroom cake",
  },
  ocean: {
    topperEmojis: ["🐚", "🐠", "🌊", "⭐"],  // TODO: review
    accentColor: "#A8DADC",
    label: "ocean shell and fish cake",
  },
  space: {
    topperEmojis: ["⭐", "🌙", "🪐", "🚀"],  // TODO: review
    accentColor: "#7C6FA0",
    label: "space star and moon cake",
  },
  flowers: {
    topperEmojis: ["🌸", "🌺", "🌼", "🌻"],  // TODO: review
    accentColor: "#F2A6B0",
    label: "flower blossom cake",
  },
};
