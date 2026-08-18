// src/components/child/AddChildModal.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import type { FavouriteAnimal, StickerTheme, NewChildData } from "../../types/child";
import Button from "../ui/Button";
import ColorSwatchPicker from "./ColorSwatchPicker";
import AnimalPicker from "./AnimalPicker";
import StickerThemePicker from "./StickerThemePicker";
import TagInput from "./TagInput";

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChildAdded: () => void;
}

interface FormState {
  name: string;
  age: string;
  favouriteColor: string;
  favouriteAnimal: FavouriteAnimal | "";
  stickerTheme: StickerTheme | "";
  culturalInterests: string[];
}

const EMPTY: FormState = {
  name: "",
  age: "",
  favouriteColor: "#7FB069",
  favouriteAnimal: "",
  stickerTheme: "",
  culturalInterests: [],
};

const STEPS = ["About", "Preferences", "Interests"] as const;

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function AddChildModal({ isOpen, onClose, onChildAdded }: AddChildModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [celebrating, setCelebrating] = useState(false);

  const reset = () => {
    setForm(EMPTY);
    setStep(0);
    setError("");
    setCelebrating(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Validation per step
  const canProceed = () => {
    if (step === 0) {
      const age = parseInt(form.age);
      return form.name.trim().length > 0 && !isNaN(age) && age >= 2 && age <= 17;
    }
    if (step === 1) {
      return form.favouriteColor !== "" && form.favouriteAnimal !== "" && form.stickerTheme !== "";
    }
    return true; // step 2 (interests) is optional
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data: Omit<NewChildData, "id"> = {
        name: form.name.trim(),
        age: parseInt(form.age),
        favouriteColor: form.favouriteColor,
        favouriteAnimal: form.favouriteAnimal as FavouriteAnimal,
        stickerTheme: form.stickerTheme as StickerTheme,
        culturalInterests: form.culturalInterests,
        gardenStage: "seed",
        stickerCount: 0,
        badges: [],
      };
      await addDoc(collection(db, "parents", user.uid, "children"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      setCelebrating(true);
      setTimeout(() => {
        setCelebrating(false);
        reset();
        onChildAdded();
        onClose();
      }, 1800);
    } catch {
      setError("Something went wrong planting the garden. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? {} : { opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-bark-brown/30 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={reduced ? {} : { opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? {} : { opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="
                bg-cream-bg rounded-3xl shadow-2xl shadow-bark-brown/20
                w-full max-w-lg max-h-[90vh] overflow-y-auto
                border border-white/60
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* Celebration overlay */}
              <AnimatePresence>
                {celebrating && (
                  <motion.div
                    initial={reduced ? {} : { opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduced ? {} : { opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-cream-bg"
                  >
                    <motion.div
                      animate={reduced ? {} : { rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: 1 }}
                      className="text-8xl mb-4"
                    >
                      🌱
                    </motion.div>
                    <p className="font-baloo text-2xl font-bold text-forest-green text-center px-6">
                      {form.name}'s garden<br />has been planted!
                    </p>
                    <div className="flex gap-2 mt-4 text-3xl">
                      {["✨","🌸","⭐","🌿","✨"].map((s, i) => (
                        <motion.span
                          key={i}
                          initial={reduced ? {} : { opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          {s}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="bg-gradient-to-r from-forest-green to-leaf-green px-6 py-5 rounded-t-3xl relative">
                <h2 className="font-baloo text-xl font-bold text-white">
                  🌱 Add a New Child
                </h2>
                <p className="text-white/70 font-fredoka text-sm">Plant a new garden together</p>
                <button
                  onClick={handleClose}
                  aria-label="Close modal"
                  className="absolute top-4 right-4 text-white/70 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center px-6 pt-5 gap-2">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex items-center flex-1">
                    <div className={`
                      flex items-center justify-center w-7 h-7 rounded-full text-xs font-fredoka font-bold
                      transition-all duration-300
                      ${i <= step
                        ? "bg-forest-green text-white"
                        : "bg-leaf-green/20 text-soil-brown/50"
                      }
                    `}>
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span className={`ml-1.5 text-xs font-fredoka hidden sm:block ${i <= step ? "text-forest-green font-semibold" : "text-soil-brown/50"}`}>
                      {label}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded transition-all duration-300 ${i < step ? "bg-forest-green" : "bg-leaf-green/20"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Form body */}
              <div className="px-6 pt-4 pb-6 space-y-5">
                <AnimatePresence mode="wait">
                  {/* ── Step 0: About ──────────────────────────────── */}
                  {step === 0 && (
                    <motion.div
                      key="step0"
                      initial={reduced ? {} : { opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? {} : { opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div>
                        <label htmlFor="child-name" className={labelClass}>
                          Child's name <span className="text-flower-pink">*</span>
                        </label>
                        <input
                          id="child-name"
                          type="text"
                          required
                          placeholder="e.g. Lily"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="child-age" className={labelClass}>
                          Age <span className="text-flower-pink">*</span>
                          <span className="text-soil-brown/50 font-normal ml-1">(2–17)</span>
                        </label>
                        <input
                          id="child-age"
                          type="number"
                          required
                          min={2}
                          max={17}
                          placeholder="e.g. 7"
                          value={form.age}
                          onChange={(e) => setForm({ ...form, age: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 1: Preferences ────────────────────────── */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={reduced ? {} : { opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? {} : { opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div>
                        <label className={labelClass}>Favourite colour</label>
                        <div className="mt-2">
                          <ColorSwatchPicker
                            value={form.favouriteColor}
                            onChange={(c) => setForm({ ...form, favouriteColor: c })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>
                          Favourite animal <span className="text-flower-pink">*</span>
                        </label>
                        <div className="mt-2">
                          <AnimalPicker
                            value={form.favouriteAnimal}
                            onChange={(a) => setForm({ ...form, favouriteAnimal: a })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>
                          Sticker theme <span className="text-flower-pink">*</span>
                        </label>
                        <div className="mt-2">
                          <StickerThemePicker
                            value={form.stickerTheme}
                            onChange={(t) => setForm({ ...form, stickerTheme: t })}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Interests ──────────────────────────── */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={reduced ? {} : { opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? {} : { opacity: 0, x: -30 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className={labelClass}>
                          Cultural interests
                          <span className="text-soil-brown/50 font-normal ml-1">(optional)</span>
                        </label>
                        <p className="text-xs font-fredoka text-soil-brown/60 mb-2">
                          Add things they love — languages, traditions, hobbies…
                        </p>
                        <TagInput
                          value={form.culturalInterests}
                          onChange={(tags) => setForm({ ...form, culturalInterests: tags })}
                          placeholder="e.g. Spanish, Diwali, dinosaurs…"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                {error && (
                  <p role="alert" className="text-flower-pink text-sm font-fredoka text-center bg-pink-50 rounded-2xl p-3">
                    {error}
                  </p>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-3 pt-2">
                  {step > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => setStep(step - 1)}
                      disabled={loading}
                      className="flex-1"
                    >
                      ← Back
                    </Button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <Button
                      variant="primary"
                      onClick={() => setStep(step + 1)}
                      disabled={!canProceed()}
                      className="flex-1"
                    >
                      Next →
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={handleSubmit}
                      disabled={loading || !canProceed()}
                      className="flex-1"
                    >
                      {loading ? "Planting…" : "🌱 Plant Garden!"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const inputClass = `
  w-full px-4 py-3 rounded-2xl border-2 border-leaf-green/30
  bg-white/70 font-fredoka text-bark-brown placeholder-soil-brown/40
  focus:outline-none focus:border-forest-green focus:ring-2 focus:ring-forest-green/20
  transition-all duration-200
`;

const labelClass = "block text-sm font-fredoka font-semibold text-bark-brown mb-1";
