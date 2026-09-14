// src/components/rewards/ConfettiBalloons.tsx
// Level 2 — full-screen balloon burst reward.
// Cluster of 20 colorful, glossy birthday balloons (dominant hue: child.favouriteColor + 3 complements).
// Slower, buoyant float (4.5s–5.5s) with staggered launch (0–1.5s) and gentle sinusoidal horizontal sway.
// All balloons have pointer-events: none, ensuring zero interference with taps.
// Embedded mode (no onContinue) preserved for CakeCuttingParty / PartyScene.

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./balloons.css";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  decay: number;
}

interface ConfettiBalloonsProps {
  color: string; // hex or CSS color string from child.favouriteColor
  active: boolean;
  onContinue?: () => void; // Optional — when provided, component renders as a full-screen overlay with Continue button
}

interface BalloonConfig {
  id: number;
  left: string;
  delay: number;
  duration: number;
  swayDuration: number;
  width: number;
  height: number;
  color: string;
  sway1: string;
  rot1: string;
  sway2: string;
  rot2: string;
}

function playChime() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25]; // C5, E5 — cheerful two-tone chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.18 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.55);
    });
  } catch {
    // Web Audio not available — silent fallback
  }
}

// 20 balloons: child.favouriteColor as dominant hue (~45%), plus 3 complementary festive birthday colors
function generateFestiveBalloonConfigs(dominantColor: string): BalloonConfig[] {
  const festivePool = [
    "#FFD166", // Sunshine Gold
    "#06D6A0", // Mint Emerald
    "#118AB2", // Ocean Sky Blue
    "#FF6F59", // Festive Coral
    "#B5179E", // Royal Violet
    "#F72585", // Neon Rose
    "#4CC9F0", // Electric Cyan
  ];

  const complements = festivePool
    .filter((c) => c.toLowerCase() !== dominantColor.toLowerCase())
    .slice(0, 3);

  // 20-color distribution: dominantColor appears 9 times (~45%)
  const colorPattern = [
    dominantColor,
    complements[0] || "#FFD166",
    dominantColor,
    dominantColor,
    complements[1] || "#06D6A0",
    dominantColor,
    complements[2] || "#FF6F59",
    dominantColor,
    complements[0] || "#FFD166",
    dominantColor,
    complements[1] || "#06D6A0",
    dominantColor,
    dominantColor,
    complements[2] || "#FF6F59",
    complements[0] || "#FFD166",
    dominantColor,
    complements[1] || "#06D6A0",
    dominantColor,
    complements[2] || "#FF6F59",
    dominantColor,
  ];

  return Array.from({ length: 20 }, (_, i) => {
    // 1. Randomized left starting position across viewport (not evenly spaced)
    const randomLeft = 4 + Math.random() * 88;
    const left = `${randomLeft.toFixed(1)}%`;

    // 2. Randomized staggered start times spread across 0.0s to 1.5s
    const delay = Number((Math.random() * 1.5).toFixed(2));

    // 3. Randomized rise duration slightly per balloon (4.5s to 5.5s)
    const duration = Number((4.5 + Math.random() * 1.0).toFixed(2));

    // 4. Sway oscillation duration (1.6s to 2.4s) repeating infinitely
    const swayDuration = Number((1.6 + Math.random() * 0.8).toFixed(2));

    // 5. Realistic balloon sizes: width 48px to 72px
    const width = Math.floor(48 + Math.random() * 24);
    const height = Math.round(width * 1.25);

    // 6. Randomized gentle horizontal sway amplitudes and tilts
    const dir = Math.random() > 0.5 ? 1 : -1;
    const swayAmp = 15 + Math.random() * 16; // 15px to 31px
    const rotAmp = 4 + Math.random() * 6;    // 4deg to 10deg

    return {
      id: i,
      left,
      delay,
      duration,
      swayDuration,
      width,
      height,
      color: colorPattern[i] || dominantColor,
      sway1: `${(dir * swayAmp).toFixed(1)}px`,
      rot1: `${(dir * rotAmp).toFixed(1)}deg`,
      sway2: `${(-dir * (swayAmp * 0.9)).toFixed(1)}px`,
      rot2: `${(-dir * (rotAmp * 0.8)).toFixed(1)}deg`,
    };
  });
}

