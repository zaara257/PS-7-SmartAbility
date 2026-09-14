// src/components/ui/FloatingBackground.tsx
// Ambient decorative background layer — pointer-events-none, behind all UI.
//
// Density options:
//   "low"    — 2 clouds, 2 butterflies (landing/home pages)
//   "medium" — 3 clouds, 4 butterflies (general use)
//   "lush"   — 3 clouds, 8 butterflies + leaf drifters + side vines (child garden page)
//
// All elements respect prefers-reduced-motion (static placement, no animation).

import { motion } from "framer-motion";

interface FloatingBackgroundProps {
  density?: "low" | "medium" | "lush";
}

// ── SVG Components ────────────────────────────────────────────────────────────

function CloudSVG() {
  return (
    <svg viewBox="0 0 120 80" className="w-full h-full text-white/50" fill="currentColor">
      <path d="M30 50 C30 41.7 36.7 35 45 35 C46.8 35 48.5 35.3 50.1 35.9 C54 27.6 62.5 22 72.5 22 C85.5 22 96 32.5 96 45.5 C96 46.7 95.9 47.8 95.7 48.9 C100.9 50.1 105 54.7 105 60 C105 66.6 99.6 72 93 72 L37 72 C31.5 72 27 67.5 27 62 C27 57.2 30.5 53 35.1 52.1 C35 51.4 35 50.7 30 50 Z" />
    </svg>
  );
}

function ButterflySVG({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" style={{ color }} fill="currentColor">
      {/* Left upper wing */}
      <path d="M30 30 C18 18 5 18 11 30 C17 42 24 36 30 30 Z" opacity="0.85" />
      {/* Left lower wing */}
      <path d="M30 30 C18 30 10 38 15 46 C20 54 27 42 30 30 Z" opacity="0.75" />
      {/* Right upper wing */}
      <path d="M30 30 C42 18 55 18 49 30 C43 42 36 36 30 30 Z" opacity="0.85" />
      {/* Right lower wing */}
      <path d="M30 30 C42 30 50 38 45 46 C40 54 33 42 30 30 Z" opacity="0.75" />
      {/* Body & Antennae */}
      <ellipse cx="30" cy="33" rx="1.5" ry="12" fill="#6B4A3D" />
      <path d="M29 22 Q24 15 22 17" stroke="#6B4A3D" strokeWidth="1" fill="none" />
      <path d="M31 22 Q36 15 38 17" stroke="#6B4A3D" strokeWidth="1" fill="none" />
    </svg>
  );
}

// Small leaf SVG for gentle drifting
function LeafSVG({ color = "#7FB069" }: { color?: string }) {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" fill={color}>
      <path
        d="M20 2 C20 2 36 10 36 24 C36 32 28 38 20 38 C20 38 4 30 4 18 C4 8 20 2 20 2 Z"
        opacity="0.85"
      />
      {/* Central vein */}
      <path d="M20 38 Q18 20 20 2" stroke="rgba(0,0,0,0.2)" strokeWidth="1" fill="none" />
    </svg>
  );
}

// Decorative side vine SVG — rendered as tall narrow strip on each side edge
function VineSVG({ side }: { side: "left" | "right" }) {
  const flip = side === "right" ? "scale(-1,1)" : undefined;
  return (
    <svg
      viewBox="0 0 60 400"
      className="w-full h-full"
      fill="none"
      style={{ transform: flip }}
    >
      {/* Main stem */}
      <path
        d="M30 400 C28 340 34 300 28 260 C22 220 36 180 28 140 C20 100 34 60 30 10"
        stroke="#4A7C59"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Leaf clusters along the vine */}
      <ellipse cx="20" cy="360" rx="14" ry="9" fill="#7FB069" opacity="0.55" transform="rotate(-30 20 360)" />
      <ellipse cx="36" cy="310" rx="12" ry="8" fill="#4A7C59" opacity="0.5" transform="rotate(25 36 310)" />
      <ellipse cx="18" cy="260" rx="15" ry="9" fill="#7FB069" opacity="0.6" transform="rotate(-20 18 260)" />
      <ellipse cx="38" cy="210" rx="11" ry="7" fill="#A8DADC" opacity="0.45" transform="rotate(35 38 210)" />
      <ellipse cx="16" cy="160" rx="13" ry="8" fill="#7FB069" opacity="0.55" transform="rotate(-15 16 160)" />
      <ellipse cx="35" cy="110" rx="12" ry="7" fill="#4A7C59" opacity="0.5" transform="rotate(28 35 110)" />
      <ellipse cx="22" cy="65" rx="10" ry="6" fill="#7FB069" opacity="0.45" transform="rotate(-22 22 65)" />
      {/* Tiny flower accents */}
      <circle cx="24" cy="335" r="4" fill="#F2A6B0" opacity="0.6" />
      <circle cx="34" cy="235" r="3.5" fill="#F4D35E" opacity="0.55" />
      <circle cx="26" cy="135" r="4" fill="#F2A6B0" opacity="0.5" />
    </svg>
  );
}

