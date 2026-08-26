// src/types/reward.ts

export type RewardLevel = 1 | 2 | 3 | 4 | 5;

export type StickerType = "stamp" | "confetti" | "quoteCard" | "rhyme" | "party";

export interface StickerEntry {
  id: string;
  level: RewardLevel;
  type: StickerType;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface RewardState {
  lastStampIndex: number | null;
  lastConfettiVariant: number | null;
  lastCharacterLineIndex: number | null;
  lastRhymeIndex: number | null;
}
