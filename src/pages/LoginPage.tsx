// src/pages/LoginPage.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";

type Tab = "login" | "signup";

// Soft garden hill SVG background — parent-facing, calm tone
function GardenBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8DADC" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FDF8EE" />
        </linearGradient>
        <radialGradient id="sunGrad" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="#F4D35E" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F4D35E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#skyGrad)" />
      <rect width="1440" height="900" fill="url(#sunGrad)" />

      {/* Distant hills */}
      <path d="M0 650 Q200 520 400 600 Q600 680 800 560 Q1000 440 1200 560 Q1350 640 1440 580 L1440 900 L0 900Z"
        fill="#7FB069" opacity="0.25" />
      <path d="M0 700 Q300 580 600 660 Q900 740 1200 640 Q1350 590 1440 620 L1440 900 L0 900Z"
        fill="#4A7C59" opacity="0.2" />

      {/* Ground */}
      <path d="M0 800 Q360 750 720 780 Q1080 810 1440 770 L1440 900 L0 900Z"
        fill="#7FB069" opacity="0.45" />
      <path d="M0 840 Q360 800 720 830 Q1080 860 1440 820 L1440 900 L0 900Z"
        fill="#4A7C59" opacity="0.35" />

      {/* Decorative trees (simple) */}
      {[100, 1320, 200, 1200].map((x, i) => (
        <g key={i} transform={`translate(${x}, ${i % 2 === 0 ? 700 : 720})`}>
          <rect x="-5" y="40" width="10" height="50" rx="4" fill="#6B4A3D" opacity="0.5" />
          <ellipse cx="0" cy="30" rx="28" ry="35" fill="#4A7C59" opacity="0.4" />
          <ellipse cx="0" cy="15" rx="18" ry="22" fill="#7FB069" opacity="0.4" />
        </g>
      ))}

      {/* Floating flowers */}
      {[[300, 200], [900, 150], [1100, 250], [500, 120]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="12" fill={["#F2A6B0","#F4D35E","#B784A7","#F4A259"][i]} opacity="0.25" />
          <circle cx={cx} cy={cy} r="5" fill="#FDF8EE" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const [tab, setTab] = useState<Tab>(mode === "signup" ? "signup" : "login");

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-forest-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen bg-cream-bg relative overflow-hidden flex items-center justify-center p-4">
      <GardenBackground />

      {/* Floating leaves decoration */}
      {!reduced && [
        { x: "10%", delay: 0, size: 20 },
        { x: "85%", delay: 1.2, size: 14 },
        { x: "70%", delay: 0.6, size: 18 },
      ].map(({ x, delay, size }, i) => (
        <motion.div
          key={i}
          className="absolute top-0 text-leaf-green pointer-events-none select-none"
          style={{ left: x, fontSize: size }}
          animate={{ y: ["0vh", "110vh"], rotate: [0, 360] }}
          transition={{ duration: 8 + i * 2, delay, repeat: Infinity, ease: "linear" }}
          aria-hidden="true"
        >
          🍃
        </motion.div>
      ))}

      {/* Auth card */}
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/85 backdrop-blur-md rounded-3xl shadow-2xl shadow-forest-green/15 border border-white/60 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-br from-forest-green to-leaf-green px-8 pt-8 pb-6 text-center">
            <div className="text-5xl mb-3">🌿</div>
            <h1 className="font-baloo text-3xl font-bold text-white tracking-wide">
              Green Garden
            </h1>
            <p className="text-white/80 font-fredoka text-sm mt-1">
              A growing place for every child 🌸
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-leaf-green/20 bg-white/50">
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                id={`tab-${t}`}
                onClick={() => setTab(t)}
                className={`
                  flex-1 py-3 font-fredoka font-semibold text-sm transition-all duration-200
                  ${tab === t
                    ? "text-forest-green border-b-2 border-forest-green bg-white/60"
                    : "text-soil-brown/60 hover:text-forest-green"
                  }
                `}
              >
                {t === "login" ? "Log In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Form area */}
          <div className="px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={reduced ? {} : { opacity: 0, x: tab === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduced ? {} : { opacity: 0, x: tab === "login" ? 20 : -20 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "login"
                  ? <LoginForm onSuccess={() => {}} />
                  : <SignupForm onSuccess={() => setTab("login")} />
                }
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer toggle hint */}
          <p className="text-center text-xs font-fredoka text-soil-brown/50 pb-6">
            {tab === "login"
              ? <>Don't have an account?{" "}
                  <button onClick={() => setTab("signup")} className="text-forest-green hover:underline font-semibold">
                    Sign up
                  </button>
                </>
              : <>Already have an account?{" "}
                  <button onClick={() => setTab("login")} className="text-forest-green hover:underline font-semibold">
                    Log in
                  </button>
                </>
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
}
