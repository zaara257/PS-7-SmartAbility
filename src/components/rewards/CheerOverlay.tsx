// src/components/rewards/CheerOverlay.tsx
// Reusable cheer/clapping layer — mountable over any Level 4 or 5 content.
// CSS clapping-hands animation + synthesized noise-burst via Web Audio.
// Does NOT manage its own timing — caller controls mount/unmount.

import { useEffect } from "react";
import { motion } from "framer-motion";

interface CheerOverlayProps {
  active: boolean;
}

function playCheer() {
  try {
    const ctx = new AudioContext();

    // Short celebratory noise-burst: layered filtered noise + pitch sweep
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1200;
    bandpass.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.4);

    // Add a short ascending whistle on top
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.3);
    oscGain.gain.setValueAtTime(0.12, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Silent fallback if Web Audio is unavailable
  }
}

const HANDS = ["👏", "👏", "👏", "👏", "👏"];

export default function CheerOverlay({ active }: CheerOverlayProps) {
  useEffect(() => {
    if (active) {
      playCheer();
    }
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-end pb-10 pointer-events-none z-10"
      aria-hidden="true"
    >
      <div className="flex gap-3">
        {HANDS.map((h, i) => (
          <motion.span
            key={i}
            className="text-4xl select-none"
            style={{ display: "inline-block" }}
            animate={{
              rotate: [0, -20, 20, -20, 20, 0],
              y: [0, -8, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 0.1,
              delay: i * 0.08,
              ease: "easeInOut",
            }}
          >
            {h}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
