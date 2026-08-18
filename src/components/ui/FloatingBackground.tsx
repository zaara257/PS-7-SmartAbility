import { motion } from "framer-motion";

interface FloatingBackgroundProps {
  density?: "low" | "medium";
}

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

export default function FloatingBackground({ density = "low" }: FloatingBackgroundProps) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Let's specify positions, scales, and speeds for items
  // Density "low" = 2 clouds, 2 butterflies
  // Density "medium" = 3 clouds, 4 butterflies
  const items = density === "low"
    ? [
        { type: "cloud", top: "15%", left: "-10%", scale: 1.2, duration: 40, delay: 0 },
        { type: "cloud", top: "55%", left: "105%", scale: 0.9, duration: 48, delay: 5, direction: -1 },
        { type: "butterfly", color: "#A8DADC", top: "35%", left: "15%", scale: 0.7, durationX: 18, durationY: 6, delay: 0 },
        { type: "butterfly", color: "#F2A6B0", top: "65%", left: "75%", scale: 0.8, durationX: 22, durationY: 8, delay: 2 },
      ]
    : [
        { type: "cloud", top: "10%", left: "-10%", scale: 1.0, duration: 45, delay: 0 },
        { type: "cloud", top: "45%", left: "105%", scale: 1.3, duration: 52, delay: 3, direction: -1 },
        { type: "cloud", top: "75%", left: "-15%", scale: 0.8, duration: 38, delay: 6 },
        { type: "butterfly", color: "#A8DADC", top: "25%", left: "20%", scale: 0.65, durationX: 16, durationY: 5, delay: 0 },
        { type: "butterfly", color: "#F2A6B0", top: "50%", left: "80%", scale: 0.75, durationX: 20, durationY: 7, delay: 1 },
        { type: "butterfly", color: "#B784A7", top: "80%", left: "30%", scale: 0.7, durationX: 24, durationY: 9, delay: 3 },
        { type: "butterfly", color: "#F4A259", top: "15%", left: "70%", scale: 0.6, durationX: 18, durationY: 6, delay: 2 },
      ];

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {items.map((item, idx) => {
        const isCloud = item.type === "cloud";
        const scaleVal = item.scale;

        // Static rendering for prefers-reduced-motion
        if (reduced) {
          const staticStyle = {
            top: item.top,
            // Position statically on screen
            left: isCloud
              ? item.direction === -1 ? "75%" : "20%"
              : item.left,
            transform: `scale(${scaleVal})`,
            position: "absolute" as const,
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
          // Cloud horizontal drifting
          const startX = item.direction === -1 ? "110vw" : "-20vw";
          const endX = item.direction === -1 ? "-20vw" : "110vw";

          return (
            <motion.div
              key={idx}
              className="absolute"
              style={{ top: item.top, scale: scaleVal }}
              initial={{ x: startX }}
              animate={{ x: endX }}
              transition={{
                duration: item.duration,
                delay: item.delay,
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
          const b = item as { type: string; color: string; top: string; left: string; scale: number; durationX: number; durationY: number; delay: number };
          
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
                animate={{
                  scaleX: [1, 0.1, 1],
                }}
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