// ── Item configs ──────────────────────────────────────────────────────────────

const LOW_ITEMS = [
  { type: "cloud", top: "15%", left: "-10%", scale: 1.2, duration: 40, delay: 0 },
  { type: "cloud", top: "55%", left: "105%", scale: 0.9, duration: 48, delay: 5, direction: -1 },
  { type: "butterfly", color: "#A8DADC", top: "35%", left: "15%", scale: 0.7, durationX: 18, durationY: 6, delay: 0 },
  { type: "butterfly", color: "#F2A6B0", top: "65%", left: "75%", scale: 0.8, durationX: 22, durationY: 8, delay: 2 },
];

const MEDIUM_ITEMS = [
  { type: "cloud", top: "10%", left: "-10%", scale: 1.0, duration: 45, delay: 0 },
  { type: "cloud", top: "45%", left: "105%", scale: 1.3, duration: 52, delay: 3, direction: -1 },
  { type: "cloud", top: "75%", left: "-15%", scale: 0.8, duration: 38, delay: 6 },
  { type: "butterfly", color: "#A8DADC", top: "25%", left: "20%", scale: 0.65, durationX: 16, durationY: 5, delay: 0 },
  { type: "butterfly", color: "#F2A6B0", top: "50%", left: "80%", scale: 0.75, durationX: 20, durationY: 7, delay: 1 },
  { type: "butterfly", color: "#B784A7", top: "80%", left: "30%", scale: 0.7, durationX: 24, durationY: 9, delay: 3 },
  { type: "butterfly", color: "#F4A259", top: "15%", left: "70%", scale: 0.6, durationX: 18, durationY: 6, delay: 2 },
];

// Lush = medium clouds + 8 butterflies + leaf drifters + side vines
const LUSH_BUTTERFLY_ITEMS = [
  { type: "butterfly", color: "#A8DADC", top: "18%", left: "12%",  scale: 0.7,  durationX: 16, durationY: 5,  delay: 0   },
  { type: "butterfly", color: "#F2A6B0", top: "42%", left: "82%",  scale: 0.8,  durationX: 20, durationY: 7,  delay: 1   },
  { type: "butterfly", color: "#B784A7", top: "72%", left: "25%",  scale: 0.65, durationX: 24, durationY: 9,  delay: 2.5 },
  { type: "butterfly", color: "#F4A259", top: "12%", left: "65%",  scale: 0.6,  durationX: 18, durationY: 6,  delay: 1.5 },
  { type: "butterfly", color: "#7FB069", top: "55%", left: "50%",  scale: 0.75, durationX: 22, durationY: 8,  delay: 3   },
  { type: "butterfly", color: "#F4D35E", top: "30%", left: "40%",  scale: 0.55, durationX: 14, durationY: 5,  delay: 0.5 },
  { type: "butterfly", color: "#A8DADC", top: "85%", left: "70%",  scale: 0.8,  durationX: 26, durationY: 10, delay: 4   },
  { type: "butterfly", color: "#F2A6B0", top: "65%", left: "88%",  scale: 0.6,  durationX: 19, durationY: 7,  delay: 2   },
];

const LUSH_LEAF_ITEMS = [
  { color: "#7FB069", top: "5%",  left: "35%", scale: 0.9, durationY: 12, delay: 0   },
  { color: "#4A7C59", top: "20%", left: "60%", scale: 0.7, durationY: 16, delay: 2   },
  { color: "#7FB069", top: "40%", left: "45%", scale: 0.8, durationY: 14, delay: 4   },
  { color: "#A8DADC", top: "60%", left: "55%", scale: 0.65,durationY: 18, delay: 1   },
  { color: "#7FB069", top: "75%", left: "20%", scale: 0.75,durationY: 10, delay: 3   },
  { color: "#4A7C59", top: "10%", left: "78%", scale: 0.6, durationY: 15, delay: 5   },
];

