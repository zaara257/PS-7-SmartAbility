// src/utils/audioUnlocker.ts
// Utility to prime and unlock HTML5 & Web Audio on user gesture.
// Modern browsers (Chrome, Safari, iOS Safari, Edge) block unmuted audio autoplay
// unless the audio pipeline has been unlocked during a direct user gesture.

let isPrimed = false;
let sharedAudioCtx: AudioContext | null = null;
let silentAudioEl: HTMLAudioElement | null = null;

// Tiny 0.05s silent mono 8kHz WAV (44-byte standard header + 2 zero samples)
const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

export function primeAudio(): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Prime Web Audio Context
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioContextClass) {
      if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
        sharedAudioCtx = new AudioContextClass();
      }
      if (sharedAudioCtx.state === "suspended") {
        void sharedAudioCtx.resume().catch(() => {});
      }
      // Play a 1-sample silent buffer to unlock the audio pipeline
      try {
        const buffer = sharedAudioCtx.createBuffer(1, 1, 22050);
        const source = sharedAudioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(sharedAudioCtx.destination);
        source.start(0);
      } catch {
        // Ignore buffer source errors
      }
    }

    // 2. Prime HTML5 Audio element
    if (!silentAudioEl) {
      silentAudioEl = new Audio(SILENT_WAV_DATA_URI);
      silentAudioEl.preload = "auto";
      silentAudioEl.volume = 0.01;
    }
    const playPromise = silentAudioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          silentAudioEl?.pause();
          isPrimed = true;
        })
        .catch(() => {
          // Will succeed on subsequent real interactions
        });
    } else {
      isPrimed = true;
    }
  } catch (err) {
    console.debug("[audioUnlocker] Prime attempted:", err);
  }
}

export function isAudioPrimed(): boolean {
  if (isPrimed) return true;
  if (sharedAudioCtx && sharedAudioCtx.state === "running") return true;
  return false;
}

// Automatically bind to the first user gesture on the document
if (typeof window !== "undefined") {
  const unlockEvents = ["pointerdown", "touchstart", "click", "keydown"] as const;
  const onFirstInteraction = () => {
    primeAudio();
    unlockEvents.forEach((evt) =>
      window.removeEventListener(evt, onFirstInteraction, true)
    );
  };
  unlockEvents.forEach((evt) =>
    window.addEventListener(evt, onFirstInteraction, { capture: true, passive: true })
  );
}

