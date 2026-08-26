// src/components/rewards/CakeCuttingGame.tsx
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import ConfettiBalloons from "./ConfettiBalloons";
import CheerOverlay from "./CheerOverlay";
import { CAKE_THEMES } from "../../constants/cakeThemes";
import type { StickerTheme } from "../../types/child";

interface CakeCuttingGameProps {
  theme: StickerTheme;
  favouriteColor: string;
  onComplete: () => void;
}

export default function CakeCuttingGame({ theme, favouriteColor, onComplete }: CakeCuttingGameProps) {
  const [cutProgress, setCutProgress] = useState(0); // 0 to 1
  const [cutCompleted, setCutCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const cakeTheme = CAKE_THEMES[theme];

  // Helper to handle swipe/drag coordinate calculation
  const updateProgress = (clientX: number) => {
    if (!containerRef.current || cutCompleted) return;
    const rect = containerRef.current.getBoundingClientRect();
    const startX = rect.left + rect.width * 0.15; // 15% padding
    const endX = rect.left + rect.width * 0.85;   // 85% padding
    const range = endX - startX;
    
    // Calculate ratio of current X position within the interactive slice zone
    const progress = Math.max(0, Math.min(1, (clientX - startX) / range));
    setCutProgress(progress);

    if (progress >= 0.95) {
      setCutCompleted(true);
      setCutProgress(1);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateProgress(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateProgress(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    if (!cutCompleted) {
      // Snap back if cut wasn't fully completed, forgiving but keeps the game interactive
      setCutProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bark-brown/95 backdrop-blur-md p-4">
      {/* Background confetti + cheer trigger */}
      {cutCompleted && (
        <>
          <ConfettiBalloons color={favouriteColor} active />
          <CheerOverlay active />
        </>
      )}

      <div className="relative w-full max-w-lg bg-cream-bg rounded-3xl p-6 border-4 border-sunshine-yellow shadow-2xl flex flex-col items-center gap-6">
        
        {/* Game Title */}
        <div className="text-center">
          <h2 className="font-baloo text-3xl font-bold text-bark-brown">
            {cutCompleted ? "🎉 Cut Successful! 🎉" : "🎂 Slice the Cake! 🎂"}
          </h2>
          <p className="font-fredoka text-sm text-soil-brown/70 mt-1">
            {cutCompleted 
              ? "Wonderful job! Here is your level 5 sticker reward!"
              : "Drag the knife from left to right to slice the cake!"}
          </p>
        </div>

        {/* Interactive Zone */}
        <div
          ref={containerRef}
          className="relative w-full h-64 bg-white/50 rounded-2xl border-2 border-dashed border-leaf-green/20 overflow-hidden flex items-center justify-center cursor-ew-resize select-none touch-none"
        >
          {/* Cake Slices */}
          <div className="relative w-48 h-40 flex items-center justify-center">
            
            {/* Left Slice */}
            <motion.div
              className="absolute left-0 w-24 h-40 overflow-hidden"
              animate={cutCompleted ? { x: -30, rotate: -5 } : { x: 0, rotate: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 10 }}
            >
              {/* Entire cake shifted left so left half is centered inside the mask */}
              <div className="absolute left-0 w-48 h-40 flex flex-col items-center">
                {/* Toppers */}
                <div className="flex gap-2 mb-1 justify-center w-full">
                  {cakeTheme.topperEmojis.slice(0, 2).map((t, idx) => (
                    <span key={idx} className="text-2xl">{t}</span>
                  ))}
                </div>
                {/* Cake Tier */}
                <div 
                  className="w-36 h-24 rounded-2xl shadow-md border-r-2 border-white/40 flex items-center justify-center"
                  style={{ backgroundColor: cakeTheme.accentColor }}
                >
                  <span className="text-3xl">🌸</span>
                </div>
              </div>
            </motion.div>

            {/* Right Slice */}
            <motion.div
              className="absolute right-0 w-24 h-40 overflow-hidden"
              animate={cutCompleted ? { x: 30, rotate: 5 } : { x: 0, rotate: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 10 }}
            >
              {/* Entire cake shifted right so right half is centered inside the mask */}
              <div className="absolute right-0 w-48 h-40 flex flex-col items-center">
                {/* Toppers */}
                <div className="flex gap-2 mb-1 justify-center w-full">
                  {cakeTheme.topperEmojis.slice(2, 4).map((t, idx) => (
                    <span key={idx} className="text-2xl">{t}</span>
                  ))}
                </div>
                {/* Cake Tier */}
                <div 
                  className="w-36 h-24 rounded-2xl shadow-md border-l-2 border-white/40 flex items-center justify-center"
                  style={{ backgroundColor: cakeTheme.accentColor }}
                >
                  <span className="text-3xl">⭐</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Dotted Cut Track (Hidden when completed) */}
          {!cutCompleted && (
            <div 
              className="absolute left-[15%] right-[15%] h-1 border-t-2 border-dashed border-bark-brown/30 pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Knife Handle / Drag Target */}
          {!cutCompleted && (
            <motion.div
              className="absolute w-12 h-12 bg-sunshine-yellow rounded-full border-2 border-bark-brown shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{
                left: `${15 + cutProgress * 70}%`,
                x: "-50%",
                y: 0,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              aria-label="Drag to slice cake"
            >
              <span className="text-2xl select-none">🔪</span>
            </motion.div>
          )}
        </div>

        {/* Action Button */}
        <div className="w-full flex justify-center mt-2">
          {cutCompleted ? (
            <button
              onClick={onComplete}
              className="
                w-full max-w-xs px-8 py-4 rounded-2xl
                bg-gradient-to-r from-forest-green to-leaf-green
                border-b-4 border-forest-green/80
                text-white font-baloo text-xl font-bold
                shadow-lg shadow-forest-green/20
                hover:brightness-105 active:scale-95 active:border-b-0 active:mt-1
                transition-all cursor-pointer text-center
              "
              id="cake-claim-reward-btn"
            >
              Claim Reward! 🌱
            </button>
          ) : (
            <div className="h-14 flex items-center">
              <span className="font-fredoka text-xs text-soil-brown/50 uppercase tracking-wider">
                Progress: {Math.round(cutProgress * 100)}%
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
