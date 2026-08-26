// src/components/rewards/RewardEngine.tsx
// Single entry-point for all reward levels.
//
// Responsibilities:
//   1. Pick content via useNonRepeatingPick (server-persisted).
//   2. Render the level UI (Level 1/3: RewardVideoModal, Level 5: CakeCuttingGame, Level 2/4: CSS/Audio overlays).
//   3. On clicking "Continue" / "Claim": writes to Firestore (StickerEntry + increments stickerCount) and calls onComplete.
//
// Double-tap/Double-fire guard: hasFiredRef prevents multiple Firestore writes if button is double-tapped.

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useNonRepeatingPick } from "../../hooks/useNonRepeatingPick";
import { getStampVideosForTheme, CHARACTER_VIDEOS } from "../../constants/videoAssets";
import { RHYME_POOL } from "../../constants/rhymes";
import type { Child } from "../../types/child";
import type { RewardLevel, StickerEntry } from "../../types/reward";
import RewardVideoModal from "./RewardVideoModal";
import CakeCuttingGame from "./CakeCuttingGame";
import ConfettiBalloons from "./ConfettiBalloons";
import RhymeOverlay from "./RhymeOverlay";

interface RewardEngineProps {
  level: RewardLevel;
  child: Child;
  onComplete: () => void;
}

export default function RewardEngine({ level, child, onComplete }: RewardEngineProps) {
  const { user } = useAuth();
  const hasFiredRef = useRef(false);

  // ── Content pools ────────────────────────────────────────────────────────────
  const stampPool = getStampVideosForTheme(child.stickerTheme);
  const characterPool = CHARACTER_VIDEOS;
  const rhymePool = RHYME_POOL;

  // ── Non-repeating picks (hooks must be called unconditionally) ───────────────
  const { pick: stampPick, loading: stampLoading } = useNonRepeatingPick(
    stampPool,
    user?.uid ?? "",
    child.id,
    "lastStampIndex",
  );

  const { pick: characterPick, loading: characterLoading } = useNonRepeatingPick(
    characterPool,
    user?.uid ?? "",
    child.id,
    "lastCharacterLineIndex",
  );

  const { pick: rhymePick, loading: rhymeLoading } = useNonRepeatingPick(
    rhymePool,
    user?.uid ?? "",
    child.id,
    "lastRhymeIndex",
  );

  const isLoading =
    (level === 1 && stampLoading) ||
    (level === 3 && characterLoading) ||
    (level === 4 && rhymeLoading);

  // ── Firestore write on Continue ──────────────────────────────────────────────
  const handleClaimReward = async () => {
    if (!user || !child.id || isLoading || hasFiredRef.current) return;
    
    // Mount/Click guard — prevents double-firing
    hasFiredRef.current = true;

    try {
      const ref = doc(db, "parents", user.uid, "children", child.id);
      let entry: StickerEntry;

      if (level === 1 && stampPick) {
        entry = {
          id: crypto.randomUUID(),
          level: 1,
          type: "stamp",
          payload: { 
            videoSrc: `/rewards/stamp/${stampPick.filename}`,
            label: stampPick.label,
            category: stampPick.category
          },
          timestamp: Date.now(),
        };
      } else if (level === 2) {
        entry = {
          id: crypto.randomUUID(),
          level: 2,
          type: "confetti",
          payload: { color: child.favouriteColor },
          timestamp: Date.now(),
        };
      } else if (level === 3 && characterPick) {
        entry = {
          id: crypto.randomUUID(),
          level: 3,
          type: "quoteCard", // Keep quoteCard sticker type for database compatibility
          payload: { 
            videoSrc: `/rewards/character/${characterPick.filename}`,
            label: characterPick.label,
            category: characterPick.category
          },
          timestamp: Date.now(),
        };
      } else if (level === 4 && rhymePick) {
        entry = {
          id: crypto.randomUUID(),
          level: 4,
          type: "rhyme",
          payload: { rhymeId: rhymePick.id, emoji: rhymePick.emoji },
          timestamp: Date.now(),
        };
      } else if (level === 5) {
        entry = {
          id: crypto.randomUUID(),
          level: 5,
          type: "party",
          payload: { theme: child.stickerTheme, completedGame: true },
          timestamp: Date.now(),
        };
      } else {
        hasFiredRef.current = false; // Reset if invalid state
        return;
      }

      await updateDoc(ref, {
        stickerSheet: arrayUnion(entry),
        stickerCount: increment(1),
      });
    } catch (err) {
      console.error("[RewardEngine] Firestore write error:", err);
      hasFiredRef.current = false; // Allow retry on failure
    } finally {
      onComplete();
    }
  };

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-bg/95">
        <div className="w-12 h-12 border-4 border-forest-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render Level UI ──────────────────────────────────────────────────────────

  // Level 1: Stamp Video Playback
  if (level === 1 && stampPick) {
    return (
      <RewardVideoModal
        videoSrc={`/rewards/stamp/${stampPick.filename}`}
        label={stampPick.label}
        onContinue={handleClaimReward}
      />
    );
  }

  // Level 2: Confetti Balloons + Custom Continue Button
  if (level === 2) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bark-brown/90 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative w-full max-w-sm bg-cream-bg rounded-3xl p-6 border-4 border-sunshine-yellow shadow-2xl flex flex-col items-center gap-6 min-h-[320px]">
            <ConfettiBalloons color={child.favouriteColor} active />
            <div className="relative z-10 flex flex-col items-center gap-2 mt-8">
              <span className="text-7xl animate-bounce" aria-hidden="true">🎉</span>
              <p className="font-baloo text-3xl font-bold text-bark-brown">Amazing!</p>
              <p className="font-fredoka text-sm text-soil-brown/60 text-center px-4">
                Watch the balloons float up high!
              </p>
            </div>
            <button
              onClick={handleClaimReward}
              className="
                w-full mt-4 px-6 py-4 rounded-2xl
                bg-gradient-to-r from-forest-green to-leaf-green
                border-b-4 border-forest-green/80
                text-white font-baloo text-lg font-bold
                hover:brightness-105 active:scale-95 active:border-b-0 active:mt-1
                transition-all cursor-pointer text-center
              "
              id="confetti-continue-btn"
            >
              Continue 🌱
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Level 3: Character Video Playback
  if (level === 3 && characterPick) {
    return (
      <RewardVideoModal
        videoSrc={`/rewards/character/${characterPick.filename}`}
        label={characterPick.label}
        onContinue={handleClaimReward}
      />
    );
  }

  // Level 4: Rhyme Overlay + Custom Continue Button
  if (level === 4 && rhymePick) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bark-brown/90 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative w-full max-w-sm bg-cream-bg rounded-3xl p-6 border-4 border-sunshine-yellow shadow-2xl flex flex-col items-center gap-6">
            <RhymeOverlay rhyme={rhymePick} />
            <button
              onClick={handleClaimReward}
              className="
                w-full px-6 py-4 rounded-2xl
                bg-gradient-to-r from-forest-green to-leaf-green
                border-b-4 border-forest-green/80
                text-white font-baloo text-lg font-bold
                hover:brightness-105 active:scale-95 active:border-b-0 active:mt-1
                transition-all cursor-pointer text-center
              "
              id="rhyme-continue-btn"
            >
              Continue 🌱
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Level 5: Interactive Cake Cutting Game
  if (level === 5) {
    return (
      <CakeCuttingGame
        theme={child.stickerTheme}
        favouriteColor={child.favouriteColor}
        onComplete={handleClaimReward}
      />
    );
  }

  return null;
}