export default function ConfettiBalloons({ color, active, onContinue }: ConfettiBalloonsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const particles = useRef<Particle[]>([]);
  const balloonConfigs = useRef<BalloonConfig[]>([]);

  if (balloonConfigs.current.length === 0) {
    balloonConfigs.current = generateFestiveBalloonConfigs(color);
  }

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  // Audio chime
  useEffect(() => {
    if (!active) return;
    playChime();
  }, [active]);

  // Canvas confetti animation for embedded mode only
  useEffect(() => {
    if (!active || onContinue) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const palette = [color, "#F4D35E", "#F2A6B0", "#7FB069", "#A8DADC", "#F4A259", "#B784A7", "#FF6B6B"];
    const count = 120;
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height * 0.8 + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * -14 - 4,
      radius: Math.random() * 6 + 3,
      color: palette[Math.floor(Math.random() * palette.length)],
      life: 1,
      decay: Math.random() * 0.008 + 0.005,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.life > 0);

      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.life -= p.decay;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (particles.current.length > 0) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      particles.current = [];
    };
  }, [active, onContinue, color]);

  if (!active) return null;

  // ── Embedded mode (no onContinue) — used inside CakeCuttingParty/PartyScene ──
  if (!onContinue) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
        {[
          { left: "15%", delay: 0, size: 52 },
          { left: "35%", delay: 0.3, size: 60 },
          { left: "55%", delay: 0.15, size: 48 },
          { left: "75%", delay: 0.45, size: 56 },
          { left: "85%", delay: 0.05, size: 44 },
        ].map((cfg, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 text-center select-none"
            style={{ left: cfg.left, fontSize: cfg.size }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -600, opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 3.5,
              delay: cfg.delay,
              ease: "easeOut",
              opacity: { times: [0, 0.1, 0.75, 1] },
            }}
          >
            🎈
          </motion.div>
        ))}
      </div>
    );
  }

  // ── Full-screen mode (onContinue provided) — Level 2 Standalone Reward ──
  return (
    <div
      className="fixed inset-0 z-[60] overflow-hidden allow-motion"
      aria-label="Balloon burst celebration"
      role="region"
      style={{
        background: `linear-gradient(180deg, #87CEEB 0%, #B0E0FF 40%, ${color}33 80%, ${color}55 100%)`,
      }}
    >
      {/* ── Direct DOM Keyframes Fallback (immune to CSS bundler purging) ── */}
      <style>{`
        @keyframes balloonRise {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          8% {
            opacity: 0.98;
          }
          80% {
            opacity: 0.98;
          }
          100% {
            transform: translateY(calc(-100vh - 240px));
            opacity: 0;
          }
        }

        @keyframes balloonDrift {
          0%, 100% {
            transform: translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateX(var(--sway-1, 20px)) rotate(var(--rot-1, 6deg));
          }
          50% {
            transform: translateX(0px) rotate(0deg);
          }
          75% {
            transform: translateX(var(--sway-2, -20px)) rotate(var(--rot-2, -6deg));
          }
        }
      `}</style>

      {/* ── 20 Glossy Floating Balloons (Pure CSS Staggered Float) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden allow-motion" aria-hidden="true">
        {balloonConfigs.current.map((b) => (
          <div
            key={b.id}
            className="balloon-rise-item allow-motion"
            style={{
              left: b.left,
              bottom: "-140px",
              animationName: "balloonRise",
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              animationFillMode: "both",
              animationPlayState: "running",
            }}
          >
            <div
              className="balloon-drift-inner allow-motion"
              style={
                {
                  animationName: "balloonDrift",
                  animationDuration: `${b.swayDuration}s`,
                  animationDelay: `${b.delay}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationFillMode: "both",
                  animationPlayState: "running",
                  "--sway-1": b.sway1,
                  "--rot-1": b.rot1,
                  "--sway-2": b.sway2,
                  "--rot-2": b.rot2,
                } as React.CSSProperties
              }
            >
              {/* Glossy Balloon Body */}
              <div
                className="relative pointer-events-none"
                style={{
                  width: b.width,
                  height: b.height,
                  borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                  background: `radial-gradient(circle at 30% 26%, #ffffff 0%, rgba(255, 255, 255, 0.65) 15%, ${b.color} 48%, color-mix(in srgb, ${b.color} 65%, black) 100%)`,
                  boxShadow: `inset -4px -6px 14px rgba(0,0,0,0.22), 0 12px 28px rgba(0,0,0,0.14)`,
                }}
              >
                {/* Specular curved reflection highlight near top-left */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: "14%",
                    left: "16%",
                    width: "22%",
                    height: "32%",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 75%)",
                    transform: "rotate(-32deg)",
                  }}
                />

                {/* Balloon knot at bottom center */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: -5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderBottom: `7px solid ${b.color}`,
                    filter: "brightness(0.75)",
                  }}
                />

                {/* Gentle wavy string hanging from knot */}
                <svg
                  className="absolute left-1/2 -translate-x-1/2 overflow-visible pointer-events-none"
                  style={{ top: "100%", width: 14, height: 48 }}
                  viewBox="0 0 14 48"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7 0 C12 12, 2 24, 8 36 T 7 48"
                    stroke="rgba(255, 255, 255, 0.55)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Celebration text center */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 18 }}
      >
        <span className="text-8xl sm:text-9xl animate-bounce drop-shadow-lg" aria-hidden="true">
          🎉
        </span>
        <p
          className="font-baloo text-4xl sm:text-5xl font-extrabold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] text-center px-4"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.35)" }}
        >
          Amazing!
        </p>
        <p
          className="font-fredoka text-lg text-white/90 text-center px-8 drop-shadow-md"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
        >
          Watch the balloons float up high! 🎈
        </p>
      </motion.div>

      {/* ── Continue button — bottom floating with safe-area inset (no dark scrim) */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-20 flex justify-center px-6 pointer-events-none"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.5rem)" }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className="w-full max-w-sm flex justify-center pointer-events-auto">
          <button
            onClick={onContinue}
            className="
              w-full px-8 py-4 rounded-3xl
              bg-gradient-to-r from-forest-green to-leaf-green
              border-b-4 border-forest-green/70
              text-white font-baloo text-xl font-bold
              shadow-2xl shadow-black/50 drop-shadow-xl
              hover:brightness-110 active:scale-95 active:border-b-0 active:mt-1
              transition-all cursor-pointer text-center
            "
            id="confetti-continue-btn"
          >
            Continue 🌱
          </button>
        </div>
      </motion.div>
    </div>
  );
}
