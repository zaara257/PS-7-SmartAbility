// src/components/rewards/RhymeOverlay.tsx
// Level 4 — full-screen glassmorphic lyric view.
//
// Layout:
//   • Fixed full-viewport overlay with a lush garden gradient background +
//     decorative blurred botanical shapes for depth.
//   • A centered glass panel (backdrop-filter: blur) floats over the background.
//   • Lines advance automatically every (10000 / lines.length) ms — 2500ms for
//     4-line rhymes. Current line is large + bright; next line is dim + smaller.
//   • CheerOverlay fires on top at the usual position.
//   • Continue button floats at the bottom with safe-area insets.
//   • Body scroll is locked while open and restored on unmount.
//
// Interface: onContinue is required (caller is RewardEngine).

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CheerOverlay from "./CheerOverlay";
import type { RhymeDef } from "../../constants/rhymes";

interface RhymeOverlayProps {
  rhyme: RhymeDef | null;
  onContinue: () => void;
}

// Decorative blurred leaf/petal shapes for the background layer
function BotanicalBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Large soft blurred circles — garden palette */}
      <div
        className="absolute rounded-full blur-3xl opacity-40"
        style={{ width: 420, height: 420, top: "-10%", left: "-12%", background: "radial-gradient(circle, #4A7C59, #7FB069)" }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-30"
        style={{ width: 360, height: 360, top: "20%", right: "-15%", background: "radial-gradient(circle, #A8DADC, #7FB069)" }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-35"
        style={{ width: 300, height: 300, bottom: "-5%", left: "20%", background: "radial-gradient(circle, #F4D35E55, #7FB06955)" }}
      />
      <div
        className="absolute rounded-full blur-2xl opacity-25"
        style={{ width: 250, height: 250, bottom: "15%", right: "5%", background: "radial-gradient(circle, #F2A6B0, #B784A7)" }}
      />

      {/* Scattered leaf emojis — blurred and faint */}
      {["🍃", "🌿", "🍀", "🌱", "🍃", "🌿"].map((leaf, i) => (
        <span
          key={i}
          className="absolute text-6xl opacity-20 blur-sm select-none"
          style={{
            top: `${[8, 65, 30, 80, 15, 55][i]}%`,
            left: `${[5, 10, 85, 78, 50, 92][i]}%`,
            transform: `rotate(${[15, -25, 40, -10, 30, -20][i]}deg) scale(${[1.5, 1.2, 1.8, 1.3, 1.1, 1.6][i]})`,
          }}
        >
          {leaf}
        </span>
      ))}
    </div>
  );
}

export default function RhymeOverlay({ rhyme, onContinue }: RhymeOverlayProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TOTAL_DURATION_MS = 10000;

  // Lock body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Advance lines on a timer — evenly paced across 10s
  useEffect(() => {
    if (!rhyme) return;
    const msPerLine = TOTAL_DURATION_MS / rhyme.lines.length; // 2500ms for 4 lines

    setCurrentLine(0); // reset on new rhyme

    intervalRef.current = setInterval(() => {
      setCurrentLine((prev) => {
        if (prev >= rhyme.lines.length - 1) {
          clearInterval(intervalRef.current!);
          return prev;
        }
        return prev + 1;
      });
    }, msPerLine);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rhyme]);

  // Loading state
  if (!rhyme) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-forest-green/95">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const nextLine = currentLine < rhyme.lines.length - 1 ? rhyme.lines[currentLine + 1] : null;

  return (
    <motion.div
      key="rhyme-fullscreen"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #1a3d1f 0%, #2d5a27 20%, #4A7C59 50%, #6aab5e 70%, #A8DADC 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Blurred botanical background shapes */}
      <BotanicalBackdrop />

      {/* CheerOverlay fires on top of everything */}
      <CheerOverlay active />

      {/* ── Main content column ─────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm px-4">

        {/* Floating emoji above glass panel */}
        <motion.span
          className="text-8xl select-none drop-shadow-2xl"
          role="img"
          aria-label="rhyme icon"
          key={rhyme.id}
          initial={{ scale: 0, rotate: -20, y: 30 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 20 }}
        >
          {rhyme.emoji}
        </motion.span>

        {/* ── Glass lyric panel ───────────────────────────────── */}
        <div
          className="w-full rounded-[32px] px-8 py-8 flex flex-col items-center gap-5 relative overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.14)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.30)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          {/* Inner glass shine stripe */}
          <div
            className="absolute top-0 left-4 right-4 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }}
            aria-hidden="true"
          />

          {/* ── Current line — large, bright, animated in */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`line-${currentLine}`}
              className="font-baloo text-center font-bold leading-snug text-white"
              style={{
                fontSize: "clamp(1.4rem, 5vw, 1.9rem)",
                textShadow: "0 2px 16px rgba(0,0,0,0.4)",
              }}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
            >
              {rhyme.lines[currentLine]}
            </motion.p>
          </AnimatePresence>

          {/* ── Divider */}
          <div
            className="w-16 h-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.3)" }}
            aria-hidden="true"
          />

          {/* ── Next line — dimmed, smaller karaoke lead-in */}
          <div className="min-h-[2rem] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {nextLine ? (
                <motion.p
                  key={`next-${currentLine}`}
                  className="font-fredoka text-center leading-snug"
                  style={{
                    fontSize: "clamp(1rem, 3.5vw, 1.2rem)",
                    color: "rgba(255,255,255,0.48)",
                    textShadow: "0 1px 8px rgba(0,0,0,0.25)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {nextLine}
                </motion.p>
              ) : (
                <motion.span
                  key="done"
                  className="font-fredoka text-white/50 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  ✨ Great job!
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* ── Line progress dots */}
          <div className="flex gap-2 mt-1" aria-hidden="true">
            {rhyme.lines.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: i === currentLine ? 20 : 8,
                  height: 8,
                  background: i <= currentLine ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                }}
                animate={{ width: i === currentLine ? 20 : 8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Continue button — bottom floating with safe-area inset */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 flex justify-center"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className="px-6 pt-10 pb-4 w-full max-w-sm bg-gradient-to-t from-black/50 via-black/25 to-transparent flex justify-center">
          <button
            onClick={onContinue}
            className="
              w-full px-8 py-4 rounded-3xl
              bg-gradient-to-r from-forest-green to-leaf-green
              border-b-4 border-forest-green/70
              text-white font-baloo text-xl font-bold
              shadow-2xl shadow-black/30
              hover:brightness-110 active:scale-95 active:border-b-0 active:mt-1
              transition-all cursor-pointer text-center
            "
            id="rhyme-continue-btn"
          >
            Continue 🌱
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
