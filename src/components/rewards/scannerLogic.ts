import type { RewardLevel } from "../../types/reward";

export const SCANNER_CONFIG = {
  minConfidence: 0.8,
  minMargin: 0.12,
  windowSize: 12,
  minVoteRatio: 0.75,
  cooldownMs: 2000,
  writtenInputSize: 64,
  guideInsetRatio: 0.12,
} as const;

/** Active production gesture-v2 order: thumbs-up, V, OK, fist, background. */
export const GESTURE_LABELS = ["1", "2", "3", "4", "background"] as const;
/** Retained only for the explicit legacy-model rollback profile. */
export const LEGACY_GESTURE_LABELS = ["1", "2", "3", "4", "5", "background"] as const;
export const GESTURE_V2_REWARD_LEVELS = [1, 2, 3, 4] as const;
export const ALL_REWARD_LEVELS = [1, 2, 3, 4, 5] as const;
export const WRITTEN_DIGIT_LABELS = ["1", "2", "3", "4", "5", "background", "unclear"] as const;
export const MNIST_WRITTEN_DIGIT_LABELS = ["1", "2", "3", "4", "5"] as const;

export const MNIST_WRITTEN_SCORE_CONFIG = {
  minConfidence: 0.7,
  minMargin: SCANNER_CONFIG.minMargin,
} as const;

export type ScannerMode = "gesture" | "written";
export type FrameDecision =
  | { kind: "candidate"; level: RewardLevel; confidence: number; margin: number }
  | { kind: "background" }
  | { kind: "unclear" }
  | { kind: "uncertain"; confidence: number; margin: number };

type ScoreThresholds = {
  minConfidence: number;
  minMargin: number;
};

/** Converts a custom model's ordered output scores into a safe scanner decision. */
export function evaluateScores(
  labels: readonly string[],
  scores: readonly number[],
  thresholds: ScoreThresholds = SCANNER_CONFIG,
): FrameDecision {
  const ranked = scores
    .map((probability, index) => ({ label: labels[index] ?? "unknown", probability }))
    .sort((first, second) => second.probability - first.probability);
  const top = ranked[0];
  const runnerUp = ranked[1];

  if (!top || !Number.isFinite(top.probability)) {
    return { kind: "uncertain", confidence: 0, margin: 0 };
  }

  if (top.label === "background") return { kind: "background" };
  if (top.label === "unclear") return { kind: "unclear" };

  const level = Number(top.label);
  const margin = top.probability - (runnerUp?.probability ?? 0);
  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 5 ||
    top.probability < thresholds.minConfidence ||
    margin < thresholds.minMargin
  ) {
    return { kind: "uncertain", confidence: top.probability, margin };
  }

  return { kind: "candidate", level: level as RewardLevel, confidence: top.probability, margin };
}

export function addVote(window: Array<RewardLevel | null>, vote: RewardLevel | null): Array<RewardLevel | null> {
  return [...window, vote].slice(-SCANNER_CONFIG.windowSize);
}

export function getStableLevel(
  window: Array<RewardLevel | null>,
  supportedLevels: readonly RewardLevel[] = ALL_REWARD_LEVELS,
): RewardLevel | null {
  const minimumVotes = Math.ceil(SCANNER_CONFIG.windowSize * SCANNER_CONFIG.minVoteRatio);
  if (window.length < minimumVotes) return null;

  for (const level of supportedLevels) {
    const votes = window.filter((vote) => vote === level).length;
    if (votes >= minimumVotes && votes / window.length >= SCANNER_CONFIG.minVoteRatio) return level;
  }

  return null;
}

/** Shared duplicate/cooldown guard used before invoking a reward callback. */
export function canTriggerReward(
  stableLevel: RewardLevel | null,
  hasAlreadyTriggered: boolean,
  cooldownUntil: number,
  now: number,
): stableLevel is RewardLevel {
  return stableLevel !== null && !hasAlreadyTriggered && now >= cooldownUntil;
}

/** Normalizes 21 MediaPipe landmarks around the wrist and palm size. */
export function normalizeHandLandmarks(landmarks: ReadonlyArray<{ x: number; y: number; z: number }>): number[] | null {
  if (landmarks.length !== 21) return null;

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const scale = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y, middleMcp.z - wrist.z);
  if (!Number.isFinite(scale) || scale < 0.0001) return null;

  return landmarks.flatMap((landmark) => [
    (landmark.x - wrist.x) / scale,
    (landmark.y - wrist.y) / scale,
    (landmark.z - wrist.z) / scale,
  ]);
}
