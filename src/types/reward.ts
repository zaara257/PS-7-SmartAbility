// src/types/reward.ts

export type RewardLevel = 1 | 2 | 3 | 4 | 5;

export type StickerType = "video" | "stamp" | "confetti" | "quoteCard" | "rhyme" | "party";

export interface VideoStickerPayload {
  level: RewardLevel;
  videoSrc: string;
}

export interface StickerEntry {
  id: string;
  level: RewardLevel;
  type: StickerType;
  payload: VideoStickerPayload | Record<string, unknown>;
  timestamp: number;
}

export interface RewardState {
  lastVideoIndexByLevel: {
    1: number | null;
    2: number | null;
    3: number | null;
    4: number | null;
    5: number | null;
  };
}
