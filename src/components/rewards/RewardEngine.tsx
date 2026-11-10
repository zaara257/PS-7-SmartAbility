// src/components/rewards/RewardEngine.tsx
// Single unified entry-point for all reward levels (1-5).
// All levels play a random festival video from their dedicated folder,
// full screen, looping, with a Continue button.

import { useRef, useEffect } from "react";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useNonRepeatingPick } from "../../hooks/useNonRepeatingPick";
import rewardManifest from "../../constants/rewardManifest.json";
import type { Child } from "../../types/child";
import type { RewardLevel, StickerEntry } from "../../types/reward";
import RewardVideoPlayer from "./RewardVideoPlayer";

interface RewardEngineProps {
  level: RewardLevel;
  child: Child;
  onComplete: () => void;
}

export default function RewardEngine({ level, child, onComplete }: RewardEngineProps) {
  const { user } = useAuth();
  const pool = (rewardManifest as Record<string, string[]>)[`level${level}`] || [];
  const { pick, loading } = useNonRepeatingPick(pool, user?.uid ?? "", child.id, level);

  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (hasFiredRef.current || !pick || !user || !child.id) return;
    hasFiredRef.current = true;

    const entry: StickerEntry = {
      id: crypto.randomUUID(),
      level,
      type: "video",
      payload: { level, videoSrc: pick },
      timestamp: Date.now(),
    };

    const ref = doc(db, "parents", user.uid, "children", child.id);
    updateDoc(ref, {
      stickerSheet: arrayUnion(entry),
      stickerCount: increment(1),
    }).catch((err) => {
      console.error("[RewardEngine] Firestore write error:", err);
    });
  }, [pick, child.id, level, user]);

  if (loading || !pick) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-bg/95">
        <div className="w-12 h-12 border-4 border-forest-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <RewardVideoPlayer
      src={pick}
      loop={true}
      label={`Level ${level} Reward`}
      onContinue={onComplete}
    />
  );
}
