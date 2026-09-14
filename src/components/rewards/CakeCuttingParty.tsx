// src/components/rewards/CakeCuttingParty.tsx
// Level 5 — Multi-Stage Cake-Cutting Party (~20-30s).
//
// Internal Stages:
//   Stage 1: Party starts (character bounce gesture, text "Let's cut the cake!", Web Audio BGM, auto-advances ~2.5s)
//   Stage 2: Child cuts the cake (interactive touch/pointer swipe detection across cake, halves split on success, forgiving retry)
//   Stage 3: Immediate celebration (immediate response, ConfettiBalloons, synthesized cheer sound, character jump/clap, auto-advances ~2.5s)
//   Stage 4: Cake reward (cake slice offered toward viewer/character, happy scale bounce, sparkles, "Great job!", auto-advances ~2.8s)
//   Stage 5: Party ending (character dance loop, music continues, waving pose, Continue button to call onComplete)

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ConfettiBalloons from "./ConfettiBalloons";
import { CAKE_THEMES } from "../../constants/cakeThemes";
import type { Child, FavouriteAnimal } from "../../types/child";

interface CakeCuttingPartyProps {
  child: Child;
  onComplete: () => void;
}

type PartyStage = 1 | 2 | 3 | 4 | 5;

// Animal emojis mapping
const ANIMAL_EMOJI: Record<FavouriteAnimal, string> = {
  rabbit:    "🐰",
  fox:       "🦊",
  owl:       "🦉",
  butterfly: "🦋",
  turtle:    "🐢",
  bird:      "🐦",
  cat:       "🐱",
  dog:       "🐶",
  unicorn:   "🦄",
  dinosaur:  "🦕",
};

// ── Web Audio Synthesizers ───────────────────────────────────────────────────

class PartyMusicSynthesizer {
  private ctx: AudioContext | null = null;
  private intervalId: number | null = null;
  private isPlaying: boolean = false;

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.isPlaying = true;

      // Cheerful gentle C-major melody loop (C4, E4, G4, A4, G4, E4, D4, C4, E4, G4, C5, A4, G4, E4, D4, C4)
      const melody = [
        261.63, 329.63, 392.00, 440.00,
        392.00, 329.63, 293.66, 261.63,
        329.63, 392.00, 523.25, 440.00,
        392.00, 329.63, 293.66, 261.63,
      ];
      let noteIdx = 0;

      const playNote = () => {
        if (!this.ctx || this.ctx.state === "closed") return;
        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        const freq = melody[noteIdx % melody.length];
        noteIdx++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Warm, soft triangle wave
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.3);
      };

      playNote();
      this.intervalId = window.setInterval(playNote, 320);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}

