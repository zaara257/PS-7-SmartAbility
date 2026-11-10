// src/components/rewards/RewardVideoPlayer.tsx
// Unified full-screen video player for all festival reward levels (1-5).
// Features:
//   - Full viewport object-cover video
//   - Blurred background backdrop for aesthetic letterboxing fill
//   - Imperative ref-based audio control (bypasses React JSX muted attribute sync quirks)
//   - Autoplay with sound first; graceful muted fallback + prominent "🔊 Tap for sound" button if blocked
//   - Audio priming integration for Chrome, Edge, and iOS Safari
//   - Audio toggle floating top-right synced via volumechange event
//   - Dev debug HUD under ?debug=1 (muted, volume, readyState, audio tracks, rejection reason)
//   - Safe error boundary with friendly recovery fallback

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isAudioPrimed, primeAudio } from "../../utils/audioUnlocker";

interface RewardVideoPlayerProps {
  src: string;
  loop?: boolean;
  label?: string;
  onContinue: () => void;
}

function formatVideoSrc(src: string): string {
  if (!src) return "";
  try {
    const decoded = decodeURI(src);
    return encodeURI(decoded);
  } catch {
    return encodeURI(src);
  }
}

const READY_STATE_MAP: Record<number, string> = {
  0: "HAVE_NOTHING",
  1: "HAVE_METADATA",
  2: "HAVE_CURRENT_DATA",
  3: "HAVE_FUTURE_DATA",
  4: "HAVE_ENOUGH_DATA",
};

interface ExtendedVideoElement extends HTMLVideoElement {
  webkitAudioDecodedByteCount?: number;
  mozHasAudio?: boolean;
  audioTracks?: { length: number };
}

