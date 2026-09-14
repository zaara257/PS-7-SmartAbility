// src/components/rewards/RewardVideoModal.tsx
// Level 1 & 3 — true full-screen video reward.
// Video fills the entire viewport (object-cover).
// A blurred copy of the video plays behind as an aesthetic backdrop for any
// letterboxed areas. Continue button floats at the bottom with safe-area insets.
// Body scroll is locked while open and restored on unmount.

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RewardVideoModalProps {
  videoSrc: string;
  label: string;
  onContinue: () => void;
}

export default function RewardVideoModal({ videoSrc, label, onContinue }: RewardVideoModalProps) {
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  // Lock body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Auto-play safety — browsers may block unmuted autoplay
  useEffect(() => {
    const tryPlay = async (el: HTMLVideoElement | null) => {
      if (!el) return;
      try {
        await el.play();
      } catch {
        setMuted(true);
      }
    };
    tryPlay(videoRef.current);
    tryPlay(bgVideoRef.current);
  }, [videoSrc]);

  // Sync mute state to background video
  useEffect(() => {
    if (bgVideoRef.current) bgVideoRef.current.muted = true; // bg is always muted
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="video-fullscreen"
        className="fixed inset-0 z-[60] bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* ── Blurred backdrop (always muted, for aesthetic fill behind letterboxed areas) */}
        <video
          ref={bgVideoRef}
          src={videoSrc}
          autoPlay
          loop
          playsInline
          muted
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60 pointer-events-none"
        />

        {/* ── Foreground video — object-cover fills viewport, slight priority crop */}
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          playsInline
          muted={muted}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* ── Label chip — top-left floating */}
        <div className="absolute top-4 left-4 z-20 bg-black/55 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/20">
          <span className="font-fredoka text-sm text-white font-semibold select-none">
            ✨ {label}
          </span>
        </div>

        {/* ── Sound toggle — top-right floating */}
        <button
          onClick={() => setMuted(!muted)}
          className="absolute top-4 right-4 z-20 bg-black/55 hover:bg-black/80 text-white rounded-full p-2.5 border border-white/20 transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
          aria-label={muted ? "Unmute video" : "Mute video"}
          id="video-mute-toggle"
        >
          <span className="text-xl leading-none flex items-center justify-center w-6 h-6 select-none">
            {muted ? "🔇" : "🔊"}
          </span>
        </button>

        {/* ── Continue button — bottom floating with safe-area inset (no dark scrim) */}
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
      </motion.div>
    </AnimatePresence>
  );
}
