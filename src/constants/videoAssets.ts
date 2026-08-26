// src/constants/videoAssets.ts
import type { StickerTheme } from "../types/child";

export interface VideoDef {
  filename: string;
  label: string;
  category: string;
}

// Helper to generate numbered lists
const makeNumberedStamps = (category: string, count: number = 10): VideoDef[] => {
  return Array.from({ length: count }, (_, i) => {
    const num = i + 1;
    // Special handling for food(8) which is spelled "foodd(8).mp4" in the folder
    const filename = (category === "food" && num === 8)
      ? "foodd(8).mp4"
      : `${category}(${num}).mp4`;
    
    // Friendly readable label
    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    return {
      filename,
      label: `${formattedCategory} Stamp #${num}`,
      category,
    };
  });
};

// All available stamp categories
export const STAMP_CATEGORIES = [
  "superhero",
  "transport",
  "princess",
  "food",
  "fruit",
  "fantasy",
  "candy",
  "animal",
];

// Flat list of all 80 stamp videos
export const STAMP_VIDEOS: VideoDef[] = STAMP_CATEGORIES.flatMap((cat) => makeNumberedStamps(cat, 10));

// Mapping child theme to relevant categories
export const THEME_STAMP_MAPPING: Record<StickerTheme, string[]> = {
  forest: ["animal", "fruit"],
  ocean: ["fantasy", "transport"],
  space: ["superhero", "candy"],
  flowers: ["princess", "food"],
};

/**
 * Returns stamp videos that align with the child's theme.
 * Reverts to all stamps as fallback.
 */
export function getStampVideosForTheme(theme: StickerTheme): VideoDef[] {
  const categories = THEME_STAMP_MAPPING[theme] ?? [];
  const matches = STAMP_VIDEOS.filter((v) => categories.includes(v.category));
  return matches.length > 0 ? matches : STAMP_VIDEOS;
}

// Character videos (pre-defined list)
export const CHARACTER_VIDEOS: VideoDef[] = [
  { filename: "briyani.mp4", label: "Biryani Chef", category: "food" },
  { filename: "cake.mp4", label: "Happy Birthday Cake", category: "celebration" },
  { filename: "chhotabheem.mp4", label: "Chhota Bheem Power", category: "cartoon" },
  { filename: "chocolate.mp4", label: "Sweet Chocolates", category: "sweet" },
  { filename: "dora.mp4", label: "Dora the Explorer", category: "cartoon" },
  { filename: "doraemon.mp4", label: "Doraemon Magic Pocket", category: "cartoon" },
  { filename: "elephant.mp4", label: "Jolly Elephant", category: "animal" },
  { filename: "fries.mp4", label: "Crispy Fries", category: "food" },
  { filename: "ice cream.mp4", label: "Ice Cream Cone", category: "sweet" },
  { filename: "kitten.mp4", label: "Playful Kitten", category: "animal" },
  { filename: "lamb.mp4", label: "Little Lamb", category: "animal" },
  { filename: "ninja hattori.mp4", label: "Ninja Hattori Run", category: "cartoon" },
  { filename: "penguin.mp4", label: "Happy Penguin", category: "animal" },
  { filename: "peppapig.mp4", label: "Peppa Pig Splash", category: "cartoon" },
  { filename: "puppy.mp4", label: "Wagging Puppy", category: "animal" },
];
