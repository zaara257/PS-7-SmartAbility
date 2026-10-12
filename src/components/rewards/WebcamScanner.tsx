import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import type { RewardLevel } from "../../types/reward";
import Button from "../ui/Button";
import {
  addVote,
  ALL_REWARD_LEVELS,
  canTriggerReward,
  evaluateScores,
  GESTURE_V2_REWARD_LEVELS,
  GESTURE_LABELS,
  getStableLevel,
  LEGACY_GESTURE_LABELS,
  MNIST_WRITTEN_DIGIT_LABELS,
  MNIST_WRITTEN_SCORE_CONFIG,
  normalizeHandLandmarks,
  SCANNER_CONFIG,
  type ScannerMode,
} from "./scannerLogic";
import { preprocessMnistWrittenDigit } from "./mnistDigitPreprocessing";

const DEFAULT_GESTURE_MODEL_URL = "/models/gesture-v2-prototype/model.json";
const DEFAULT_LEGACY_GESTURE_MODEL_URL = "/models/gesture/model.json";
const DEFAULT_WRITTEN_MODEL_URL = "/models/mnist-opencv-experiment/model.json";
const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MEDIAPIPE_HAND_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";

interface WebcamScannerProps {
  onRewardDetected: (level: RewardLevel) => void;
  unlockedCount: number;
}

type ScannerMessage = {
  tone: "neutral" | "warning" | "success";
  text: string;
};

type GestureModelProfile = {
  labels: readonly string[];
  rewardLevels: readonly RewardLevel[];
  defaultModelUrl: string;
  prompt: string;
  backgroundPrompt: string;
};

function gestureModelProfile(): GestureModelProfile {
  if (import.meta.env.VITE_GESTURE_MODEL_PROFILE === "legacy") {
    return {
      labels: LEGACY_GESTURE_LABELS,
      rewardLevels: ALL_REWARD_LEVELS,
      defaultModelUrl: DEFAULT_LEGACY_GESTURE_MODEL_URL,
      prompt: "Show one number hand sign inside the box 🌱",
      backgroundPrompt: "Show one number hand sign inside the box.",
    };
  }
  return {
    labels: GESTURE_LABELS,
    rewardLevels: GESTURE_V2_REWARD_LEVELS,
    defaultModelUrl: DEFAULT_GESTURE_MODEL_URL,
    prompt: "Show thumbs up, a V sign, an OK gesture, or a closed fist 🌱",
    backgroundPrompt: "Show one of the four gesture signs inside the box.",
  };
}

function labelsForMode(mode: ScannerMode) {
  return mode === "gesture" ? gestureModelProfile().labels : MNIST_WRITTEN_DIGIT_LABELS;
}

function modelUrlForMode(mode: ScannerMode) {
  const configuredUrl = mode === "gesture"
    ? import.meta.env.VITE_GESTURE_CLASSIFIER_MODEL_URL
    : import.meta.env.VITE_WRITTEN_DIGIT_MODEL_URL;
  return configuredUrl?.trim() || (mode === "gesture" ? gestureModelProfile().defaultModelUrl : DEFAULT_WRITTEN_MODEL_URL);
}

async function predictScores(model: tf.LayersModel, input: tf.Tensor) {
  const output = model.predict(input);
  const prediction = Array.isArray(output) ? output[0] : output;
  try {
    return Array.from(await prediction.data());
  } finally {
    input.dispose();
    if (Array.isArray(output)) output.forEach((tensor) => tensor.dispose());
    else output.dispose();
  }
}

