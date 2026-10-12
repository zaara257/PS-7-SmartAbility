/** Development-only contract for the isolated five-output gesture-v2 model. */

export const PROTOTYPE_GESTURE_LABELS = ["1", "2", "3", "4", "background"] as const;
export type PrototypeGestureLabel = (typeof PROTOTYPE_GESTURE_LABELS)[number];
export type PrototypeRewardLevel = 1 | 2 | 3 | 4;

export const PROTOTYPE_GESTURE_CONFIG = {
  minConfidence: 0.8,
  minMargin: 0.12,
  windowSize: 12,
  minVoteRatio: 0.75,
} as const;

export type PrototypeFrameResult = {
  scores: number[];
  label: PrototypeGestureLabel;
  confidence: number;
  margin: number;
  candidate: PrototypeRewardLevel | null;
};

export function evaluatePrototypeScores(scores: readonly number[]): PrototypeFrameResult | null {
  if (scores.length !== PROTOTYPE_GESTURE_LABELS.length || scores.some((score) => !Number.isFinite(score))) {
    return null;
  }
  const ranked = scores
    .map((score, index) => ({ score, index }))
    .sort((left, right) => right.score - left.score);
  const top = ranked[0];
  const runnerUp = ranked[1];
  if (!top) return null;

  const label = PROTOTYPE_GESTURE_LABELS[top.index];
  const confidence = top.score;
  const margin = confidence - (runnerUp?.score ?? 0);
  const candidate = label !== "background"
    && confidence >= PROTOTYPE_GESTURE_CONFIG.minConfidence
    && margin >= PROTOTYPE_GESTURE_CONFIG.minMargin
    ? Number(label) as PrototypeRewardLevel
    : null;
  return { scores: [...scores], label, confidence, margin, candidate };
}

export function addPrototypeVote(
  votes: Array<PrototypeRewardLevel | null>,
  vote: PrototypeRewardLevel | null,
): Array<PrototypeRewardLevel | null> {
  return [...votes, vote].slice(-PROTOTYPE_GESTURE_CONFIG.windowSize);
}

export function stablePrototypeLevel(votes: Array<PrototypeRewardLevel | null>): PrototypeRewardLevel | null {
  const minimumVotes = Math.ceil(PROTOTYPE_GESTURE_CONFIG.windowSize * PROTOTYPE_GESTURE_CONFIG.minVoteRatio);
  if (votes.length < minimumVotes) return null;
  for (const level of [1, 2, 3, 4] as const) {
    const count = votes.filter((vote) => vote === level).length;
    if (count >= minimumVotes && count / votes.length >= PROTOTYPE_GESTURE_CONFIG.minVoteRatio) return level;
  }
  return null;
}