function playCelebrationCheer() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Noise burst (applause / whoosh simulation)
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1300;
    bandpass.Q.value = 1.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.16, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();

    // Ascending celebratory chimes: E5, G5, C6
    const chimes = [659.25, 783.99, 1046.50];
    chimes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.08);
      oscGain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.32);
    });

    setTimeout(() => {
      try { ctx.close(); } catch {}
    }, 800);
  } catch {}
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CakeCuttingParty({ child, onComplete }: CakeCuttingPartyProps) {
  const [stage, setStage] = useState<PartyStage>(1);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [hasCutSuccessfully, setHasCutSuccessfully] = useState(false);

  const startPointerRef = useRef<{ x: number; y: number } | null>(null);
  const musicRef = useRef<PartyMusicSynthesizer | null>(null);

  const cakeTheme = CAKE_THEMES[child.stickerTheme] ?? CAKE_THEMES.forest;
  const animalEmoji = ANIMAL_EMOJI[child.favouriteAnimal] ?? "🐰";

  // Start background music loop on mount, stop on unmount
  useEffect(() => {
    const music = new PartyMusicSynthesizer();
    musicRef.current = music;
    music.start();

    return () => {
      music.stop();
    };
  }, []);

  // Auto-advance for Stage 1 -> Stage 2 (~2.5s)
  useEffect(() => {
    if (stage === 1) {
      const timer = setTimeout(() => {
        setStage(2);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Auto-advance for Stage 3 -> Stage 4 (~2.6s)
  useEffect(() => {
    if (stage === 3) {
      const timer = setTimeout(() => {
        setStage(4);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Auto-advance for Stage 4 -> Stage 5 (~2.8s)
  useEffect(() => {
    if (stage === 4) {
      const timer = setTimeout(() => {
        setStage(5);
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Handle pointer swipe gesture across the cake (touch + mouse compatible)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (stage !== 2 || hasCutSuccessfully) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    setIsSwiping(true);
    setSwipeDistance(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSwiping || !startPointerRef.current || stage !== 2 || hasCutSuccessfully) return;
    const dx = e.clientX - startPointerRef.current.x;
    const dy = e.clientY - startPointerRef.current.y;
    const dist = Math.hypot(dx, dy);
    setSwipeDistance(dist);

    // Threshold check (50px swipe across cake)
    if (dist >= 50) {
      triggerSuccessfulCut();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isSwiping) return;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}

    if (!hasCutSuccessfully) {
      // Incomplete swipe allows child to try again immediately
      setIsSwiping(false);
      setSwipeDistance(0);
      startPointerRef.current = null;
    }
  };

  const triggerSuccessfulCut = () => {
    if (hasCutSuccessfully) return;
    setHasCutSuccessfully(true);
    setIsSwiping(false);
    startPointerRef.current = null;

    // Trigger immediate sound and transition to Stage 3
    playCelebrationCheer();
    setStage(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bark-brown/95 backdrop-blur-md p-4 overflow-hidden select-none">
      {/* Confetti and Balloons layer for Stages 3, 4, 5 */}
      {stage >= 3 && (
        <ConfettiBalloons color={child.favouriteColor} active />
      )}

      {/* Main Party Modal Container */}
      <div className="relative w-full max-w-lg bg-cream-bg rounded-3xl p-6 border-4 border-sunshine-yellow shadow-2xl flex flex-col items-center gap-5 overflow-hidden min-h-[460px] justify-between">
        
        {/* Background party decorative garland & balloons */}
        <div className="absolute top-0 inset-x-0 flex justify-between px-6 pt-2 pointer-events-none opacity-80" aria-hidden="true">
          <span className="text-2xl animate-pulse">🎈</span>
          <span className="text-sm font-fredoka text-soil-brown/40 mt-1">✨ 🍰 ✨</span>
          <span className="text-2xl animate-pulse delay-150">🎈</span>
        </div>

        {/* ── STAGE HEADERS & PROMPTS ────────────────────────────────────── */}
        <div className="text-center mt-2 z-10">
          <AnimatePresence mode="wait">
            {stage === 1 && (
              <motion.div
                key="stage-1-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <span className="inline-block bg-sunshine-yellow/30 text-bark-brown font-fredoka text-xs font-bold px-3 py-1 rounded-full mb-1">
                  🎉 Level 5 Party!
                </span>
                <h2 className="font-baloo text-3xl font-extrabold text-bark-brown">
                  Let's cut the cake! 🎂
                </h2>
                <p className="font-fredoka text-sm text-soil-brown/70 mt-1">
                  Get ready for {child.name}'s special celebration!
                </p>
              </motion.div>
            )}

            {stage === 2 && (
              <motion.div
                key="stage-2-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <span className="inline-block bg-flower-orange/20 text-flower-orange font-fredoka text-xs font-bold px-3 py-1 rounded-full mb-1">
                  ✨ Interactive Slice
                </span>
                <h2 className="font-baloo text-3xl font-extrabold text-bark-brown">
                  Swipe across the cake!
                </h2>
                <p className="font-fredoka text-sm text-soil-brown/80 mt-1">
                  Use your finger or mouse to make a clean slice across the cake!
                </p>
              </motion.div>
            )}

            {stage === 3 && (
              <motion.div
                key="stage-3-header"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <span className="inline-block bg-leaf-green/20 text-forest-green font-fredoka text-xs font-bold px-3 py-1 rounded-full mb-1">
                  👏 Yaaay!
                </span>
                <h2 className="font-baloo text-3xl font-extrabold text-forest-green">
                  Hurray! Perfectly cut! 🎉
                </h2>
                <p className="font-fredoka text-sm text-soil-brown/70 mt-1">
                  Look at that clean cut! Let's party!
                </p>
              </motion.div>
            )}

            {stage === 4 && (
              <motion.div
                key="stage-4-header"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <span className="inline-block bg-flower-pink/20 text-flower-pink font-fredoka text-xs font-bold px-3 py-1 rounded-full mb-1">
                  🍰 Sweet Reward
                </span>
                <h2 className="font-baloo text-3xl font-extrabold text-bark-brown">
                  Great job, {child.name}! ⭐
                </h2>
                <p className="font-fredoka text-sm text-soil-brown/70 mt-1">
                  Here's your special celebratory slice!
                </p>
              </motion.div>
            )}

            {stage === 5 && (
              <motion.div
                key="stage-5-header"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="inline-block bg-sunshine-yellow/30 text-bark-brown font-fredoka text-xs font-bold px-3 py-1 rounded-full mb-1">
                  🌟 Celebration Complete!
                </span>
                <h2 className="font-baloo text-3xl font-extrabold text-bark-brown">
                  Party Dance Time! 💃
                </h2>
                <p className="font-fredoka text-sm text-soil-brown/70 mt-1">
                  You did fantastic! Ready to claim your Level 5 reward?
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── CENTRAL STAGE SCENE ───────────────────────────────────────── */}
        <div className="relative w-full h-56 flex items-center justify-center">

          {/* Character View */}
          <div className="absolute left-6 bottom-4 z-20 flex flex-col items-center">
            {/* Stage 1: Bounce & point toward cake */}
            {stage === 1 && (
              <motion.div
                animate={{
                  y: [0, -18, 0],
                  rotate: [0, 8, -6, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl sm:text-7xl select-none filter drop-shadow-md"
                role="img"
                aria-label={child.favouriteAnimal}
              >
                {animalEmoji}
              </motion.div>
            )}

            {/* Stage 2: Watching eagerly */}
            {stage === 2 && (
              <motion.div
                animate={{
                  y: [0, -6, 0],
                  rotate: [-3, 3, -3],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl sm:text-7xl select-none filter drop-shadow-md"
                role="img"
                aria-label={child.favouriteAnimal}
              >
                {animalEmoji}
              </motion.div>
            )}

            {/* Stage 3: Celebration jump & clap */}
            {stage === 3 && (
              <motion.div
                animate={{
                  y: [0, -32, 0, -20, 0],
                  scale: [1, 1.25, 1, 1.15, 1],
                  rotate: [0, -10, 10, -5, 0],
                }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl sm:text-7xl select-none filter drop-shadow-md"
                role="img"
                aria-label={child.favouriteAnimal}
              >
                {animalEmoji}
              </motion.div>
            )}

            {/* Stage 4: Happy reaction with sparkles */}
            {stage === 4 && (
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 6, -6, 0],
                }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                className="relative text-6xl sm:text-7xl select-none filter drop-shadow-md"
                role="img"
                aria-label={child.favouriteAnimal}
              >
                {animalEmoji}
                <motion.span
                  className="absolute -top-3 -right-3 text-2xl select-none"
                  animate={{ scale: [0.8, 1.4, 0.8], rotate: [0, 360] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              </motion.div>
            )}

            {/* Stage 5: Character dance loop & waving */}
            {stage === 5 && (
              <motion.div
                animate={{
                  y: [0, -14, 0, -10, 0],
                  rotate: [-8, 8, -6, 6, 0],
                  scale: [1, 1.08, 1, 1.05, 1],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="relative text-6xl sm:text-7xl select-none filter drop-shadow-md"
                role="img"
                aria-label={child.favouriteAnimal}
              >
                {animalEmoji}
                <motion.span
                  className="absolute -top-3 -right-2 text-2xl"
                  animate={{ rotate: [-20, 20, -20] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  👋
                </motion.span>
              </motion.div>
            )}
          </div>

          {/* Interactive Cake Area (Stages 1-3) */}
          {stage <= 3 && (
            <div
              className={`
                relative w-52 h-44 flex items-center justify-center touch-none select-none
                ${stage === 2 ? "cursor-grab active:cursor-grabbing" : ""}
              `}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              id="interactive-cake-target"
              aria-label="Swipeable cake"
            >
              {/* Left Cake Half */}
              <motion.div
                className="absolute left-0 w-26 h-44 overflow-hidden"
                animate={stage >= 3 || hasCutSuccessfully ? { x: -36, rotate: -8 } : { x: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
              >
                <div className="absolute left-0 w-52 h-44 flex flex-col items-center">
                  {/* Candles */}
                  <div className="flex gap-2 mb-1 justify-center w-full" aria-hidden="true">
                    <span className="text-xl animate-bounce">🕯️</span>
                    <span className="text-xl animate-bounce delay-75">🕯️</span>
                  </div>
                  {/* Top Tier */}
                  <div
                    className="rounded-t-2xl w-32 h-10 flex items-center justify-center shadow-md border border-white/30"
                    style={{ backgroundColor: cakeTheme.accentColor }}
                  >
                    <span className="text-lg">🎂</span>
                  </div>
                  {/* Bottom Tier */}
                  <div
                    className="rounded-b-2xl w-44 h-16 flex items-center justify-around shadow-lg border-2 border-white/40 px-2"
                    style={{ backgroundColor: cakeTheme.accentColor }}
                  >
                    {cakeTheme.topperEmojis.slice(0, 2).map((emoji, idx) => (
                      <span key={idx} className="text-xl">{emoji}</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Right Cake Half */}
              <motion.div
                className="absolute right-0 w-26 h-44 overflow-hidden"
                animate={stage >= 3 || hasCutSuccessfully ? { x: 36, rotate: 8 } : { x: 0, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14 }}
              >
                <div className="absolute right-0 w-52 h-44 flex flex-col items-center">
                  {/* Candles */}
                  <div className="flex gap-2 mb-1 justify-center w-full" aria-hidden="true">
                    <span className="text-xl animate-bounce delay-150">🕯️</span>
                  </div>
                  {/* Top Tier */}
                  <div
                    className="rounded-t-2xl w-32 h-10 flex items-center justify-center shadow-md border border-white/30"
                    style={{ backgroundColor: cakeTheme.accentColor }}
                  >
                    <span className="text-lg">✨</span>
                  </div>
                  {/* Bottom Tier */}
                  <div
                    className="rounded-b-2xl w-44 h-16 flex items-center justify-around shadow-lg border-2 border-white/40 px-2"
                    style={{ backgroundColor: cakeTheme.accentColor }}
                  >
                    {cakeTheme.topperEmojis.slice(2, 4).map((emoji, idx) => (
                      <span key={idx} className="text-xl">{emoji}</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Swipe guidance indicator for Stage 2 */}
              {stage === 2 && !hasCutSuccessfully && (
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Dotted cut line */}
                  <div className="w-0.5 h-32 border-l-2 border-dashed border-white drop-shadow-md" />

                  {/* Animated slicing knife hand icon */}
                  <motion.div
                    className="absolute text-3xl select-none drop-shadow-md"
                    animate={{
                      y: [-30, 30],
                      x: [-15, 15],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  >
                    🔪
                  </motion.div>
                </motion.div>
              )}
            </div>
          )}

          {/* Stage 4: Cake Slice Being Offered */}
          {stage === 4 && (
            <motion.div
              className="relative flex flex-col items-center z-30"
              initial={{ scale: 0.2, y: 70, opacity: 0 }}
              animate={{ scale: 1.25, y: 0, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 220, damping: 16 }}
            >
              <div className="w-28 h-28 bg-white/90 rounded-full shadow-2xl border-4 border-sunshine-yellow flex items-center justify-center">
                <span className="text-6xl animate-bounce">🍰</span>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-2xl animate-spin">✨</span>
                <span className="font-baloo text-lg font-bold text-soil-brown">For You!</span>
                <span className="text-2xl animate-spin">✨</span>
              </div>
            </motion.div>
          )}

          {/* Stage 5: Party dance floor & Silhouettes */}
          {stage === 5 && (
            <div className="relative flex flex-col items-center z-20">
              <motion.div
                className="flex items-center gap-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {/* Decorative dancing silhouettes */}
                <motion.span
                  className="text-4xl select-none opacity-60"
                  animate={{ y: [0, -10, 0], rotate: [-10, 10, -10] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                >
                  🦋
                </motion.span>
                <div className="text-5xl select-none">🎂</div>
                <motion.span
                  className="text-4xl select-none opacity-60"
                  animate={{ y: [0, -10, 0], rotate: [10, -10, 10] }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                >
                  🐦
                </motion.span>
              </motion.div>
              <div className="mt-4 px-4 py-1.5 rounded-full bg-sunshine-yellow/30 border border-sunshine-yellow/50">
                <p className="font-fredoka text-xs font-semibold text-bark-brown text-center">
                  🎵 Cheerful celebration music playing 🎵
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ── BOTTOM CONTROLS & STATUS ──────────────────────────────────── */}
        <div className="w-full flex justify-center z-20">
          {stage === 1 && (
            <div className="h-14 flex items-center">
              <span className="font-fredoka text-xs text-soil-brown/60 animate-pulse">
                Preparing the party... 🌱
              </span>
            </div>
          )}

          {stage === 2 && (
            <div className="h-14 flex flex-col items-center justify-center">
              <span className="font-fredoka text-xs text-soil-brown/70 font-medium">
                {isSwiping
                  ? `Swipe distance: ${Math.round(swipeDistance)}px / 50px`
                  : "Touch/click & drag across the cake to cut"}
              </span>
            </div>
          )}

          {stage === 3 && (
            <div className="h-14 flex items-center">
              <span className="font-fredoka text-xs text-forest-green font-bold animate-bounce">
                🎉 Celebration in full swing! 🎉
              </span>
            </div>
          )}

          {stage === 4 && (
            <div className="h-14 flex items-center">
              <span className="font-fredoka text-xs text-soil-brown/60">
                Offering reward slice... ⭐
              </span>
            </div>
          )}

          {stage === 5 && (
            <motion.button
              onClick={onComplete}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="
                w-full max-w-xs px-8 py-4 rounded-2xl
                bg-gradient-to-r from-forest-green to-leaf-green
                border-b-4 border-forest-green/80
                text-white font-baloo text-xl font-bold
                shadow-xl shadow-forest-green/25
                hover:brightness-105 cursor-pointer text-center
              "
              id="cake-party-continue-btn"
            >
              Continue 🌱
            </motion.button>
          )}
        </div>

      </div>
    </div>
  );
}
