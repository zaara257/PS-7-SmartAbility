import type { RewardLevel } from "../../types/reward";

export type ScannerMode = "gesture" | "written";

/**
 * Verified mapping for gesture MLP model (public/models/gesture/model.json):
 * Classes were trained in 1-based sequential order with background as the final class (index 5):
 *   Index 0 -> "1"
 *   Index 1 -> "2"
 *   Index 2 -> "3"
 *   Index 3 -> "4"
 *   Index 4 -> "5"
 *   Index 5 -> "background"
 *
 * Verified via calibration and debug overlay telemetry:
 *   5 fingers -> winning index 4 (label "5")
 *   4 fingers -> winning index 3 (label "4")
 *   3 fingers -> winning index 2 (label "3")
 *   2 fingers -> winning index 1 (label "2")
 *   1 finger  -> winning index 0 (label "1")
 *   Fist/None -> winning index 5 (label "background")
 * This resolves the off-by-one mismatch where index 0 was erroneously assumed to be "background".
 */
export const GESTURE_LABELS: readonly string[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "background",
] as const;

export const MNIST_WRITTEN_DIGIT_LABELS: readonly string[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
] as const;

export interface ModeScannerConfig {
  targetFps: number;
  sampleIntervalMs: number;
  cooldownMs: number;
  minConfidence: number;
  margin: number;
  windowSize: number;
  agreementRatio: number;
  minStableDurationMs: number;
}

export const GESTURE_SCANNER_CONFIG: ModeScannerConfig = {
  targetFps: 15,
  sampleIntervalMs: Math.round(1000 / 15), // ~66ms
  cooldownMs: 2500,
  minConfidence: 0.60,
  margin: 0.10,
  windowSize: 10,
  agreementRatio: 0.70, // 70% of frames in window must agree
  minStableDurationMs: 650, // Must hold for at least 650ms
};

export const MNIST_WRITTEN_SCORE_CONFIG: ModeScannerConfig = {
  targetFps: 12,
  sampleIntervalMs: Math.round(1000 / 12), // ~83ms
  cooldownMs: 2500,
  minConfidence: 0.65,
  margin: 0.12,
  windowSize: 10,
  agreementRatio: 0.70, // 70% of frames in window must agree
  minStableDurationMs: 700, // Must hold for at least 700ms
};

// Backward-compatible alias for existing imports
export const SCANNER_CONFIG = GESTURE_SCANNER_CONFIG;

export type EvaluationDecision =
  | { kind: "candidate"; level: RewardLevel; confidence: number; reason?: string }
  | { kind: "background"; reason?: string }
  | { kind: "unclear"; reason?: string }
  | { kind: "unsure"; reason?: string };

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface GeometricFingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  count: number;
}

export interface HandBoundsCheck {
  ok: boolean;
  reason?: string;
  bbox: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number; area: number };
}

/**
 * Normalizes MediaPipe 21 hand landmarks relative to the wrist (landmark 0)
 * and scales them so that the maximum absolute distance is 1.0.
 * Produces an array of 63 numbers (21 * 3) matching [batch, 63] input.
 * Supports optional handedness mirroring so both hands align with model expectations.
 */
export function normalizeHandLandmarks(
  landmarks: LandmarkPoint[],
  mirrorX = false
): number[] {
  if (!landmarks || landmarks.length !== 21) {
    return new Array(63).fill(0);
  }

  const wrist = landmarks[0];
  const relativeCoords: number[] = [];

  for (const pt of landmarks) {
    const rawDx = pt.x - wrist.x;
    const dx = mirrorX ? -rawDx : rawDx;
    const dy = pt.y - wrist.y;
    const dz = (pt.z ?? 0) - (wrist.z ?? 0);

    relativeCoords.push(dx, dy, dz);
  }

  let maxVal = 0;
  for (const val of relativeCoords) {
    const absVal = Math.abs(val);
    if (absVal > maxVal) {
      maxVal = absVal;
    }
  }

  if (maxVal > 0) {
    return relativeCoords.map((v) => v / maxVal);
  }

  return relativeCoords;
}

/**
 * Checks if the hand is adequately sized and fully inside the camera frame.
 * Returns ok=false with helpful user guidance if hand is too small or near borders.
 */
export function checkHandBounds(landmarks: LandmarkPoint[]): HandBoundsCheck {
  if (!landmarks || landmarks.length !== 21) {
    return {
      ok: false,
      reason: "No hand detected.",
      bbox: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, area: 0 },
    };
  }

  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;

  for (const pt of landmarks) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);
  const area = width * height;
  const bbox = { minX, maxX, minY, maxY, width, height, area };

  // Check if hand is partially cut off at frame boundaries
  if (minX <= 0.02 || maxX >= 0.98 || minY <= 0.02 || maxY >= 0.98) {
    return { ok: false, reason: "Move your hand into view 🌱", bbox };
  }

  // Check if hand is too small in the frame (< 15% width/height or < 3% area)
  if (width < 0.15 || height < 0.15 || area < 0.03) {
    return { ok: false, reason: "Move your hand a little closer 🌱", bbox };
  }

  return { ok: true, bbox };
}

