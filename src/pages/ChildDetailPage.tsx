// src/pages/ChildDetailPage.tsx
// Full child detail page — replaces Phase 1 stub.
// Sections:
//   • Header (back + name)
//   • Garden snapshot (GardenIllustration) + stats + AdvanceStageControl
//   • Unlocked Gated Reward Cards (Large colorful game tiles layout)
//   • RewardEngine overlay (shown while a reward is active)
//   • StickerSheetGallery (all past rewards, real-time via onSnapshot)

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Child, GardenStage } from "../types/child";
import type { RewardLevel } from "../types/reward";
import GardenIllustration from "../components/ui/GardenIllustration";
import Button from "../components/ui/Button";
import RewardEngine from "../components/rewards/RewardEngine";
import StickerSheetGallery from "../components/rewards/StickerSheetGallery";
import WebcamScanner from "../components/rewards/WebcamScanner";

// Ordered stage sequence for the advance control
const STAGE_SEQUENCE: GardenStage[] = [
  "seed", "sprout", "sapling", "smallTree", "cocoon", "butterfly", "fullTree",
];

const STAGE_LABELS: Record<GardenStage, string> = {
  seed:      "🌱 Seed",
  sprout:    "🌿 Sprout",
  sapling:   "🌳 Sapling",
  smallTree: "🌲 Small Tree",
  cocoon:    "🫘 Cocoon",
  butterfly: "🦋 Butterfly",
  fullTree:  "🌳 Full Garden",
};

interface RewardCardDef {
  level: RewardLevel;
  emoji: string;
  title: string;
  description: string;
  colorClass: string;
  borderColorClass: string;
  badgeBg: string;
}

const REWARD_CARDS: RewardCardDef[] = [
  {
    level: 1,
    emoji: "🎟️",
    title: "Stamp Video",
    description: "Watch a fun animal, superhero, or fantasy video stamp!",
    colorClass: "bg-leaf-green/10",
    borderColorClass: "border-leaf-green/30",
    badgeBg: "bg-leaf-green",
  },
  {
    level: 2,
    emoji: "🎈",
    title: "Balloon Burst",
    description: "Float colorful balloons with happy musical chimes!",
    colorClass: "bg-sky-blue/15",
    borderColorClass: "border-sky-blue/40",
    badgeBg: "bg-forest-green",
  },
  {
    level: 3,
    emoji: "🐾",
    title: "Character Friend",
    description: "Play a special video of your favorite animals & cartoons!",
    colorClass: "bg-flower-orange/15",
    borderColorClass: "border-flower-orange/40",
    badgeBg: "bg-flower-orange",
  },
  {
    level: 4,
    emoji: "📜",
    title: "Rhyme Time",
    description: "Read a happy rhyme with loud clapping cheers!",
    colorClass: "bg-sunshine-yellow/15",
    borderColorClass: "border-sunshine-yellow/40",
    badgeBg: "bg-soil-brown",
  },
  {
    level: 5,
    emoji: "🎂",
    title: "Slice the Cake",
    description: "Cut a delicious cake to celebrate your achievements!",
    colorClass: "bg-flower-pink/15",
    borderColorClass: "border-flower-pink/40",
    badgeBg: "bg-flower-pink",
  },
];

// ── Advance Garden Stage control (parent-facing, calm styling) ───────────────

interface AdvanceStageControlProps {
  currentStage: GardenStage;
  childId: string;
  parentId: string;
}

