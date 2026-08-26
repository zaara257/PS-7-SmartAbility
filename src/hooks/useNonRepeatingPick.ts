// src/hooks/useNonRepeatingPick.ts
// Server-persisted non-repeating pick hook.
//
// Reads the relevant lastXIndex from Firestore rewardState, picks a random
// index ≠ last, writes the new index back, and returns the picked item.
// Using Firestore as the source of truth means non-repeat is enforced
// across sessions and tabs — not just in-memory.

import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { RewardState } from "../types/reward";

type RewardStateKey = keyof RewardState;

interface UseNonRepeatingPickResult<T> {
  pick: T | null;
  loading: boolean;
}

/**
 * @param pool        - The array to pick from.
 * @param parentId    - Firestore parent UID (for the child doc path).
 * @param childId     - Firestore child document ID.
 * @param poolKey     - Which rewardState key to read/write (e.g. "lastStampIndex").
 */
export function useNonRepeatingPick<T>(
  pool: T[],
  parentId: string,
  childId: string,
  poolKey: RewardStateKey,
): UseNonRepeatingPickResult<T> {
  const [pick, setPick] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFired = useRef(false);

  useEffect(() => {
    // Guard against StrictMode double-fire
    if (hasFired.current) return;
    hasFired.current = true;

    if (!parentId || !childId || pool.length === 0) {
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const ref = doc(db, "parents", parentId, "children", childId);
        const snap = await getDoc(ref);
        const data = snap.data();

        // Read the last index (may not exist on first run)
        const lastIndex: number | null =
          data?.rewardState?.[poolKey] ?? null;

        // Pick a random index ≠ last (fallback to 0 if pool has only 1 item)
        let newIndex: number;
        if (pool.length === 1) {
          newIndex = 0;
        } else {
          do {
            newIndex = Math.floor(Math.random() * pool.length);
          } while (newIndex === lastIndex);
        }

        // Write back new index
        await updateDoc(ref, {
          [`rewardState.${poolKey}`]: newIndex,
        });

        setPick(pool[newIndex]);
      } catch (err) {
        console.error("[useNonRepeatingPick] error:", err);
        // Graceful fallback: pick index 0 without persisting
        setPick(pool[0]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [parentId, childId, poolKey]); // stable primitives

  return { pick, loading };
}
