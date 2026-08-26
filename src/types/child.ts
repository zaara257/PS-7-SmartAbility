// src/types/child.ts
import type { StickerEntry, RewardState } from "./reward";
export type GardenStage =
  | "seed"
  | "sprout"
  | "sapling"
  | "smallTree"
  | "cocoon"
  | "butterfly"
  | "fullTree";

export type StickerTheme = "forest" | "ocean" | "space" | "flowers";

export type FavouriteAnimal =
  | "rabbit"
  | "fox"
  | "owl"
  | "butterfly"
  | "turtle"
  | "bird"
  | "cat"
  | "dog"
  | "unicorn"
  | "dinosaur";

export interface Child {
  id: string;
  name: string;
  age: number;
  favouriteColor: string;
  favouriteAnimal: FavouriteAnimal;
  stickerTheme: StickerTheme;
  culturalInterests: string[];
  gardenStage: GardenStage;
  stickerCount: number;
  badges: string[];
  stickerSheet: StickerEntry[];   // append-only reward log
  rewardState: RewardState;        // tracks last-shown indices to prevent repeats
  createdAt: Date;
}

// Omit id, createdAt, stickerSheet, and rewardState from the new-child form;
// these fields are initialized server-side or on first reward fire.
export type NewChildData = Omit<Child, "id" | "createdAt" | "stickerSheet" | "rewardState">;
