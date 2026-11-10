import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import type { RewardLevel } from "../../types/reward";
import Button from "../ui/Button";
import {
  addVoteWithTimestamp,
  checkHandBounds,
  countGeometricFingers,
  evaluateGestureEnsemble,
  evaluateScores,
  GESTURE_LABELS,
  GESTURE_SCANNER_CONFIG,
  getStableLevelTimeBased,
  MNIST_WRITTEN_DIGIT_LABELS,
  MNIST_WRITTEN_SCORE_CONFIG,
  type ModeScannerConfig,
  normalizeHandLandmarks,
  type ScannerMode,
  type TimeStampedVote,
  type GeometricFingerState,
  type EvaluationDecision,
} from "./scannerLogic";
import { preprocessMnistWrittenDigit, type PreprocessResult } from "./mnistDigitPreprocessing";
import { primeAudio } from "../../utils/audioUnlocker";

const DEFAULT_GESTURE_MODEL_URL = "/models/gesture/model.json";
const DEFAULT_WRITTEN_MODEL_URL = "/models/mnist-opencv-experiment/model.json";
const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MEDIAPIPE_HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";

interface WebcamScannerProps {
  onRewardDetected: (level: RewardLevel) => void;
  unlockedCount: number;
}

type ScannerMessage = {
  tone: "neutral" | "warning" | "success";
  text: string;
};

interface DebugInfo {
  mode: ScannerMode;
  fps: number;
  handedness?: string;
  handScore?: number;
  geometric?: GeometricFingerState;
  vectorSummary?: { min: number; max: number; count: number; sample: number[] };
  softmaxScores: Array<{ label: string; score: number }>;
  top1: { label: string; score: number };
  top2: { label: string; score: number };
  margin: number;
  decision: EvaluationDecision;
  voteStats: {
    totalVotes: number;
    mostFrequent: RewardLevel | null;
    agreementPct: number;
    stableDurationMs: number;
  };
  handBounds?: { ok: boolean; reason?: string; areaPct: number };
  writtenDebug?: {
    contrast: number;
    otsuThreshold: number;
    inkPixelCount: number;
    inkRatioPct: number;
    bboxW: number;
    bboxH: number;
    com: { cx: number; cy: number };
    shift: { dx: number; dy: number };
  };
}

interface CalibrationStep {
  label: string;
  targetCount: number;
  instruction: string;
}

interface CalibrationRow {
  trueGesture: string;
  targetCount?: number;
  winningIndex: number;
  confidencePct: number;
  mappedLabel: string;
  softmaxVector: number[];
  confusionNote?: string;
}

const GESTURE_CALIBRATION_STEPS: CalibrationStep[] = [
  { label: "1 Finger", targetCount: 1, instruction: "Show 1 finger (Index) steadily" },
  { label: "2 Fingers", targetCount: 2, instruction: "Show 2 fingers (Index + Middle) steadily" },
  { label: "3 Fingers", targetCount: 3, instruction: "Show 3 fingers steadily" },
  { label: "4 Fingers", targetCount: 4, instruction: "Show 4 fingers (No thumb) steadily" },
  { label: "5 Fingers", targetCount: 5, instruction: "Show 5 fingers (Open Palm) steadily" },
  { label: "Fist / None", targetCount: 0, instruction: "Show closed fist or no hand" },
];

const WRITTEN_CALIBRATION_STEPS: CalibrationStep[] = [
  { label: "Digit '1'", targetCount: 1, instruction: "Show handwritten digit 1 in box" },
  { label: "Digit '2'", targetCount: 2, instruction: "Show handwritten digit 2 in box" },
  { label: "Digit '3'", targetCount: 3, instruction: "Show handwritten digit 3 in box" },
  { label: "Digit '4'", targetCount: 4, instruction: "Show handwritten digit 4 in box" },
  { label: "Digit '5'", targetCount: 5, instruction: "Show handwritten digit 5 in box" },
];

function labelsForMode(mode: ScannerMode) {
  return mode === "gesture" ? GESTURE_LABELS : MNIST_WRITTEN_DIGIT_LABELS;
}

function configForMode(mode: ScannerMode): ModeScannerConfig {
  return mode === "gesture" ? GESTURE_SCANNER_CONFIG : MNIST_WRITTEN_SCORE_CONFIG;
}

function modelUrlForMode(mode: ScannerMode) {
  const configuredUrl =
    mode === "gesture"
      ? import.meta.env.VITE_GESTURE_CLASSIFIER_MODEL_URL
      : import.meta.env.VITE_WRITTEN_DIGIT_MODEL_URL;
  return (
    configuredUrl?.trim() ||
    (mode === "gesture" ? DEFAULT_GESTURE_MODEL_URL : DEFAULT_WRITTEN_MODEL_URL)
  );
}

async function loadClassifier(mode: ScannerMode) {
  await tf.ready();
  const model = await tf.loadLayersModel(modelUrlForMode(mode));
  const inputShape = model.inputs[0]?.shape;
  const outputShape = model.outputs[0]?.shape;
  const classCount = labelsForMode(mode).length;
  const validInput =
    mode === "gesture"
      ? inputShape?.length === 2 && inputShape[1] === 63
      : inputShape?.length === 4 &&
        inputShape[1] === 28 &&
        inputShape[2] === 28 &&
        inputShape[3] === 1;

  if (!validInput || outputShape?.at(-1) !== classCount) {
    model.dispose();
    const expectedInput = mode === "gesture" ? "[batch, 63]" : "[batch, 28, 28, 1]";
    throw new Error(
      `${mode === "gesture" ? "Gesture" : "Written-digit"} model must use ${expectedInput} input and output ${classCount} classes.`
    );
  }
  return model;
}

