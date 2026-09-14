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
import FloatingBackground from "../components/ui/FloatingBackground";

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
    <div className="flex flex-col items-center gap-2.5 mt-2">
      <div className="inline-flex items-center gap-2 bg-leaf-green/15 text-forest-green px-4 py-1.5 rounded-full font-fredoka text-sm shadow-xs">
        <span className="text-soil-brown/70">Garden Stage:</span>
        <strong className="text-forest-green font-bold">{STAGE_LABELS[currentStage]}</strong>
      </div>
      {!isMax ? (
        <button
          onClick={handleAdvance}
          disabled={advancing}
          aria-label={`Advance garden stage to ${nextStage}`}
          className={`
            text-xs font-fredoka font-semibold px-4 py-1.5 rounded-full
            bg-forest-green/10 text-forest-green
            hover:bg-forest-green/20 active:scale-95
            transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer flex items-center gap-1.5 shadow-xs
          `}
        >
          {advancing ? "Growing…" : `↑ Advance to ${STAGE_LABELS[nextStage!]}`}
        </button>
      ) : (
        <span className="text-xs font-fredoka font-bold text-forest-green bg-leaf-green/20 px-4 py-1.5 rounded-full shadow-xs flex items-center gap-1">
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
    <div className="min-h-screen bg-cream-bg relative overflow-hidden flex flex-col">
      {/* Ambient background */}
      <FloatingBackground density="lush" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-forest-green to-leaf-green px-4 py-4 shadow-md shadow-forest-green/20 relative z-10">
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

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8 relative z-10 w-full">

        {/* ── Garden snapshot + stats ────────────────────────────────────── */}
        <section
          className="relative bg-white/85 backdrop-blur-sm rounded-3xl border-2 border-leaf-green/30 shadow-lg shadow-soil-brown/10 p-6 sm:p-7 flex flex-col items-center gap-5 overflow-hidden"
          aria-label="Garden overview"
        >
          {/* Subtle corner botanical accents */}
          <span className="absolute top-3 left-3 text-lg opacity-35 select-none pointer-events-none" aria-hidden="true">
            🌿
          </span>
          <span className="absolute top-3 right-3 text-lg opacity-35 select-none pointer-events-none" aria-hidden="true">
            🌸
          </span>

          {/* Tree area with visual grounding & soft radial aura */}
          <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
            {/* Soft radial background glow */}
            <div 
              className="absolute inset-0 rounded-full blur-xl pointer-events-none transform scale-110 opacity-70"
              style={{
                background: "radial-gradient(circle, rgba(127,176,105,0.25) 0%, rgba(168,218,220,0.2) 60%, transparent 100%)"
              }}
              aria-hidden="true"
            />
            
            <GardenIllustration stage={child.gardenStage} className="w-36 h-36 relative z-10 filter drop-shadow-sm" />

            {/* Soft grass / ground mound shape under tree */}
            <div 
              className="w-36 h-4 -mt-2.5 rounded-full bg-gradient-to-r from-leaf-green/30 via-forest-green/45 to-leaf-green/30 blur-[0.5px] opacity-80 relative z-0" 
              aria-hidden="true"
            />
          </div>

          <h2 className="font-baloo text-3xl font-bold text-bark-brown text-center">
            {child.name}
          </h2>

          {/* Stats row with soft colored chips */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-sunshine-yellow/20 border border-sunshine-yellow/40 shadow-xs">
              <span className="text-2xl mb-0.5" role="img" aria-hidden="true">⭐</span>
              <span className="font-baloo text-2xl font-bold text-bark-brown leading-tight">{child.stickerCount}</span>
              <span className="font-fredoka text-xs text-soil-brown/70">stickers</span>
            </div>
            <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-flower-orange/20 border border-flower-orange/40 shadow-xs">
              <span className="text-2xl mb-0.5" role="img" aria-hidden="true">🏅</span>
              <span className="font-baloo text-2xl font-bold text-bark-brown leading-tight">{child.badges?.length ?? 0}</span>
              <span className="font-fredoka text-xs text-soil-brown/70">badges</span>
            </div>
            <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-sky-blue/25 border border-sky-blue/50 shadow-xs">
              <span className="text-2xl mb-0.5" role="img" aria-hidden="true">🌟</span>
              <span className="font-baloo text-2xl font-bold text-bark-brown leading-tight">{stickerSheet.length}</span>
              <span className="font-fredoka text-xs text-soil-brown/70">rewards</span>
            </div>
          </div>

          {/* Garden stage advance control — parent/therapist facing */}
          <AdvanceStageControl
            currentStage={child.gardenStage}
            childId={child.id}
            parentId={user!.uid}
          />
        </section>

        {/* ── Single Large Reward Button & Unlocked Rewards ───────────────── */}
        <section aria-label="Available Rewards" className="flex flex-col items-center gap-6">
          {/* Main Action Reward Button */}
          <button
            onClick={() => setActiveLevel(unlockedCount as RewardLevel)}
            disabled={activeLevel !== null}
            className="
              w-full py-5 px-6 rounded-3xl
              bg-gradient-to-r from-forest-green via-leaf-green to-forest-green
              text-white font-baloo shadow-xl shadow-forest-green/25
              border-4 border-white/90
              flex items-center justify-between gap-4
              hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl
              transition-all duration-200 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed group
            "
            id="primary-reward-button"
            aria-label={`Claim Level ${unlockedCount} Reward: ${REWARD_CARDS[unlockedCount - 1]?.title}`}
          >
            <div className="flex items-center gap-4 text-left">
              <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform">
                {REWARD_CARDS[unlockedCount - 1]?.emoji}
              </span>
              <div>
                <span className="inline-block bg-white/25 text-white text-xs font-fredoka font-bold px-3 py-0.5 rounded-full mb-1 tracking-wide">
                  ⭐ Current Reward (Level {unlockedCount})
                </span>
                <h3 className="font-baloo text-xl sm:text-2xl font-extrabold leading-tight">
                  Play {REWARD_CARDS[unlockedCount - 1]?.title}!
                </h3>
                <p className="font-fredoka text-xs sm:text-sm text-white/90">
                  {REWARD_CARDS[unlockedCount - 1]?.description}
                </p>
              </div>
            </div>
            <span className="text-3xl sm:text-4xl text-white/90 group-hover:translate-x-1 group-hover:rotate-12 transition-transform select-none">
              ✨
            </span>
          </button>

          {/* Cards for all unlocked levels so child/parent can also replay previous unlocked levels */}
          <div className="w-full">
            <h3 className="font-baloo text-lg font-bold text-bark-brown mb-3 text-center">
              Available Rewards ({unlockedCount} of 5 Unlocked)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {visibleCards.map((card) => (
                <button
                  key={card.level}
                  onClick={() => setActiveLevel(card.level)}
                  disabled={activeLevel !== null}
                  className={`
                    flex flex-col items-start text-left p-4 rounded-2xl border-2
                    ${card.colorClass} ${card.borderColorClass}
                    transition-all duration-150 cursor-pointer
                    hover:-translate-y-0.5 hover:shadow-md
                    active:scale-98 disabled:opacity-50
                  `}
                  id={`reward-card-${card.level}`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className={`text-white text-xs font-bold font-fredoka px-2.5 py-0.5 rounded-full ${card.badgeBg}`}>
                      Level {card.level}
                    </span>
                    {card.level === unlockedCount && (
                      <span className="font-fredoka text-xs text-forest-green font-bold bg-white/80 px-2 py-0.5 rounded-full shadow-xs">
                        ⭐ Highest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl leading-none select-none" role="img" aria-hidden="true">
                      {card.emoji}
                    </span>
                    <span className="font-baloo text-base font-bold text-bark-brown leading-tight">
                      {card.title}
                    </span>
                  </div>
                  <p className="font-fredoka text-xs text-soil-brown/80 leading-snug">
                    {card.description}
                  </p>
                </button>
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