/**
 * 2D Euclidean distance helper
 */
function dist2D(p1: LandmarkPoint, p2: LandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Deterministic geometric finger counter based on anatomical landmark relationships.
 * Independent of hand rotation and works for any orientation:
 * - Fingers (index, middle, ring, pinky): extended if tip is farther from wrist than PIP joint.
 * - Thumb: extended if tip is farther from pinky MCP (17) than thumb IP joint (3).
 */
export function countGeometricFingers(landmarks: LandmarkPoint[]): GeometricFingerState {
  if (!landmarks || landmarks.length !== 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false, count: 0 };
  }

  const wrist = landmarks[0];
  const pinkyMcp = landmarks[17];

  // Index (Tip 8, PIP 6, MCP 5)
  const indexExtended = dist2D(landmarks[8], wrist) > dist2D(landmarks[6], wrist) * 1.08;

  // Middle (Tip 12, PIP 10, MCP 9)
  const middleExtended = dist2D(landmarks[12], wrist) > dist2D(landmarks[10], wrist) * 1.08;

  // Ring (Tip 16, PIP 14, MCP 13)
  const ringExtended = dist2D(landmarks[16], wrist) > dist2D(landmarks[14], wrist) * 1.08;

  // Pinky (Tip 20, PIP 18, MCP 17)
  const pinkyExtended = dist2D(landmarks[20], wrist) > dist2D(landmarks[18], wrist) * 1.08;

  // Thumb (Tip 4, IP 3, MCP 2)
  // Distance from pinky MCP (17) is invariant to hand rotation
  const thumbDistTipToPinkyMcp = dist2D(landmarks[4], pinkyMcp);
  const thumbDistIpToPinkyMcp = dist2D(landmarks[3], pinkyMcp);
  const thumbDistTipToWrist = dist2D(landmarks[4], wrist);
  const thumbDistMcpToWrist = dist2D(landmarks[2], wrist);

  const thumbExtended =
    thumbDistTipToPinkyMcp > thumbDistIpToPinkyMcp * 1.08 &&
    thumbDistTipToWrist > thumbDistMcpToWrist * 1.1;

  const count =
    (thumbExtended ? 1 : 0) +
    (indexExtended ? 1 : 0) +
    (middleExtended ? 1 : 0) +
    (ringExtended ? 1 : 0) +
    (pinkyExtended ? 1 : 0);

  return {
    thumb: thumbExtended,
    index: indexExtended,
    middle: middleExtended,
    ring: ringExtended,
    pinky: pinkyExtended,
    count,
  };
}

/**
 * Evaluates prediction probability distribution across labels.
 */