function AdvanceStageControl({ currentStage, childId, parentId }: AdvanceStageControlProps) {
  const [advancing, setAdvancing] = useState(false);
  const currentIdx = STAGE_SEQUENCE.indexOf(currentStage);
  const isMax = currentIdx >= STAGE_SEQUENCE.length - 1;
  const nextStage = isMax ? null : STAGE_SEQUENCE[currentIdx + 1];

  const handleAdvance = async () => {
    if (!nextStage || advancing) return;
    setAdvancing(true);
    try {
      await updateDoc(doc(db, "parents", parentId, "children", childId), {
        gardenStage: nextStage,
      });
    } catch (err) {
      console.error("[AdvanceStageControl] error:", err);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <span className="font-fredoka text-sm text-soil-brown/60">
        Garden stage: <strong className="text-bark-brown">{STAGE_LABELS[currentStage]}</strong>
      </span>
      {!isMax ? (
        <button
          onClick={handleAdvance}
          disabled={advancing}
          aria-label={`Advance garden stage to ${nextStage}`}
          className={`
            text-xs font-fredoka px-4 py-1.5 rounded-full border
            border-leaf-green/40 bg-white/60 text-forest-green
            hover:bg-leaf-green/10 hover:border-forest-green
            transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
          `}
        >
          {advancing ? "Growing…" : `↑ Advance to ${STAGE_LABELS[nextStage!]}`}
        </button>
      ) : (
        <span className="text-xs font-fredoka text-leaf-green bg-leaf-green/10 px-3 py-1 rounded-full border border-leaf-green/30">
          🌳 Maximum stage reached!
        </span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChildDetailPage() {
  const { childId } = useParams<{ childId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeLevel, setActiveLevel] = useState<RewardLevel | null>(null);

  // Real-time listener — keeps stickerSheet and stickerCount live
  useEffect(() => {
    if (!user || !childId) return;

    const ref = doc(db, "parents", user.uid, "children", childId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setChild({ id: snap.id, ...(snap.data() as Omit<Child, "id">) } as Child);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      },
      (err) => {
        console.error("[ChildDetailPage] snapshot error:", err);
        setLoading(false);
      },
    );

    return unsub;
  }, [user, childId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-forest-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !child) {
    return (
      <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center gap-4 p-6">
        <span className="text-6xl">🌱</span>
        <h1 className="font-baloo text-2xl font-bold text-bark-brown">Garden not found</h1>
        <p className="font-fredoka text-soil-brown/70">This garden doesn't seem to exist.</p>
        <Button onClick={() => navigate("/home")} variant="primary">← Back to Home</Button>
      </div>
    );
  }

  const stickerSheet = child.stickerSheet ?? [];

  // Level Gating Math:
  const stageIdx = STAGE_SEQUENCE.indexOf(child.gardenStage);
  const unlockedCount = Math.max(1, Math.min(5, stageIdx + 1));
  const visibleCards = REWARD_CARDS.slice(0, unlockedCount);

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-forest-green to-leaf-green px-4 py-4 shadow-md shadow-forest-green/20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/home")}
            className="border-white/30 text-white hover:bg-white/20 hover:text-white"
            id="back-to-home"
          >
            ← Back
          </Button>
          <h1 className="font-baloo text-xl font-bold text-white">
            {child.name}'s Garden
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* ── Garden snapshot + stats ────────────────────────────────────── */}
        <section
          className="bg-white/70 rounded-3xl border border-leaf-green/20 shadow-sm p-6 flex flex-col items-center gap-4"
          aria-label="Garden overview"
        >
          <GardenIllustration stage={child.gardenStage} className="w-36 h-36" />

          <h2 className="font-baloo text-3xl font-bold text-bark-brown text-center">
            {child.name}
          </h2>

          {/* Stats row */}
          <div className="flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-3xl">⭐</span>
              <span className="font-baloo text-2xl font-bold text-bark-brown">{child.stickerCount}</span>
              <span className="font-fredoka text-xs text-soil-brown/60">stickers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl">🏅</span>
              <span className="font-baloo text-2xl font-bold text-bark-brown">{child.badges?.length ?? 0}</span>
              <span className="font-fredoka text-xs text-soil-brown/60">badges</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl">🌟</span>
              <span className="font-baloo text-2xl font-bold text-bark-brown">{stickerSheet.length}</span>
              <span className="font-fredoka text-xs text-soil-brown/60">rewards</span>
            </div>
          </div>

          {/* Garden stage advance control — parent/therapist facing */}
          <AdvanceStageControl
            currentStage={child.gardenStage}
            childId={child.id}
            parentId={user!.uid}
          />
        </section>

        {/* ── Gated Large Reward Card Tiles ──────────────────────────────── */}
        <section aria-label="Available Rewards">
          <WebcamScanner 
            onRewardDetected={setActiveLevel}
            unlockedCount={unlockedCount}
          />
          
          <div className="mt-8">
            <h3 className="font-baloo text-xl font-bold text-bark-brown mb-4 text-center">
              Available Rewards Guide
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-75">
              {visibleCards.map((card) => (
                <div
                  key={card.level}
                  className={`
                    flex flex-col items-start text-left p-4 rounded-2xl border-2
                    ${card.colorClass} ${card.borderColorClass}
                  `}
                >
                  <span className={`text-white text-xs font-bold font-fredoka px-2 py-0.5 rounded-full ${card.badgeBg} mb-2`}>
                    Level {card.level}
                  </span>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl leading-none select-none" role="img" aria-hidden="true">
                      {card.emoji}
                    </span>
                    <span className="font-baloo text-lg font-bold text-bark-brown leading-tight">
                      {card.title}
                    </span>
                  </div>
                  <p className="font-fredoka text-xs text-soil-brown/80 leading-snug">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sticker sheet gallery ──────────────────────────────────────── */}
        <section aria-label="Sticker sheet">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-baloo text-xl font-bold text-bark-brown">Sticker Sheet</h2>
            <span className="font-fredoka text-sm text-soil-brown/50 bg-white/60 border border-leaf-green/20 rounded-full px-3 py-0.5">
              {stickerSheet.length} {stickerSheet.length === 1 ? "reward" : "rewards"}
            </span>
          </div>
          <StickerSheetGallery entries={stickerSheet} />
        </section>

      </main>

      {/* ── RewardEngine overlay (shown while a level is active) ──────────── */}
      {activeLevel !== null && (
        <RewardEngine
          key={activeLevel}
          level={activeLevel}
          child={child}
          onComplete={() => setActiveLevel(null)}
        />
      )}
    </div>
  );
}
