import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Child } from "../types/child";
import ChildCard from "../components/home/ChildCard";
import AddChildCard from "../components/home/AddChildCard";
import EmptyState from "../components/home/EmptyState";
import AddChildModal from "../components/child/AddChildModal";
import Button from "../components/ui/Button";
import FloatingBackground from "../components/ui/FloatingBackground";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Decorative garden top banner
function GardenBanner() {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-14 -mb-1 relative z-10" aria-hidden="true">
      <defs>
        <linearGradient id="bannerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A7C59" />
          <stop offset="100%" stopColor="#7FB069" />
        </linearGradient>
      </defs>
      <rect width="1200" height="120" fill="url(#bannerGrad)" />
      {/* rolling hills */}
      <path d="M0 60 Q150 20 300 55 Q450 90 600 45 Q750 0 900 50 Q1050 100 1200 60 L1200 120 L0 120Z"
        fill="#FDF8EE" />
      {/* mini trees */}
      {[80, 280, 520, 760, 1020].map((x, i) => (
        <g key={i} transform={`translate(${x},52)`}>
          <rect x="-3" y="8" width="6" height="14" rx="2" fill="#6B4A3D" opacity="0.7" />
          <ellipse cx="0" cy="4" rx="14" ry="12" fill="#4A7C59" opacity="0.8" />
          <ellipse cx="0" cy="-2" rx="9" ry="8" fill="#7FB069" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const displayName = user?.displayName?.split(" ")[0] ?? "there";

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "parents", user.uid, "children"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snap) => {
        const docs = snap.docs
          // Filter out docs that are still pending a server timestamp
          // (createdAt is null while serverTimestamp() hasn't resolved yet).
          // They will arrive in a follow-up snapshot once the write commits.
          .filter((d) => d.data().createdAt !== null)
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Child, "id">),
          })) as Child[];
        setChildren(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore children listener error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  return (
    <div className="min-h-screen bg-cream-bg relative overflow-hidden flex flex-col">
      {/* Ambient background - low density to stay calm on work dashboard */}
      <FloatingBackground density="low" />

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-forest-green to-leaf-green shadow-md shadow-forest-green/20 relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">🌿</span>
            <div>
              <p className="font-fredoka text-white/80 text-sm leading-tight">
                {getGreeting()},
              </p>
              <h1 className="font-baloo text-xl font-bold text-white leading-tight">
                {displayName}! 👋
              </h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            id="logout-button"
            className="border-white/30 text-white hover:bg-white/20 hover:text-white"
          >
            Log out
          </Button>
        </div>
      </header>

      {/* Decorative garden banner */}
      <GardenBanner />

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 pb-16 relative z-10">

        {/* Section heading */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-baloo text-2xl font-bold text-bark-brown">
              Your Gardens
            </h2>
            {children.length > 0 && (
              <p className="font-fredoka text-sm text-soil-brown/60 mt-0.5">
                {children.length} {children.length === 1 ? "garden" : "gardens"} growing 🌱
              </p>
            )}
          </div>
          {children.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModalOpen(true)}
              id="header-add-child"
            >
              + Add Child
            </Button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-3xl bg-white/50 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && children.length === 0 && (
          <EmptyState onAddChild={() => setModalOpen(true)} />
        )}

        {/* Children grid */}
        {!loading && children.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {children.map((child, i) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, scale: 0.75, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 22,
                    delay: i * 0.06,
                  }}
                >
                  <ChildCard child={child} />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add child card — always last */}
            <AddChildCard onClick={() => setModalOpen(true)} />
          </div>
        )}
      </main>

      {/* Add Child Modal */}
      <AddChildModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onChildAdded={() => {}}
      />
    </div>
  );
}