export default function RewardVideoPlayer({
  src,
  loop = true,
  label = "Festival Celebration",
  onContinue,
}: RewardVideoPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showSoundPrompt, setShowSoundPrompt] = useState(false);
  const [playRejection, setPlayRejection] = useState<string | null>(null);
  const [hasMediaError, setHasMediaError] = useState(false);
  const [mediaErrorMessage, setMediaErrorMessage] = useState("");
  const [debugAudioTrackInfo, setDebugAudioTrackInfo] = useState("checking...");
  const [debugReadyState, setDebugReadyState] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const userExplicitlyMutedRef = useRef(false);
  const safeSrc = formatVideoSrc(src);

  const showDebug = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("debug") === "1";
  }, []);

  // Lock body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Update debug telemetry
  const updateDebugStats = useCallback(() => {
    const el = videoRef.current as ExtendedVideoElement | null;
    if (!el) return;
    setDebugReadyState(el.readyState);

    let audioInfo = "none detected";
    if (el.audioTracks && el.audioTracks.length > 0) {
      audioInfo = `${el.audioTracks.length} track(s)`;
    } else if (typeof el.mozHasAudio === "boolean") {
      audioInfo = el.mozHasAudio ? "yes (moz)" : "no (moz)";
    } else if (typeof el.webkitAudioDecodedByteCount === "number") {
      audioInfo =
        el.webkitAudioDecodedByteCount > 0
          ? `decoding (${el.webkitAudioDecodedByteCount} bytes)`
          : "pending decode";
    } else if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
      audioInfo = "stream active";
    }
    setDebugAudioTrackInfo(audioInfo);
  }, []);

  // Master playback controller — starts playback with sound first
  useEffect(() => {
    let cancelled = false;

    const startPlayback = async () => {
      const video = videoRef.current;
      const bgVideo = bgVideoRef.current;
      if (!video) return;

      // Always keep background blurred video muted and low priority
      if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.volume = 0;
        void bgVideo.play().catch(() => {});
      }

      setHasMediaError(false);
      setMediaErrorMessage("");

      // If user previously tapped mute during this session, honour it
      if (userExplicitlyMutedRef.current) {
        video.muted = true;
        video.volume = 1;
        try {
          await video.play();
          if (cancelled) return;
          setIsMuted(true);
          setShowSoundPrompt(false);
        } catch {
          // ignore
        }
        return;
      }

      // Step 1: Try playing with sound first (unmuted, full volume)
      video.muted = false;
      video.volume = 1;

      try {
        await video.play();
        if (cancelled) return;
        setIsMuted(false);
        setShowSoundPrompt(false);
        setPlayRejection(null);
      } catch (err: unknown) {
        if (cancelled) return;
        const errName = err instanceof Error ? err.name : "NotAllowedError";
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[RewardVideoPlayer] Autoplay with sound blocked (${errName}):`, errMsg);
        setPlayRejection(errName);

        // Step 2: Fall back to muted playback so the reward video still plays visually
        video.muted = true;
        try {
          await video.play();
          if (cancelled) return;
          setIsMuted(true);
          // Show prominent "Tap for sound" button for children/parents
          setShowSoundPrompt(true);
        } catch (mutedErr) {
          console.error("[RewardVideoPlayer] Muted playback also failed:", mutedErr);
          setPlayRejection(mutedErr instanceof Error ? mutedErr.name : "PlayFailed");
        }
      }
      updateDebugStats();
    };

    void startPlayback();

    return () => {
      cancelled = true;
    };
  }, [safeSrc, updateDebugStats]);

  // Sync state with underlying DOM video events (volumechange, error, loadedmetadata, etc.)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
      updateDebugStats();
    };

    const onError = () => {
      const err = video.error;
      console.error("[RewardVideoPlayer] Video loading error:", err);
      setHasMediaError(true);
      setMediaErrorMessage(
        err ? `Error code ${err.code}: ${err.message || "Failed to load media"}` : "Unable to load video."
      );
      updateDebugStats();
    };

    const onLoadedMetadata = () => {
      updateDebugStats();
    };

    const onTimeUpdate = () => {
      // Loop protection: ensure video does not randomly re-mute when looping
      if (!userExplicitlyMutedRef.current && video.muted && !showSoundPrompt) {
        video.muted = false;
        video.volume = 1;
      }
      if (showDebug) updateDebugStats();
    };

    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("error", onError);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("error", onError);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [showDebug, showSoundPrompt, updateDebugStats]);

  // Tab visibility recovery: resume playback when user returns to tab
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) return;
      const video = videoRef.current;
      if (video && video.paused) {
        void video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Real user gesture handler: enable sound directly inside click
  const handleEnableSound = async () => {
    primeAudio();
    const video = videoRef.current;
    if (!video) return;

    userExplicitlyMutedRef.current = false;
    video.muted = false;
    video.volume = 1;

    try {
      await video.play();
      setIsMuted(false);
      setShowSoundPrompt(false);
      setPlayRejection(null);
    } catch (err) {
      console.error("[RewardVideoPlayer] Sound activation failed on click:", err);
    }
  };

  // Sound toggle button (top-right)
  const handleToggleMute = async () => {
    primeAudio();
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      userExplicitlyMutedRef.current = false;
      video.muted = false;
      video.volume = 1;
      setShowSoundPrompt(false);
      try {
        await video.play();
      } catch {
        /* ignore */
      }
    } else {
      userExplicitlyMutedRef.current = true;
      video.muted = true;
      setShowSoundPrompt(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="video-fullscreen"
        className="fixed inset-0 z-[60] bg-black flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* ── Error state fallback ────────────────────────────────────────── */}
        {hasMediaError ? (
          <div className="relative z-30 flex flex-col items-center gap-4 bg-white/95 backdrop-blur-md p-8 rounded-3xl max-w-md mx-6 text-center shadow-2xl border-2 border-forest-green/20">
            <span className="text-6xl animate-bounce" role="img" aria-label="Celebration">
              🎉
            </span>
            <h2 className="font-baloo text-2xl font-bold text-bark-brown">
              Reward Unlocked!
            </h2>
            <p className="font-fredoka text-soil-brown/80 text-sm">
              We couldn&apos;t load the video stream, but your reward has been recorded to your garden!
            </p>
            {showDebug && mediaErrorMessage && (
              <p className="font-mono text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {mediaErrorMessage}
              </p>
            )}
            <button
              onClick={onContinue}
              className="mt-2 w-full px-6 py-3.5 rounded-2xl bg-forest-green text-white font-baloo text-lg font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Continue 🌱
            </button>
          </div>
        ) : (
          <>
            {/* ── Blurred backdrop (always muted, fills letterbox gaps) ───── */}
            <video
              ref={bgVideoRef}
              src={safeSrc}
              autoPlay
              loop={loop}
              playsInline
              preload="auto"
              muted
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60 pointer-events-none"
            />

            {/* ── Foreground video ────────────────────────────────────────── */}
            {/* Note: muted is controlled imperatively through videoRef to avoid React prop diffing quirks */}
            <video
              ref={videoRef}
              src={safeSrc}
              autoPlay
              loop={loop}
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* ── Top-left label chip ─────────────────────────────────────── */}
            <div className="absolute top-4 left-4 z-20 bg-black/55 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/20">
              <span className="font-fredoka text-sm text-white font-semibold select-none">
                ✨ {label}
              </span>
            </div>

            {/* ── Top-right sound toggle ──────────────────────────────────── */}
            <button
              onClick={() => void handleToggleMute()}
              className="absolute top-4 right-4 z-20 bg-black/55 hover:bg-black/80 text-white rounded-full p-2.5 border border-white/20 transition-all active:scale-95 cursor-pointer backdrop-blur-sm shadow-md"
              aria-label={isMuted ? "Unmute video" : "Mute video"}
              id="video-mute-toggle"
            >
              <span className="text-xl leading-none flex items-center justify-center w-6 h-6 select-none">
                {isMuted ? "🔇" : "🔊"}
              </span>
            </button>

            {/* ── Prominent "Tap for sound" prompt when autoplay with sound was blocked ─ */}
            {showSoundPrompt && isMuted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
              >
                <button
                  onClick={() => void handleEnableSound()}
                  className="
                    group flex items-center gap-3 px-6 py-4 rounded-full
                    bg-white/95 text-bark-brown font-baloo text-xl font-bold
                    shadow-2xl shadow-black/80 border-4 border-yellow-400
                    hover:scale-105 active:scale-95 transition-all cursor-pointer
                    animate-pulse backdrop-blur-md
                  "
                  id="tap-for-sound-btn"
                  aria-label="Tap to enable sound"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform select-none">
                    🔊
                  </span>
                  <span className="text-forest-green tracking-wide">
                    Tap for sound! 🎵
                  </span>
                </button>
              </motion.div>
            )}

            {/* ── Dev debug HUD overlay (?debug=1) ────────────────────────── */}
            {showDebug && (
              <div
                className="absolute top-16 left-4 z-30 bg-black/80 text-white/90 font-mono text-xs px-3 py-2 rounded-xl border border-white/20 pointer-events-none space-y-1 max-w-xs"
                id="video-debug-hud"
              >
                <p>
                  <span className="text-yellow-300">audio:</span> {isMuted ? "MUTED" : "UNMUTED"} | vol: {Math.round(volume * 100)}%
                </p>
                <p>
                  <span className="text-yellow-300">state:</span> {READY_STATE_MAP[debugReadyState] ?? debugReadyState}
                </p>
                <p>
                  <span className="text-yellow-300">track:</span> {debugAudioTrackInfo}
                </p>
                <p>
                  <span className="text-yellow-300">reject:</span> {playRejection ?? "none"}
                </p>
                <p>
                  <span className="text-yellow-300">primed:</span> {isAudioPrimed() ? "true" : "false"}
                </p>
              </div>
            )}

            {/* ── Continue button ─────────────────────────────────────────── */}
            <div
              className="absolute bottom-0 left-0 right-0 z-20 flex justify-center px-6 pointer-events-none"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
            >
              <div className="w-full max-w-sm flex justify-center pointer-events-auto">
                <button
                  onClick={onContinue}
                  className="
                    w-full px-8 py-4 rounded-3xl
                    bg-gradient-to-r from-forest-green to-leaf-green
                    border-b-4 border-forest-green/70
                    text-white font-baloo text-xl font-bold
                    shadow-2xl shadow-black/60 drop-shadow-xl
                    hover:brightness-110 active:scale-95 active:border-b-0 active:mt-1
                    transition-all cursor-pointer text-center
                  "
                  id="video-continue-btn"
                >
                  Continue 🌱
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
