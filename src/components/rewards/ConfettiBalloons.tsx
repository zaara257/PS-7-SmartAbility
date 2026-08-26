// src/components/rewards/ConfettiBalloons.tsx
// Level 2 core visual — reusable, color driven by child.favouriteColor.
// Custom canvas particle burst (no canvas-confetti dependency).
// Chime synthesized via Web Audio API OscillatorNode, 2 alternating tones.

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number; // 0–1, decreasing
  decay: number;
}

interface ConfettiBalloonsProps {
  color: string; // hex or CSS color string from child.favouriteColor
  active: boolean;
}

// Derive a small palette from the child's favourite colour + complements
function buildPalette(base: string): string[] {
  return [base, "#F4D35E", "#F2A6B0", "#7FB069", "#A8DADC", "#F4A259"];
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

// Balloon emojis that float up
const BALLOON_CONFIGS = [
  { left: "15%", delay: 0,    size: 52 },
  { left: "35%", delay: 0.3,  size: 60 },
  { left: "55%", delay: 0.15, size: 48 },
  { left: "75%", delay: 0.45, size: 56 },
  { left: "85%", delay: 0.05, size: 44 },
];

export default function ConfettiBalloons({ color, active }: ConfettiBalloonsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const particles = useRef<Particle[]>([]);
  const palette = buildPalette(color);

  useEffect(() => {
    if (!active) return;

    playChime();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Spawn burst of particles from center-top
    const count = 80;
    particles.current = Array.from({ length: count }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 80,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() * -10) - 2,
      radius: Math.random() * 5 + 3,
      color: palette[Math.floor(Math.random() * palette.length)],
      life: 1,
      decay: Math.random() * 0.012 + 0.008,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((p) => p.life > 0);

      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
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
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Canvas particle layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* Floating balloons */}
      {BALLOON_CONFIGS.map((cfg, i) => (
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