export function evaluateScores(
  labels: readonly string[],
  scores: number[],
  config: ModeScannerConfig = GESTURE_SCANNER_CONFIG
): EvaluationDecision {
  if (!scores || scores.length === 0) {
    return { kind: "unsure", reason: "No scores returned" };
  }

  let topIdx = 0;
  let topScore = -1;
  let secondScore = -1;

  for (let i = 0; i < scores.length; i++) {
    const score = scores[i] ?? 0;
    if (score > topScore) {
      secondScore = topScore;
      topScore = score;
      topIdx = i;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  const detectedLabel = labels[topIdx] ?? "";

  // Check if classified as background, 0, or none
  if (
    detectedLabel.toLowerCase() === "background" ||
    detectedLabel === "0" ||
    detectedLabel.toLowerCase() === "none"
  ) {
    return { kind: "background", reason: "Background detected" };
  }

  // Very weak detection
  if (topScore < 0.35) {
    return { kind: "unsure", reason: `Top score too low (${(topScore * 100).toFixed(0)}%)` };
  }

  // Margin check for ambiguity between top 2 classes
  if (config.margin && topScore - secondScore < config.margin && topScore < 0.82) {
    return {
      kind: "unclear",
      reason: `Ambiguous top classes (${detectedLabel} vs ${labels[scores.indexOf(secondScore)]}, margin ${(topScore - secondScore).toFixed(2)})`,
    };
  }

  // Confidence check
  if (topScore < config.minConfidence) {
    return {
      kind: "unsure",
      reason: `Confidence ${(topScore * 100).toFixed(0)}% < ${(config.minConfidence * 100).toFixed(0)}%`,
    };
  }

  const parsedLevel = parseInt(detectedLabel, 10);
  if (parsedLevel >= 1 && parsedLevel <= 5) {
    return {
      kind: "candidate",
      level: parsedLevel as RewardLevel,
      confidence: topScore,
    };
  }

  return { kind: "unclear", reason: `Label ${detectedLabel} outside 1-5 range` };
}

/**
 * Evaluates gesture mode predictions using an ensemble check combining
 * neural network classification with deterministic geometric finger counting.
 * If ML and geometric logic disagree, the frame is treated as "unclear".
 */
export function evaluateGestureEnsemble(
  scores: number[],
  geometric: GeometricFingerState,
  config: ModeScannerConfig = GESTURE_SCANNER_CONFIG
): EvaluationDecision {
  const mlDecision = evaluateScores(GESTURE_LABELS, scores, config);

  if (mlDecision.kind !== "candidate") {
    return mlDecision;
  }

  const mlLevel = mlDecision.level;
  const geoCount = geometric.count;

  // Strict ensemble agreement:
  // Both the ML model and the geometric finger counter must agree on the count (1-5).
  if (geoCount >= 1 && geoCount <= 5 && mlLevel === geoCount) {
    return {
      kind: "candidate",
      level: mlLevel,
      confidence: mlDecision.confidence,
      reason: `ML (${mlLevel}) and Geometric (${geoCount}) agreed`,
    };
  }

  // If geometric count is 0 (e.g. fist or retracted fingers), don't trigger
  if (geoCount === 0) {
    return {
      kind: "background",
      reason: "No extended fingers detected",
    };
  }

  // Disagreement between ML and geometric counting
  return {
    kind: "unclear",
    reason: `Disagreement: ML=${mlLevel} vs Geo=${geoCount}`,
  };
}

export interface TimeStampedVote {
  level: RewardLevel | null;
  timestamp: number;
}

/**
 * Adds a candidate vote with a timestamp to the sliding window buffer.
 */
export function addVoteWithTimestamp(
  votes: TimeStampedVote[],
  level: RewardLevel | null,
  timestamp: number,
  maxWindow = 10
): TimeStampedVote[] {
  const updated = [...votes, { level, timestamp }];
  if (updated.length > maxWindow) {
    return updated.slice(-maxWindow);
  }
  return updated;
}

// Backward-compatible alias
export function addVote(
  votes: Array<RewardLevel | null>,
  vote: RewardLevel | null,
  maxWindow = 8
): Array<RewardLevel | null> {
  const updated = [...votes, vote];
  if (updated.length > maxWindow) {
    return updated.slice(-maxWindow);
  }
  return updated;
}

/**
 * Time-based and proportion-based stable level evaluation.
 * Requires:
 * 1. At least 5 votes in the current window.
 * 2. At least `agreementRatio` (e.g. 70%) of non-null votes to be for candidate level.
 * 3. The candidate level must have been maintained across at least `minStableDurationMs` (e.g. 650-700ms).
 */
export function getStableLevelTimeBased(
  votes: TimeStampedVote[],
  config: ModeScannerConfig
): RewardLevel | null {
  if (votes.length < 5) return null;

  // Count occurrences of each level
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalValid = 0;
  let firstTimestampForCandidate: number | null = null;
  let lastTimestampForCandidate: number | null = null;

  for (const v of votes) {
    if (v.level !== null) {
      counts[v.level] = (counts[v.level] ?? 0) + 1;
      totalValid++;
    }
  }

  if (totalValid < 5) return null;

  // Find candidate level with maximum count
  let candidateLevel: RewardLevel | null = null;
  let maxCount = 0;

  for (let l = 1; l <= 5; l++) {
    if (counts[l] > maxCount) {
      maxCount = counts[l];
      candidateLevel = l as RewardLevel;
    }
  }

  if (!candidateLevel) return null;

  // Check agreement ratio in current window
  const ratio = maxCount / votes.length;
  if (ratio < config.agreementRatio) return null;

  // Check duration: span of timestamps for the candidate level
  for (const v of votes) {
    if (v.level === candidateLevel) {
      if (firstTimestampForCandidate === null || v.timestamp < firstTimestampForCandidate) {
        firstTimestampForCandidate = v.timestamp;
      }
      if (lastTimestampForCandidate === null || v.timestamp > lastTimestampForCandidate) {
        lastTimestampForCandidate = v.timestamp;
      }
    }
  }

  if (
    firstTimestampForCandidate !== null &&
    lastTimestampForCandidate !== null &&
    lastTimestampForCandidate - firstTimestampForCandidate >= config.minStableDurationMs
  ) {
    return candidateLevel;
  }

  return null;
}

// Backward-compatible alias
export function getStableLevel(
  votes: Array<RewardLevel | null>,
  threshold = 5
): RewardLevel | null {
  if (votes.length < threshold) {
    return null;
  }
  const recent = votes.slice(-threshold);
  const first = recent[0];
  if (first !== null && recent.every((v) => v === first)) {
    return first;
  }
  return null;
}