export default function WebcamScanner({ onRewardDetected, unlockedCount }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const classifierRef = useRef<tf.LayersModel | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const frameRequestRef = useRef<number | null>(null);
  const scanLoopRef = useRef<() => void>(() => undefined);
  const sessionIdRef = useRef(0);
  const isScanningRef = useRef(false);
  const hasRewardedRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const unlockedCountRef = useRef(unlockedCount);
  const onRewardDetectedRef = useRef(onRewardDetected);
  const scanModeRef = useRef<ScannerMode>("gesture");

  // Performance & timing refs
  const lastInferenceTimeRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const lastVideoTimestampRef = useRef(0);
  const lastWarningTimeRef = useRef(0);
  const fpsCounterRef = useRef({ frames: 0, lastCheck: performance.now(), currentFps: 0 });

  // Time-stamped vote buffer
  const votesRef = useRef<TimeStampedVote[]>([]);

  // Debug overlay state
  const isDebugUrl = typeof window !== "undefined" && window.location.search.includes("debug=1");
  const [showDebug, setShowDebug] = useState(isDebugUrl);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // Calibration state
  const [calibrationActive, setCalibrationActive] = useState(false);
  const [calibrationStepIdx, setCalibrationStepIdx] = useState(0);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationStatusText, setCalibrationStatusText] = useState("");
  const [calibrationResults, setCalibrationResults] = useState<CalibrationRow[] | null>(null);
  const [calibrationAnalysis, setCalibrationAnalysis] = useState<string | null>(null);

  const calibrationActiveRef = useRef(false);
  const calibrationStepIdxRef = useRef(0);
  const calibrationBufferRef = useRef<number[][]>([]);
  const calibrationRowsRef = useRef<CalibrationRow[]>([]);

  // Collector Dev Mode
  const lastNormalizedGestureRef = useRef<number[] | null>(null);
  const lastMnistArrayRef = useRef<Float32Array | null>(null);

  const [mode, setMode] = useState<ScannerMode>("gesture");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<ScannerMessage>({
    tone: "neutral",
    text: "Choose a scanner mode to begin.",
  });
  const [detectedLevel, setDetectedLevel] = useState<RewardLevel | null>(null);
  const [detectedConfidence, setDetectedConfidence] = useState(0);

  useEffect(() => {
    unlockedCountRef.current = unlockedCount;
    onRewardDetectedRef.current = onRewardDetected;
  }, [onRewardDetected, unlockedCount]);

  const stopScanning = useCallback((keepFeedback = false) => {
    sessionIdRef.current += 1;
    isScanningRef.current = false;
    setIsScanning(false);
    setIsLoading(false);

    if (frameRequestRef.current !== null) {
      window.cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }

    try {
      handLandmarkerRef.current?.close();
    } catch {
      /* ignore */
    }
    handLandmarkerRef.current = null;

    try {
      classifierRef.current?.dispose();
    } catch {
      /* ignore */
    }
    classifierRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    votesRef.current = [];
    lastVideoTimeRef.current = -1;
    lastVideoTimestampRef.current = 0;
    lastNormalizedGestureRef.current = null;
    lastMnistArrayRef.current = null;
    calibrationActiveRef.current = false;
    setCalibrationActive(false);

    if (!keepFeedback) {
      hasRewardedRef.current = false;
      setDetectedLevel(null);
      setDetectedConfidence(0);
      setDebugInfo(null);
      setMessage({ tone: "neutral", text: "Choose a scanner mode to begin." });
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // CALIBRATION ENGINE
  // ──────────────────────────────────────────────────────────────────────────
  const startCalibration = () => {
    if (!isScanning) {
      setMessage({ tone: "warning", text: "Please start the scanner before starting calibration 🌱" });
      return;
    }
    calibrationActiveRef.current = true;
    calibrationStepIdxRef.current = 0;
    calibrationBufferRef.current = [];
    calibrationRowsRef.current = [];
    setCalibrationActive(true);
    setCalibrationStepIdx(0);
    setCalibrationProgress(0);
    setCalibrationResults(null);
    setCalibrationAnalysis(null);
    setCalibrationStatusText("Beginning calibration...");
  };

  const cancelCalibration = () => {
    calibrationActiveRef.current = false;
    setCalibrationActive(false);
    calibrationBufferRef.current = [];
    calibrationRowsRef.current = [];
    setCalibrationStatusText("");
  };

  const finishCalibration = (rows: CalibrationRow[]) => {
    calibrationActiveRef.current = false;
    setCalibrationActive(false);
    setCalibrationResults(rows);

    const activeMode = scanModeRef.current;

    // Print table to browser console
    console.group(`🎯 SmartAbility ${activeMode.toUpperCase()} Calibration Results`);
    console.table(
      rows.map((r) => ({
        "True Target": r.trueGesture,
        "Winning Index": r.winningIndex,
        "Confidence": `${r.confidencePct}%`,
        "Mapped Label": r.mappedLabel,
        "Softmax Vector": r.softmaxVector.map((v) => v.toFixed(3)).join(", "),
        "Confusion": r.confusionNote ?? "None (Clean)",
      }))
    );

    // Analyze mapping: Check if winning indices are sequential [0, 1, 2, 3, 4, 5]
    if (activeMode === "gesture") {
      const winningIndices = rows.map((r) => r.winningIndex);
      const isCleanShift =
        winningIndices.length === 6 &&
        winningIndices[0] === 0 &&
        winningIndices[1] === 1 &&
        winningIndices[2] === 2 &&
        winningIndices[3] === 3 &&
        winningIndices[4] === 4 &&
        winningIndices[5] === 5;

      if (isCleanShift) {
        const msg =
          "✅ Confirmed: Model output is an exact 0-indexed sequential shift -> [1, 2, 3, 4, 5, background]. The current GESTURE_LABELS constant perfectly matches the model!";
        console.log(msg);
        setCalibrationAnalysis(msg);
      } else {
        const orderStr = rows.map((r) => `Index ${r.winningIndex}='${r.trueGesture}'`).join(", ");
        const msg = `⚠️ Irregular mapping detected: ${orderStr}. If confidence is low, collect samples and retrain using scripts/train_gesture_mlp.py.`;
        console.warn(msg);
        setCalibrationAnalysis(msg);
      }
    } else {
      const winningIndices = rows.map((r) => r.winningIndex);
      const isCleanOrder =
        winningIndices.length === 5 &&
        winningIndices[0] === 0 &&
        winningIndices[1] === 1 &&
        winningIndices[2] === 2 &&
        winningIndices[3] === 3 &&
        winningIndices[4] === 4;

      if (isCleanOrder) {
        const msg =
          "✅ Confirmed: Written-digit CNN output indices [0, 1, 2, 3, 4] correspond exactly to digits ['1', '2', '3', '4', '5'].";
        console.log(msg);
        setCalibrationAnalysis(msg);
      } else {
        const msg = `⚠️ Written digit mapping deviation: ${rows.map((r) => `Digit ${r.trueGesture} -> Index ${r.winningIndex}`).join(", ")}`;
        console.warn(msg);
        setCalibrationAnalysis(msg);
      }
    }
    console.groupEnd();
  };

  const handleFrame = useCallback(async () => {
    const video = videoRef.current;
    const classifier = classifierRef.current;
    if (
      !isScanningRef.current ||
      !video ||
      !classifier ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return;
    }

    const now = performance.now();
    const activeMode = scanModeRef.current;
    const currentConfig = configForMode(activeMode);

    // Throttle inference loop to target FPS (e.g. ~15 FPS for gesture, ~12 FPS for written)
    if (now - lastInferenceTimeRef.current < currentConfig.sampleIntervalMs) {
      return;
    }
    lastInferenceTimeRef.current = now;

    // Track FPS
    const fc = fpsCounterRef.current;
    fc.frames++;
    if (now - fc.lastCheck >= 1000) {
      fc.currentFps = Math.round((fc.frames * 1000) / (now - fc.lastCheck));
      fc.frames = 0;
      fc.lastCheck = now;
    }

    // Skip duplicate frames if video currentTime hasn't advanced
    if (video.currentTime === lastVideoTimeRef.current && video.currentTime > 0) {
      return;
    }
    lastVideoTimeRef.current = video.currentTime;

    let scores: number[] = [];
    let decision: EvaluationDecision;
    let gestureSummary: DebugInfo["vectorSummary"] | undefined;
    let geometricState: GeometricFingerState | undefined;
    let detectedHandedness: string | undefined;
    let detectedHandScore: number | undefined;
    let handBoundsResult: DebugInfo["handBounds"] | undefined;
    let writtenDebugData: DebugInfo["writtenDebug"] | undefined;

    // ──────────────────────────────────────────────────────────────────────────
    // GESTURE MODE
    // ──────────────────────────────────────────────────────────────────────────
    if (activeMode === "gesture") {
      const landmarker = handLandmarkerRef.current;
      if (!landmarker) return;

      // Ensure strictly increasing timestamps for MediaPipe VIDEO running mode
      const videoTs = Math.max(lastVideoTimestampRef.current + 1, Math.round(now));
      lastVideoTimestampRef.current = videoTs;

      const result = landmarker.detectForVideo(video, videoTs);
      const landmarks = result?.landmarks[0];

      if (!landmarks || landmarks.length !== 21) {
        votesRef.current = []; // Reset on hand disappearance
        setDetectedLevel(null);
        setDetectedConfidence(0);
        setMessage({ tone: "neutral", text: "Show one hand clearly inside the box 🌱" });
        return;
      }

      // Check handedness from MediaPipe
      const handednessObj = result.handedness?.[0]?.[0];
      detectedHandedness = handednessObj?.categoryName ?? "Right";
      detectedHandScore = handednessObj?.score ?? 0.99;

      // Hand bounds & size validation
      const boundsCheck = checkHandBounds(landmarks);
      handBoundsResult = {
        ok: boundsCheck.ok,
        reason: boundsCheck.reason,
        areaPct: Math.round(boundsCheck.bbox.area * 100),
      };

      if (!boundsCheck.ok) {
        votesRef.current = [];
        setDetectedLevel(null);
        setDetectedConfidence(0);
        setMessage({ tone: "neutral", text: boundsCheck.reason || "Adjust your hand position 🌱" });
        return;
      }

      // Deterministic geometric finger counting
      geometricState = countGeometricFingers(landmarks);

      // Feature normalization (63 dimensions: 21 points * (dx, dy, dz) / maxVal)
      // Mirror X if handedness is Left to normalize to model expectations
      const mirrorX = detectedHandedness === "Left";
      const features = normalizeHandLandmarks(landmarks, mirrorX);
      lastNormalizedGestureRef.current = features;

      gestureSummary = {
        min: Math.min(...features),
        max: Math.max(...features),
        count: features.length,
        sample: features.slice(0, 6).map((v) => Math.round(v * 100) / 100),
      };

      // Model inference in tf.tidy
      scores = tf.tidy(() => {
        const inputTensor = tf.tensor2d(features, [1, 63]);
        const output = classifier.predict(inputTensor);
        const pred = Array.isArray(output) ? output[0] : output;
        return Array.from(pred.dataSync());
      });

      // Ensemble evaluation: ML prediction must agree with geometric count
      decision = evaluateGestureEnsemble(scores, geometricState, currentConfig);

      // ── CALIBRATION STEP HANDLER FOR GESTURE MODE ──
      if (calibrationActiveRef.current && geometricState) {
        const steps = GESTURE_CALIBRATION_STEPS;
        const currentStep = steps[calibrationStepIdxRef.current];

        if (currentStep) {
          // Ground-truth match: Only record frames where the geometric count matches the target
          if (geometricState.count === currentStep.targetCount) {
            calibrationBufferRef.current.push(scores);
            const recordedCount = calibrationBufferRef.current.length;
            setCalibrationProgress(recordedCount);
            setCalibrationStatusText(
              `Recording ${currentStep.label}: ${recordedCount}/25 frames (${Math.round((recordedCount / 25) * 100)}%)...`
            );

            // Once 25 frames are recorded (~1.8 - 2.0s), compute average and advance
            if (recordedCount >= 25) {
              const numScores = scores.length;
              const avgVector = new Array(numScores).fill(0);
              for (const s of calibrationBufferRef.current) {
                for (let i = 0; i < numScores; i++) {
                  avgVector[i] += s[i];
                }
              }
              for (let i = 0; i < numScores; i++) {
                avgVector[i] /= calibrationBufferRef.current.length;
              }

              // Find winning index (argmax) and runner up
              let winIdx = 0;
              let winScore = -1;
              let secondScore = -1;
              let secondIdx = -1;
              for (let i = 0; i < numScores; i++) {
                if (avgVector[i] > winScore) {
                  secondScore = winScore;
                  secondIdx = winIdx;
                  winScore = avgVector[i];
                  winIdx = i;
                } else if (avgVector[i] > secondScore) {
                  secondScore = avgVector[i];
                  secondIdx = i;
                }
              }

              const labels = labelsForMode("gesture");
              const confusion =
                secondScore > 0.22
                  ? `Close runner-up: index ${secondIdx} (${(secondScore * 100).toFixed(0)}%)`
                  : undefined;

              calibrationRowsRef.current.push({
                trueGesture: currentStep.label,
                targetCount: currentStep.targetCount,
                winningIndex: winIdx,
                confidencePct: Math.round(winScore * 100),
                mappedLabel: labels[winIdx] ?? `Index ${winIdx}`,
                softmaxVector: avgVector,
                confusionNote: confusion,
              });

              calibrationBufferRef.current = [];
              const nextIdx = calibrationStepIdxRef.current + 1;
              calibrationStepIdxRef.current = nextIdx;
              setCalibrationStepIdx(nextIdx);
              setCalibrationProgress(0);

              if (nextIdx >= steps.length) {
                finishCalibration(calibrationRowsRef.current);
              }
            }
          } else {
            setCalibrationStatusText(
              `Target: ${currentStep.label}. Please adjust your hand (seeing ${geometricState.count} fingers) 🌱`
            );
          }
        }
      }
    }
    // ──────────────────────────────────────────────────────────────────────────
    // WRITTEN DIGIT MODE
    // ──────────────────────────────────────────────────────────────────────────
    else {
      const prepResult: PreprocessResult = preprocessMnistWrittenDigit(
        video,
        previewCanvasRef.current
      );

      if (prepResult.kind === "rejected") {
        votesRef.current = []; // Reset on invalid frame
        setDetectedLevel(null);
        setDetectedConfidence(0);
        setMessage({ tone: "neutral", text: prepResult.reason });

        if (showDebug && prepResult.debug) {
          const dbg = prepResult.debug;
          setDebugInfo({
            mode: "written",
            fps: fc.currentFps,
            softmaxScores: [],
            top1: { label: "–", score: 0 },
            top2: { label: "–", score: 0 },
            margin: 0,
            decision: { kind: "unclear", reason: prepResult.reason },
            voteStats: { totalVotes: 0, mostFrequent: null, agreementPct: 0, stableDurationMs: 0 },
            writtenDebug: {
              contrast: dbg.contrast ?? 0,
              otsuThreshold: dbg.otsuThreshold ?? 0,
              inkPixelCount: dbg.inkPixelCount ?? 0,
              inkRatioPct: Math.round((dbg.inkRatio ?? 0) * 100),
              bboxW: 0,
              bboxH: 0,
              com: { cx: 14, cy: 14 },
              shift: { dx: 0, dy: 0 },
            },
          });
        }
        return;
      }

      lastMnistArrayRef.current = prepResult.inputValues;
      const dbg = prepResult.debug;
      writtenDebugData = {
        contrast: dbg.contrast,
        otsuThreshold: dbg.otsuThreshold,
        inkPixelCount: dbg.inkPixelCount,
        inkRatioPct: Math.round(dbg.inkRatio * 100),
        bboxW: dbg.bbox.w,
        bboxH: dbg.bbox.h,
        com: dbg.centerOfMass,
        shift: dbg.shift,
      };

      // Model inference with tensor shape [1, 28, 28, 1]
      scores = tf.tidy(() => {
        const inputTensor = tf.tensor4d(prepResult.inputValues, [1, 28, 28, 1]);
        const output = classifier.predict(inputTensor);
        const pred = Array.isArray(output) ? output[0] : output;
        return Array.from(pred.dataSync());
      });

      decision = evaluateScores(MNIST_WRITTEN_DIGIT_LABELS, scores, currentConfig);

      // ── CALIBRATION STEP HANDLER FOR WRITTEN MODE ──
      if (calibrationActiveRef.current) {
        const steps = WRITTEN_CALIBRATION_STEPS;
        const currentStep = steps[calibrationStepIdxRef.current];

        if (currentStep) {
          calibrationBufferRef.current.push(scores);
          const recordedCount = calibrationBufferRef.current.length;
          setCalibrationProgress(recordedCount);
          setCalibrationStatusText(
            `Recording ${currentStep.label}: ${recordedCount}/25 frames (${Math.round((recordedCount / 25) * 100)}%)...`
          );

          if (recordedCount >= 25) {
            const numScores = scores.length;
            const avgVector = new Array(numScores).fill(0);
            for (const s of calibrationBufferRef.current) {
              for (let i = 0; i < numScores; i++) {
                avgVector[i] += s[i];
              }
            }
            for (let i = 0; i < numScores; i++) {
              avgVector[i] /= calibrationBufferRef.current.length;
            }

            let winIdx = 0;
            let winScore = -1;
            let secondScore = -1;
            let secondIdx = -1;
            for (let i = 0; i < numScores; i++) {
              if (avgVector[i] > winScore) {
                secondScore = winScore;
                secondIdx = winIdx;
                winScore = avgVector[i];
                winIdx = i;
              } else if (avgVector[i] > secondScore) {
                secondScore = avgVector[i];
                secondIdx = i;
              }
            }

            const labels = labelsForMode("written");
            const confusion =
              secondScore > 0.22
                ? `Close runner-up: index ${secondIdx} (${(secondScore * 100).toFixed(0)}%)`
                : undefined;

            calibrationRowsRef.current.push({
              trueGesture: currentStep.label,
              targetCount: currentStep.targetCount,
              winningIndex: winIdx,
              confidencePct: Math.round(winScore * 100),
              mappedLabel: labels[winIdx] ?? `Index ${winIdx}`,
              softmaxVector: avgVector,
              confusionNote: confusion,
            });

            calibrationBufferRef.current = [];
            const nextIdx = calibrationStepIdxRef.current + 1;
            calibrationStepIdxRef.current = nextIdx;
            setCalibrationStepIdx(nextIdx);
            setCalibrationProgress(0);

            if (nextIdx >= steps.length) {
              finishCalibration(calibrationRowsRef.current);
            }
          }
        }
      }
    }

    if (!isScanningRef.current) return;

    // Record vote with high-resolution timestamp
    const voteLevel = decision.kind === "candidate" ? decision.level : null;
    votesRef.current = addVoteWithTimestamp(
      votesRef.current,
      voteLevel,
      now,
      currentConfig.windowSize
    );

    // Compute top1, top2, margin for debug inspection
    const labels = labelsForMode(activeMode);
    const sorted = scores
      .map((score, i) => ({ label: labels[i] ?? `${i}`, score }))
      .sort((a, b) => b.score - a.score);

    const top1 = sorted[0] ?? { label: "–", score: 0 };
    const top2 = sorted[1] ?? { label: "–", score: 0 };
    const margin = Math.round((top1.score - top2.score) * 100) / 100;

    // Update UI candidate feedback
    if (decision.kind === "candidate") {
      setDetectedLevel(decision.level);
      setDetectedConfidence(decision.confidence);
      setMessage({
        tone: "neutral",
        text:
          activeMode === "gesture"
            ? `Seeing ${decision.level} finger${decision.level > 1 ? "s" : ""}! Hold steady…`
            : `Reading number ${decision.level}! Hold steady…`,
      });
    } else {
      setDetectedLevel(null);
      setDetectedConfidence(0);
      if (decision.kind === "background") {
        setMessage({
          tone: "neutral",
          text:
            activeMode === "gesture"
              ? "Show a number hand sign (1–5) inside the box 🌱"
              : "Show one handwritten number (1–5) inside the box 🌱",
        });
      } else if (decision.kind === "unclear") {
        setMessage({
          tone: "neutral",
          text: decision.reason ?? "Keep your hand still so I can recognize it clearly 🌱",
        });
      } else {
        setMessage({
          tone: "neutral",
          text: "Looking closely… try moving a little closer or improving the light 🌱",
        });
      }
    }

    // Check temporal stability: requires duration (~650-700ms) and agreement (>=70%)
    const stableLevel = getStableLevelTimeBased(votesRef.current, currentConfig);

    // Update debug stats
    if (showDebug) {
      const counts: Record<number, number> = {};
      let maxCnt = 0;
      let mostFreq: RewardLevel | null = null;
      let firstCandidateTs = 0;
      let lastCandidateTs = 0;

      for (const v of votesRef.current) {
        if (v.level) {
          counts[v.level] = (counts[v.level] ?? 0) + 1;
          if (counts[v.level] > maxCnt) {
            maxCnt = counts[v.level];
            mostFreq = v.level;
          }
        }
      }

      if (mostFreq) {
        const matches = votesRef.current.filter((v) => v.level === mostFreq);
        if (matches.length > 0) {
          firstCandidateTs = matches[0].timestamp;
          lastCandidateTs = matches[matches.length - 1].timestamp;
        }
      }

      setDebugInfo({
        mode: activeMode,
        fps: fc.currentFps,
        handedness: detectedHandedness,
        handScore: detectedHandScore,
        geometric: geometricState,
        vectorSummary: gestureSummary,
        softmaxScores: sorted,
        top1,
        top2,
        margin,
        decision,
        voteStats: {
          totalVotes: votesRef.current.length,
          mostFrequent: mostFreq,
          agreementPct: votesRef.current.length ? Math.round((maxCnt / votesRef.current.length) * 100) : 0,
          stableDurationMs: Math.round(lastCandidateTs - firstCandidateTs),
        },
        handBounds: handBoundsResult,
        writtenDebug: writtenDebugData,
      });
    }

    // Trigger verification: Do not fire rewards while calibration is active
    if (
      calibrationActiveRef.current ||
      stableLevel === null ||
      hasRewardedRef.current ||
      Date.now() < cooldownUntilRef.current
    ) {
      return;
    }

    // Level Gating check
    if (stableLevel > unlockedCountRef.current) {
      votesRef.current = [];
      setDetectedLevel(null);

      // Throttle warning message to avoid spamming every frame
      if (Date.now() - lastWarningTimeRef.current > 1500) {
        lastWarningTimeRef.current = Date.now();
        setMessage({
          tone: "warning",
          text: `Level ${stableLevel} is still locked! Please show a number from 1 to ${unlockedCountRef.current} 🌱`,
        });
      }
      return;
    }

    // Successful reward detection!
    hasRewardedRef.current = true;
    cooldownUntilRef.current = Date.now() + currentConfig.cooldownMs;
    setMessage({
      tone: "success",
      text: `🎉 Excellent! You unlocked Level ${stableLevel} reward!`,
    });

    stopScanning(true);
    onRewardDetectedRef.current(stableLevel);
  }, [showDebug, stopScanning]);

  scanLoopRef.current = () => {
    void handleFrame()
      .catch((scanError: unknown) => {
        console.error("[WebcamScanner] prediction error:", scanError);
        setError("The scanner had trouble processing camera frames. Please restart it.");
        stopScanning();
      })
      .finally(() => {
        if (isScanningRef.current) {
          frameRequestRef.current = window.requestAnimationFrame(() => scanLoopRef.current());
        }
      });
  };

  const startScanning = async () => {
    primeAudio();
    stopScanning();
    const sessionId = sessionIdRef.current;
    const selectedMode = mode;
    let pendingStream: MediaStream | null = null;
    let pendingClassifier: tf.LayersModel | null = null;
    let pendingHandLandmarker: HandLandmarker | null = null;

    setError(null);
    setIsLoading(true);
    setMessage({ tone: "neutral", text: "Loading custom neural networks…" });

    try {
      pendingClassifier = await loadClassifier(selectedMode);

      if (selectedMode === "gesture") {
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        // Try GPU delegate with fallback to CPU
        try {
          pendingHandLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MEDIAPIPE_HAND_MODEL_URL, delegate: "GPU" },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.6,
            minHandPresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        } catch {
          console.warn("[WebcamScanner] GPU delegate failed, falling back to CPU");
          pendingHandLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MEDIAPIPE_HAND_MODEL_URL, delegate: "CPU" },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.6,
            minHandPresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        }
      }

      // Request camera with ideal aspect ratio
      pendingStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (sessionId !== sessionIdRef.current) return;

      const video = videoRef.current;
      if (!video) throw new Error("Camera preview is unavailable.");
      video.srcObject = pendingStream;
      await video.play();

      if (sessionId !== sessionIdRef.current) return;

      classifierRef.current = pendingClassifier;
      pendingClassifier = null;
      handLandmarkerRef.current = pendingHandLandmarker;
      pendingHandLandmarker = null;
      streamRef.current = pendingStream;
      pendingStream = null;
      scanModeRef.current = selectedMode;
      hasRewardedRef.current = false;
      isScanningRef.current = true;
      setIsScanning(true);
      setIsLoading(false);

      setMessage({
        tone: "neutral",
        text:
          selectedMode === "gesture"
            ? "Show one number hand sign inside the box 🌱"
            : "Show one handwritten number inside the box 🌱",
      });

      frameRequestRef.current = window.requestAnimationFrame(() => scanLoopRef.current());
    } catch (scanError: unknown) {
      console.error("[WebcamScanner] start error:", scanError);
      if (sessionId === sessionIdRef.current) {
        const detail = scanError instanceof Error ? scanError.message : "Unknown error";
        setError(`Could not start the ${selectedMode === "gesture" ? "gesture" : "written-digit"} scanner. ${detail}`);
        stopScanning();
      }
    } finally {
      try {
        pendingHandLandmarker?.close();
      } catch {
        /* ignore */
      }
      try {
        pendingClassifier?.dispose();
      } catch {
        /* ignore */
      }
      pendingStream?.getTracks().forEach((track) => track.stop());
      if (sessionId === sessionIdRef.current) setIsLoading(false);
    }
  };

  useEffect(() => () => stopScanning(), [stopScanning]);

  // Phase 5: Download sample for data collection
  const downloadSample = () => {
    if (mode === "gesture" && lastNormalizedGestureRef.current) {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(
          JSON.stringify(
            {
              mode: "gesture",
              features: lastNormalizedGestureRef.current,
              timestamp: Date.now(),
            },
            null,
            2
          )
        );
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `gesture_sample_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else if (mode === "written" && previewCanvasRef.current) {
      const imageUri = previewCanvasRef.current.toDataURL("image/png");
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", imageUri);
      downloadAnchor.setAttribute("download", `mnist_28x28_sample_${Date.now()}.png`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const messageClasses = {
    neutral: "bg-sky-blue/20 text-bark-brown border-sky-blue/50",
    warning: "bg-sunshine-yellow/25 text-bark-brown border-sunshine-yellow",
    success: "bg-leaf-green/20 text-forest-green border-leaf-green/50",
  }[message.tone];

  const currentCalibrationStep =
    scanModeRef.current === "gesture"
      ? GESTURE_CALIBRATION_STEPS[calibrationStepIdx]
      : WRITTEN_CALIBRATION_STEPS[calibrationStepIdx];

  return (
    <section
      className="flex flex-col items-center gap-4 bg-white/50 p-6 rounded-3xl border border-leaf-green/20 w-full"
      aria-labelledby="scanner-heading"
    >
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden="true">
            📷
          </span>
          <h3 id="scanner-heading" className="font-baloo text-xl font-bold text-bark-brown">
            Scan Reward Number
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowDebug(!showDebug)}
          className={`text-xs font-fredoka px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
            showDebug
              ? "bg-forest-green text-white border-forest-green"
              : "bg-white/60 text-soil-brown/70 border-leaf-green/30 hover:border-forest-green"
          }`}
          title="Toggle Edge-AI Debug Inspection Overlay"
        >
          {showDebug ? "🐞 Debug ON" : "🐞 Debug"}
        </button>
      </div>

      {!isScanning && (
        <div className="flex flex-col w-full max-w-md gap-3">
          <fieldset disabled={isLoading} className="grid grid-cols-2 gap-3 border-0 p-0 m-0">
            <legend className="sr-only">Scanner mode</legend>
            <button
              type="button"
              onClick={() => setMode("gesture")}
              aria-pressed={mode === "gesture"}
              className={`rounded-2xl border-2 p-3 font-fredoka text-sm transition-all cursor-pointer ${
                mode === "gesture"
                  ? "border-forest-green bg-leaf-green/15 text-forest-green font-bold shadow-xs"
                  : "border-leaf-green/30 bg-white/70 text-soil-brown hover:border-leaf-green"
              }`}
            >
              ✋ Hand Gesture Mode
            </button>
            <button
              type="button"
              onClick={() => setMode("written")}
              aria-pressed={mode === "written"}
              className={`rounded-2xl border-2 p-3 font-fredoka text-sm transition-all cursor-pointer ${
                mode === "written"
                  ? "border-forest-green bg-leaf-green/15 text-forest-green font-bold shadow-xs"
                  : "border-leaf-green/30 bg-white/70 text-soil-brown hover:border-leaf-green"
              }`}
            >
              ✍️ Written Digit Mode
            </button>
          </fieldset>

          <p className="text-sm text-soil-brown/80 text-center px-4 font-fredoka">
            {mode === "gesture"
              ? "Show 1 to 5 fingers to the camera to unlock a reward."
              : "Write a number (1 to 5) on paper or palm and show it inside the box."}
          </p>

          <Button
            variant="primary"
            onClick={() => void startScanning()}
            disabled={isLoading}
            className="w-full py-3"
            aria-describedby={error ? "scanner-error" : "scanner-status"}
          >
            {isLoading ? "Starting Camera & AI Models…" : "Start Scanner 🌱"}
          </Button>

          <p
            id="scanner-status"
            className={`text-sm text-center font-fredoka border rounded-xl p-3 ${messageClasses}`}
            aria-live="polite"
          >
            {message.text}
          </p>

          {error && (
            <p
              id="scanner-error"
              role="alert"
              className="text-red-700 font-fredoka text-sm text-center bg-red-50 p-3 rounded-xl border border-red-300"
            >
              {error}
            </p>
          )}
        </div>
      )}

      {/* Video Viewport & UI Targeting Guide */}
      <div
        className={`relative rounded-3xl overflow-hidden border-4 border-white shadow-xl ${
          !isScanning ? "hidden" : ""
        }`}
      >
        <video
          ref={videoRef}
          className={
            scanModeRef.current === "written"
              ? "w-[300px] h-[300px] object-cover bg-soil-brown/10"
              : "w-[300px] h-[300px] object-cover -scale-x-100 bg-soil-brown/10"
          }
          autoPlay
          muted
          playsInline
          aria-label="Live camera preview"
        />

        {/* Bounding box guide: exactly matches 72% ROI center crop */}
        <div
          className="pointer-events-none absolute inset-[14%] rounded-2xl border-4 border-dashed border-white/95 shadow-[0_0_0_999px_rgba(74,124,89,0.18)]"
          aria-hidden="true"
        />

        <span
          className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-bark-brown/85 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-white text-xs font-fredoka shadow-sm"
          aria-hidden="true"
        >
          {calibrationActive
            ? `🎯 Calibrating Step ${calibrationStepIdx + 1}: ${currentCalibrationStep?.label ?? ""}`
            : scanModeRef.current === "gesture"
            ? "Hold hand inside the dashed box 🌱"
            : "Place number inside the dashed box 🌱"}
        </span>
      </div>

      {isScanning && (
        <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-md">
          {/* Recognition Status Bar */}
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-leaf-green/20 w-full justify-between">
            <span className="font-fredoka text-soil-brown font-medium">Recognized:</span>
            <div className="flex items-center gap-2" aria-live="polite">
              <strong className="text-leaf-green font-baloo text-3xl">
                {detectedLevel !== null ? `Level ${detectedLevel}` : "–"}
              </strong>
              {detectedLevel !== null && (
                <span className="text-forest-green font-fredoka text-xs font-bold bg-leaf-green/15 px-2.5 py-1 rounded-full">
                  {(detectedConfidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          </div>

          <p
            className={`w-full text-sm text-center font-fredoka border rounded-xl p-3 ${messageClasses}`}
            aria-live="polite"
          >
            {calibrationActive ? calibrationStatusText : message.text}
          </p>

          <Button variant="ghost" onClick={() => stopScanning()} className="w-full">
            Cancel Scanning
          </Button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PHASE 0, 1 & 5: TOGGLEABLE DEBUG & CALIBRATION INSPECTOR OVERLAY   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showDebug && (
        <div
          className="w-full max-w-md bg-bark-brown/95 text-white p-4 rounded-2xl font-mono text-xs flex flex-col gap-3 shadow-2xl border border-white/20 mt-2"
          role="region"
          aria-label="Diagnostic Edge-AI Scanner Overlay"
        >
          <div className="flex items-center justify-between border-b border-white/20 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sunshine-yellow tracking-wide">
                ⚡ Edge-AI Inspector
              </span>
              <span className="bg-forest-green px-2 py-0.5 rounded text-[10px]">
                {debugInfo?.fps ?? 0} FPS
              </span>
            </div>
            {!calibrationActive && (
              <button
                type="button"
                onClick={startCalibration}
                className="bg-sunshine-yellow hover:bg-yellow-400 text-bark-brown font-bold text-[10px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                🎯 Calibrate Labels
              </button>
            )}
          </div>

          {/* ── Active Calibration Step Banner ── */}
          {calibrationActive && (
            <div className="bg-leaf-green/20 border border-leaf-green/50 p-3 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-sunshine-yellow font-bold">
                  Step {calibrationStepIdx + 1} of{" "}
                  {scanModeRef.current === "gesture"
                    ? GESTURE_CALIBRATION_STEPS.length
                    : WRITTEN_CALIBRATION_STEPS.length}
                  : {currentCalibrationStep?.instruction}
                </span>
                <span className="bg-leaf-green text-forest-green font-bold px-1.5 py-0.5 rounded text-[10px]">
                  {calibrationProgress}/25 frames
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sunshine-yellow to-leaf-green h-full transition-all duration-100"
                  style={{ width: `${(calibrationProgress / 25) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-white/80">
                <span>{calibrationStatusText}</span>
                <button
                  type="button"
                  onClick={cancelCalibration}
                  className="text-flower-pink hover:underline font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Completed Calibration Table ── */}
          {calibrationResults && (
            <div className="bg-black/50 border border-leaf-green/40 p-3 rounded-xl flex flex-col gap-2 text-[11px]">
              <div className="flex justify-between items-center pb-1 border-b border-white/10">
                <span className="text-sunshine-yellow font-bold">🎯 Calibration Table</span>
                <button
                  type="button"
                  onClick={() => setCalibrationResults(null)}
                  className="text-white/50 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/20 text-white/60 text-[10px]">
                      <th className="py-1">Gesture</th>
                      <th className="py-1">Win Idx</th>
                      <th className="py-1">Conf</th>
                      <th className="py-1">Mapped</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calibrationResults.map((row, idx) => (
                      <tr key={idx} className="border-b border-white/10">
                        <td className="py-1 text-sunshine-yellow font-bold">{row.trueGesture}</td>
                        <td className="py-1 font-bold text-white">Index {row.winningIndex}</td>
                        <td className="py-1 text-leaf-green">{row.confidencePct}%</td>
                        <td className="py-1 text-white/90">"{row.mappedLabel}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {calibrationAnalysis && (
                <p className="text-[10px] text-white/90 bg-white/10 p-2 rounded-lg leading-snug">
                  {calibrationAnalysis}
                </p>
              )}
            </div>
          )}

          {debugInfo ? (
            <div className="flex flex-col gap-2 leading-relaxed">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-white/60">Mode: </span>
                  <span className="text-leaf-green font-bold uppercase">{debugInfo.mode}</span>
                </div>
                <div>
                  <span className="text-white/60">Decision: </span>
                  <span
                    className={
                      debugInfo.decision.kind === "candidate"
                        ? "text-leaf-green font-bold"
                        : "text-flower-orange font-bold"
                    }
                  >
                    {debugInfo.decision.kind}
                  </span>
                </div>
              </div>

              {/* Gesture Specific Diagnostics */}
              {debugInfo.mode === "gesture" && (
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/70">Handedness:</span>
                    <span className="font-bold text-white">
                      {debugInfo.handedness} ({( (debugInfo.handScore ?? 0) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  {debugInfo.geometric && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/70">Geometric Fingers:</span>
                      <span className="text-sunshine-yellow font-bold">
                        {debugInfo.geometric.count} [
                        {debugInfo.geometric.thumb ? "T" : "-"}
                        {debugInfo.geometric.index ? "I" : "-"}
                        {debugInfo.geometric.middle ? "M" : "-"}
                        {debugInfo.geometric.ring ? "R" : "-"}
                        {debugInfo.geometric.pinky ? "P" : "-"}]
                      </span>
                    </div>
                  )}
                  {debugInfo.handBounds && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/70">Frame Coverage:</span>
                      <span
                        className={
                          debugInfo.handBounds.ok ? "text-leaf-green" : "text-flower-pink"
                        }
                      >
                        {debugInfo.handBounds.areaPct}% area{" "}
                        {debugInfo.handBounds.ok ? "✓" : `(${debugInfo.handBounds.reason})`}
                      </span>
                    </div>
                  )}
                  {debugInfo.vectorSummary && (
                    <div className="text-[10px] text-white/60 pt-1 border-t border-white/10">
                      Vector 63: min {debugInfo.vectorSummary.min.toFixed(2)}, max{" "}
                      {debugInfo.vectorSummary.max.toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {/* Written Digit Specific Diagnostics with Live 112x112 Preview */}
              {debugInfo.mode === "written" && (
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center gap-3">
                    <canvas
                      ref={previewCanvasRef}
                      width={112}
                      height={112}
                      className="w-20 h-20 bg-black rounded-lg border border-leaf-green/50 shadow-inner pixelated"
                      title="112x112 upscaled view of the exact 28x28 normalized tensor fed to CNN"
                    />
                    <div className="text-[10px] space-y-0.5 flex-1">
                      <p className="text-sunshine-yellow font-bold">28x28 Normalized CNN Input</p>
                      <p>
                        Contrast:{" "}
                        <span className="text-white font-bold">
                          {debugInfo.writtenDebug?.contrast}
                        </span>{" "}
                        (Otsu T: {debugInfo.writtenDebug?.otsuThreshold})
                      </p>
                      <p>
                        Ink Pixels:{" "}
                        <span className="text-white font-bold">
                          {debugInfo.writtenDebug?.inkPixelCount}
                        </span>{" "}
                        ({debugInfo.writtenDebug?.inkRatioPct}%)
                      </p>
                      <p>
                        COM Shift: dx={debugInfo.writtenDebug?.shift.dx}, dy=
                        {debugInfo.writtenDebug?.shift.dy}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Softmax Probabilities & Margin */}
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span>Top 1: {debugInfo.top1.label} ({(debugInfo.top1.score * 100).toFixed(0)}%)</span>
                  <span>Top 2: {debugInfo.top2.label} ({(debugInfo.top2.score * 100).toFixed(0)}%)</span>
                  <span className="text-sunshine-yellow">Margin: {debugInfo.margin}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap pt-1 text-[10px]">
                  {debugInfo.softmaxScores.map((s) => (
                    <span
                      key={s.label}
                      className={`px-1.5 py-0.5 rounded ${
                        s.label === debugInfo.top1.label
                          ? "bg-forest-green text-white font-bold"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {s.label}: {(s.score * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>

              {/* Temporal Stability & Consensus */}
              <div className="bg-black/40 p-2 rounded-xl border border-white/10 flex justify-between text-[11px]">
                <span>
                  Agreement:{" "}
                  <strong className="text-sunshine-yellow">
                    {debugInfo.voteStats.agreementPct}%
                  </strong>{" "}
                  ({debugInfo.voteStats.totalVotes} in window)
                </span>
                <span>
                  Stable:{" "}
                  <strong className="text-leaf-green">
                    {debugInfo.voteStats.stableDurationMs}ms
                  </strong>
                </span>
              </div>

              {/* Collector Dev Mode Download Button */}
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={downloadSample}
                  className="w-full text-center py-1.5 bg-leaf-green/20 hover:bg-leaf-green/30 text-leaf-green rounded-lg font-bold text-[11px] border border-leaf-green/40 transition-colors cursor-pointer"
                >
                  💾 Save Current Sample ({debugInfo.mode === "gesture" ? "JSON" : "PNG"})
                </button>
              </div>
            </div>
          ) : (
            <p className="text-white/50 text-center py-2">Start the scanner to view live tensor telemetry.</p>
          )}
        </div>
      )}
    </section>
  );
}
