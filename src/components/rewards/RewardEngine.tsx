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
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useNonRepeatingPick } from "../../hooks/useNonRepeatingPick";
import { getStampVideosForTheme, CHARACTER_VIDEOS } from "../../constants/videoAssets";
import { RHYME_POOL } from "../../constants/rhymes";
import type { Child } from "../../types/child";
import type { RewardLevel, StickerEntry } from "../../types/reward";
import RewardVideoModal from "./RewardVideoModal";
import CakeCuttingParty from "./CakeCuttingParty";
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

  // Level 2: Full-Screen Confetti Balloons (self-contained overlay)
  if (level === 2) {
    return (
      <ConfettiBalloons
        color={child.favouriteColor}
        active
        onContinue={handleClaimReward}
      />
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

  // Level 4: Full-Screen Glassmorphic Rhyme Time (self-contained overlay)
  if (level === 4 && rhymePick) {
    return (
      <RhymeOverlay
        rhyme={rhymePick}
        onContinue={handleClaimReward}
      />
    );
  }

  // Level 5: Interactive Cake Cutting Party
  if (level === 5) {
    return (
      <CakeCuttingParty
        child={child}
        onComplete={handleClaimReward}
      />
    );
  }

  return null;
}