export default function FloatingBackground({ density = "low" }: FloatingBackgroundProps) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const items =
    density === "low" ? LOW_ITEMS
    : density === "medium" ? MEDIUM_ITEMS
    : [...MEDIUM_ITEMS, ...LUSH_BUTTERFLY_ITEMS]; // lush = medium base + extra butterflies

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">

      {/* ── Side vines (lush only) ────────────────────────────────────────── */}
      {density === "lush" && (
        <>
          {/* Left vine */}
          <div
            className="absolute top-0 left-0 opacity-70"
            style={{ width: 56, height: "65%", bottom: 0, top: "auto" }}
          >
            {reduced ? (
              <VineSVG side="left" />
            ) : (
              <motion.div
                className="w-full h-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2.5, ease: "easeOut" }}
              >
                <VineSVG side="left" />
              </motion.div>
            )}
          </div>
          {/* Right vine */}
          <div
            className="absolute top-0 right-0 opacity-70"
            style={{ width: 56, height: "65%", bottom: 0, top: "auto" }}
          >
            {reduced ? (
              <VineSVG side="right" />
            ) : (
              <motion.div
                className="w-full h-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 0.4 }}
              >
                <VineSVG side="right" />
              </motion.div>
            )}
          </div>
        </>
      )}

      {/* ── Leaf drifters (lush only) ─────────────────────────────────────── */}
      {density === "lush" &&
        LUSH_LEAF_ITEMS.map((leaf, idx) => {
          const staticStyle: React.CSSProperties = {
            top: leaf.top,
            left: leaf.left,
            transform: `scale(${leaf.scale})`,
            position: "absolute",
          };
          if (reduced) {
            return (
              <div key={`leaf-${idx}`} style={staticStyle} className="opacity-50 w-8 h-8">
                <LeafSVG color={leaf.color} />
              </div>
            );
          }
          return (
            <motion.div
              key={`leaf-${idx}`}
              className="absolute w-8 h-8 opacity-55"
              style={{ top: leaf.top, left: leaf.left, scale: leaf.scale }}
              animate={{
                y: [0, 18, -8, 24, 0],
                rotate: [0, 12, -8, 15, 0],
                opacity: [0.55, 0.7, 0.5, 0.65, 0.55],
              }}
              transition={{
                duration: leaf.durationY,
                delay: leaf.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <LeafSVG color={leaf.color} />
            </motion.div>
          );
        })}

      {/* ── Clouds + Butterflies ──────────────────────────────────────────── */}
      {items.map((item, idx) => {
        const isCloud = item.type === "cloud";
        const scaleVal = item.scale;

        // Static rendering for prefers-reduced-motion
        if (reduced) {
          const staticStyle: React.CSSProperties = {
            top: item.top,
            left: isCloud
              ? (item as { direction?: number }).direction === -1 ? "75%" : "20%"
              : item.left,
            transform: `scale(${scaleVal})`,
            position: "absolute",
          };

          return (
            <div key={idx} style={staticStyle} className="opacity-70">
              {isCloud ? (
                <div className="w-40 h-28">
                  <CloudSVG />
                </div>
              ) : (
                <div className="w-10 h-10">
                  <ButterflySVG color={(item as { color: string }).color} />
                </div>
              )}
            </div>
          );
        }

        if (isCloud) {
          const cloudItem = item as { direction?: number; duration: number; delay: number };
          const startX = cloudItem.direction === -1 ? "110vw" : "-20vw";
          const endX = cloudItem.direction === -1 ? "-20vw" : "110vw";

          return (
            <motion.div
              key={idx}
              className="absolute"
              style={{ top: item.top, scale: scaleVal }}
              initial={{ x: startX }}
              animate={{ x: endX }}
              transition={{
                duration: cloudItem.duration,
                delay: cloudItem.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="w-44 h-32 opacity-60">
                <CloudSVG />
              </div>
            </motion.div>
          );
        } else {
          // Butterfly floating with flutter
          const b = item as {
            type: string; color: string; top: string; left: string;
            scale: number; durationX: number; durationY: number; delay: number;
          };

          return (
            <motion.div
              key={idx}
              className="absolute"
              style={{ top: b.top, left: b.left, scale: scaleVal }}
              animate={{
                x: [0, 60, -30, 40, 0],
                y: [0, -30, 40, -20, 0],
                rotate: [0, 15, -10, 12, 0],
              }}
              transition={{
                duration: b.durationX,
                delay: b.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Secondary container for rapid wing flutter */}
              <motion.div
                animate={{ scaleX: [1, 0.1, 1] }}
                transition={{
                  duration: 0.35 + Math.random() * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-12 h-12"
              >
                <ButterflySVG color={b.color} />
              </motion.div>
            </motion.div>
          );
        }
      })}
    </div>
  );
}
