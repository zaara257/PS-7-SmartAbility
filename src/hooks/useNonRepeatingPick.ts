// src/hooks/useNonRepeatingPick.ts
// Server-persisted non-repeating pick hook for level video rewards.
// Reads lastVideoIndexByLevel[level] from Firestore rewardState, picks a random
// index != last, writes the new index back, and returns the picked item.

import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { RewardLevel } from "../types/reward";

interface UseNonRepeatingPickResult<T> {
  pick: T | null;
  loading: boolean;
}

export function useNonRepeatingPick<T>(
  pool: T[],
  parentId: string,
  childId: string,
  level: RewardLevel,
): UseNonRepeatingPickResult<T> {
  const [pick, setPick] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFired = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-fire
    if (hasFired.current) return;
    hasFired.current = true;

    if (!parentId || !childId || !pool || pool.length === 0) {
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const ref = doc(db, "parents", parentId, "children", childId);
        const snap = await getDoc(ref);
        const data = snap.data();

        // Read the last index for this level
        const lastIndex: number | null =
          data?.rewardState?.lastVideoIndexByLevel?.[level] ?? null;

        // Pick a random index != last (fallback to 0 if pool has only 1 item)
        let newIndex: number;
        if (pool.length === 1) {
          newIndex = 0;
        } else {
          do {
            newIndex = Math.floor(Math.random() * pool.length);
          } while (newIndex === lastIndex);
        }

        // Write back new index using setDoc merge to guarantee nested path exists
        await setDoc(
          ref,
          {
            rewardState: {
              lastVideoIndexByLevel: {
                [level]: newIndex,
              },
            },
          },
          { merge: true },
        );

        setPick(pool[newIndex]);
      } catch (err) {
        console.error("[useNonRepeatingPick] error:", err);
        // Fallback: pick random without repeating if possible, or index 0
        const fallbackIndex = Math.floor(Math.random() * pool.length);
        setPick(pool[fallbackIndex]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [parentId, childId, level, pool]);

  return { pick, loading };
}
