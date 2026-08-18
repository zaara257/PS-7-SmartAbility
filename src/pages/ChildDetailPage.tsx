// src/pages/ChildDetailPage.tsx
// STUB: Phase 2 will replace this with the full garden visualization.
// This route exists as a hook point — it reads the child's doc and renders
// their name + current garden stage. Full reward/game logic comes later.

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Child } from "../types/child";
import GardenIllustration from "../components/ui/GardenIllustration";
import Button from "../components/ui/Button";

export default function ChildDetailPage() {
  const { childId } = useParams<{ childId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !childId) return;

    const fetchChild = async () => {
      try {
        const ref = doc(db, "parents", user.uid, "children", childId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setChild({ id: snap.id, ...(snap.data() as Omit<Child, "id">) } as Child);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChild();
  }, [user, childId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-forest-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

  const stageLabels: Record<Child["gardenStage"], string> = {
    seed:      "🌱 Seed",
    sprout:    "🌿 Sprout",
    sapling:   "🌳 Sapling",
    smallTree: "🌲 Small Tree",
    cocoon:    "🫘 Cocoon",
    butterfly: "🦋 Butterfly",
    fullTree:  "🌳 Full Garden",
  };

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* Header */}
      <header className="bg-gradient-to-r from-forest-green to-leaf-green px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/home")}
            className="border-white/30 text-white hover:bg-white/20 hover:text-white"
          >
            ← Back
          </Button>
          <h1 className="font-baloo text-xl font-bold text-white">
            {child.name}'s Garden
          </h1>
        </div>
      </header>

      {/* STUB content */}
      <main className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-6 text-center">
        <GardenIllustration stage={child.gardenStage} className="w-40 h-40" />

        <div>
          <h2 className="font-baloo text-3xl font-bold text-bark-brown">{child.name}</h2>
          <p className="font-fredoka text-xl text-forest-green mt-1">
            {stageLabels[child.gardenStage]}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-3xl">⭐</span>
            <span className="font-baloo text-2xl font-bold text-bark-brown">{child.stickerCount}</span>
            <span className="font-fredoka text-sm text-soil-brown/60">stickers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl">🏅</span>
            <span className="font-baloo text-2xl font-bold text-bark-brown">{child.badges.length}</span>
            <span className="font-fredoka text-sm text-soil-brown/60">badges</span>
          </div>
        </div>

        {/* Phase 2 placeholder notice */}
        <div className="bg-sunshine-yellow/20 border border-sunshine-yellow/50 rounded-3xl px-6 py-4 max-w-sm">
          <p className="font-fredoka text-bark-brown text-sm">
            🚧 <strong>Phase 2 coming soon!</strong><br />
            The full garden view, reward system, and sticker collection will bloom here.
          </p>
        </div>
      </main>
    </div>
  );
}