async function loadClassifier(mode: ScannerMode) {
  const model = await tf.loadLayersModel(modelUrlForMode(mode));
  const inputShape = model.inputs[0]?.shape;
  const outputShape = model.outputs[0]?.shape;
  const classCount = labelsForMode(mode).length;
  const validInput = mode === "gesture"
    ? inputShape?.length === 2 && inputShape[1] === 63
    : inputShape?.length === 4 && inputShape[1] === 28 && inputShape[2] === 28 && inputShape[3] === 1;

  if (!validInput || outputShape?.at(-1) !== classCount) {
    model.dispose();
    const expectedInput = mode === "gesture" ? "[batch, 63]" : "[batch, 28, 28, 1]";
    throw new Error(`${mode === "gesture" ? "Gesture" : "Written-digit"} model must use ${expectedInput} input and output ${classCount} classes in the documented order.`);
  }
  return model;
}

export default function WebcamScanner({ onRewardDetected, unlockedCount }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const classifierRef = useRef<tf.LayersModel | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const preprocessCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const scanLoopRef = useRef<() => void>(() => undefined);
  const sessionIdRef = useRef(0);
  const votesRef = useRef<Array<RewardLevel | null>>([]);
  const isScanningRef = useRef(false);
  const hasRewardedRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const unlockedCountRef = useRef(unlockedCount);
  const onRewardDetectedRef = useRef(onRewardDetected);
  const scanModeRef = useRef<ScannerMode>("gesture");

  const [mode, setMode] = useState<ScannerMode>("gesture");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<ScannerMessage>({ tone: "neutral", text: "Choose a scanner mode to begin." });
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

    handLandmarkerRef.current?.close();
    handLandmarkerRef.current = null;
    classifierRef.current?.dispose();
    classifierRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    votesRef.current = [];

    if (!keepFeedback) {
      hasRewardedRef.current = false;
      setDetectedLevel(null);
      setDetectedConfidence(0);
      setMessage({ tone: "neutral", text: "Choose a scanner mode to begin." });
    }
  }, []);

  const handleFrame = useCallback(async () => {
    const video = videoRef.current;
    const classifier = classifierRef.current;
    if (!isScanningRef.current || !video || !classifier || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const activeMode = scanModeRef.current;
    let scores: number[];
    if (activeMode === "gesture") {
      const result = handLandmarkerRef.current?.detectForVideo(video, performance.now());
      const features = result?.landmarks[0] ? normalizeHandLandmarks(result.landmarks[0]) : null;
      if (!features) {
        votesRef.current = addVote(votesRef.current, null);
        setDetectedLevel(null);
        setDetectedConfidence(0);
        setMessage({ tone: "neutral", text: "Show one hand clearly inside the box." });
        return;
      }
      scores = await predictScores(classifier, tf.tensor2d(features, [1, features.length]));
    } else {
      const canvas = preprocessCanvasRef.current ?? document.createElement("canvas");
      preprocessCanvasRef.current = canvas;
      const prepared = preprocessMnistWrittenDigit(video, canvas);
      if (prepared.kind === "rejected") {
        votesRef.current = addVote(votesRef.current, null);
        setDetectedLevel(null);
        setDetectedConfidence(0);
        setMessage({ tone: "neutral", text: prepared.reason });
        return;
      }
      scores = await predictScores(classifier, tf.tensor4d(prepared.inputValues, [1, 28, 28, 1]));
    }

    if (!isScanningRef.current) return;
    const decision = evaluateScores(
      labelsForMode(activeMode),
      scores,
      activeMode === "written" ? MNIST_WRITTEN_SCORE_CONFIG : SCANNER_CONFIG,
    );
    votesRef.current = addVote(votesRef.current, decision.kind === "candidate" ? decision.level : null);

    if (decision.kind === "candidate") {
      setDetectedLevel(decision.level);
      setDetectedConfidence(decision.confidence);
      setMessage({ tone: "neutral", text: "Looking carefully… hold your hand comfortably." });
    } else {
      setDetectedLevel(null);
      setDetectedConfidence(0);
      if (decision.kind === "background") {
        setMessage({ tone: "neutral", text: activeMode === "gesture" ? gestureModelProfile().backgroundPrompt : "Show one handwritten number inside the box." });
      } else if (decision.kind === "unclear") {
        setMessage({ tone: "neutral", text: "I can’t recognize that mark yet. You can try again." });
      } else {
        setMessage({ tone: "neutral", text: "I’m not sure yet. Try moving a little closer or improving the light." });
      }
    }

    const stableLevel = getStableLevel(
      votesRef.current,
      activeMode === "gesture" ? gestureModelProfile().rewardLevels : ALL_REWARD_LEVELS,
    );
    if (!canTriggerReward(stableLevel, hasRewardedRef.current, cooldownUntilRef.current, Date.now())) return;

    if (stableLevel > unlockedCountRef.current) {
      votesRef.current = [];
      setDetectedLevel(null);
      setMessage({ tone: "warning", text: `Level ${stableLevel} is locked. Please show a number from 1 to ${unlockedCountRef.current}.` });
      return;
    }

    hasRewardedRef.current = true;
    cooldownUntilRef.current = Date.now() + SCANNER_CONFIG.cooldownMs;
    setMessage({ tone: "success", text: `Great job! You found reward level ${stableLevel}.` });
    stopScanning(true);
    onRewardDetectedRef.current(stableLevel);
  }, [stopScanning]);

  scanLoopRef.current = () => {
    void handleFrame()
      .catch((scanError: unknown) => {
        console.error("[WebcamScanner] prediction error:", scanError);
        setError("The scanner had trouble reading that frame. Please restart it.");
        stopScanning();
      })
      .finally(() => {
        if (isScanningRef.current) frameRequestRef.current = window.requestAnimationFrame(() => scanLoopRef.current());
      });
  };

  const startScanning = async () => {
    stopScanning();
    const sessionId = sessionIdRef.current;
    const selectedMode = mode;
    let pendingStream: MediaStream | null = null;
    let pendingClassifier: tf.LayersModel | null = null;
    let pendingHandLandmarker: HandLandmarker | null = null;
    setError(null);
    setIsLoading(true);
    setMessage({ tone: "neutral", text: "Loading your custom scanner…" });

    try {
      pendingClassifier = await loadClassifier(selectedMode);
      if (selectedMode === "gesture") {
        const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        pendingHandLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MEDIAPIPE_HAND_MODEL_URL },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
      }
      pendingStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false });
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
      setMessage({ tone: "neutral", text: selectedMode === "gesture" ? gestureModelProfile().prompt : "Show one handwritten number inside the box 🌱" });
      frameRequestRef.current = window.requestAnimationFrame(() => scanLoopRef.current());
    } catch (scanError: unknown) {
      console.error("[WebcamScanner] start error:", scanError);
      if (sessionId === sessionIdRef.current) {
        const detail = scanError instanceof Error ? scanError.message : "Unknown error";
        setError(`Could not start the ${selectedMode === "gesture" ? "gesture" : "written-digit"} scanner. ${detail}`);
        stopScanning();
      }
    } finally {
      pendingHandLandmarker?.close();
      pendingClassifier?.dispose();
      pendingStream?.getTracks().forEach((track) => track.stop());
      if (sessionId === sessionIdRef.current) setIsLoading(false);
    }
  };

  useEffect(() => () => stopScanning(), [stopScanning]);

  const messageClasses = {
    neutral: "bg-sky-blue/20 text-bark-brown border-sky-blue/50",
    warning: "bg-sunshine-yellow/25 text-bark-brown border-sunshine-yellow",
    success: "bg-leaf-green/20 text-forest-green border-leaf-green/50",
  }[message.tone];

  return (
    <section className="flex flex-col items-center gap-4 bg-white/50 p-6 rounded-3xl border border-leaf-green/20 w-full" aria-labelledby="scanner-heading">
      <div className="flex items-center gap-2">
        <span className="text-3xl" aria-hidden="true">📷</span>
        <h3 id="scanner-heading" className="font-baloo text-xl font-bold text-bark-brown">Scan Reward Number</h3>
      </div>

      {!isScanning && (
        <div className="flex flex-col w-full max-w-md gap-3">
          <fieldset disabled={isLoading} className="grid grid-cols-2 gap-3 border-0 p-0 m-0">
            <legend className="sr-only">Scanner mode</legend>
            <button type="button" onClick={() => setMode("gesture")} aria-pressed={mode === "gesture"} className={`rounded-2xl border-2 p-3 font-fredoka text-sm ${mode === "gesture" ? "border-forest-green bg-leaf-green/15 text-forest-green" : "border-leaf-green/30 bg-white/70 text-soil-brown"}`}>
              ✋ Hand Gesture Mode
            </button>
            <button type="button" onClick={() => setMode("written")} aria-pressed={mode === "written"} className={`rounded-2xl border-2 p-3 font-fredoka text-sm ${mode === "written" ? "border-forest-green bg-leaf-green/15 text-forest-green" : "border-leaf-green/30 bg-white/70 text-soil-brown"}`}>
              ✍️ Written Digit Mode
            </button>
          </fieldset>
          <p className="text-sm text-soil-brown/80 text-center px-4 font-fredoka">
            {mode === "gesture" ? "Thumbs up = 1, V sign = 2, OK gesture = 3, closed fist = 4." : "Write one number from 1 to 5 on a hand, then show it to the camera."}
          </p>
          <Button variant="primary" onClick={() => void startScanning()} disabled={isLoading} className="w-full py-3" aria-describedby={error ? "scanner-error" : "scanner-status"}>
            {isLoading ? "Loading Scanner…" : "Start Scanner"}
          </Button>
          <p id="scanner-status" className={`text-sm text-center font-fredoka border rounded-xl p-3 ${messageClasses}`} aria-live="polite">{message.text}</p>
          {error && <p id="scanner-error" role="alert" className="text-red-700 font-fredoka text-sm text-center bg-red-50 p-3 rounded-xl border border-red-300">{error}</p>}
        </div>
      )}

      <div className={`relative rounded-2xl overflow-hidden border-4 border-white shadow-lg ${!isScanning ? "hidden" : ""}`}>
        <video
          ref={videoRef}
          className={scanModeRef.current === "written"
            ? "w-[300px] h-auto max-h-[300px] bg-soil-brown/10"
            : "w-[300px] h-[300px] object-cover -scale-x-100 bg-soil-brown/10"}
          autoPlay
          muted
          playsInline
          aria-label="Live camera preview"
        />
        <div className="pointer-events-none absolute inset-[12%] rounded-3xl border-4 border-dashed border-white/90 shadow-[0_0_0_999px_rgba(74,124,89,0.12)]" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-bark-brown/80 px-3 py-1.5 rounded-full text-white text-sm font-fredoka" aria-hidden="true">Place one hand inside the box 🌱</span>
      </div>

      {isScanning && (
        <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-md">
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-leaf-green/20 w-full justify-between">
            <span className="font-fredoka text-soil-brown">Current number:</span>
            <div className="flex items-center gap-2" aria-live="polite">
              <strong className="text-leaf-green font-baloo text-2xl">{detectedLevel ?? "–"}</strong>
              {detectedLevel !== null && <span className="text-soil-brown/60 font-fredoka text-sm bg-leaf-green/10 px-2 py-1 rounded-md">{(detectedConfidence * 100).toFixed(0)}%</span>}
            </div>
          </div>
          <p className="font-fredoka text-xs text-soil-brown/60">{scanModeRef.current === "gesture" ? "Hand Gesture Mode" : "Written Digit Mode"}</p>
          <p className={`w-full text-sm text-center font-fredoka border rounded-xl p-3 ${messageClasses}`} aria-live="polite">{message.text}</p>
          <Button variant="ghost" onClick={() => stopScanning()} className="w-full mt-2">Cancel Scanning</Button>
        </div>
      )}
    </section>
  );
}
