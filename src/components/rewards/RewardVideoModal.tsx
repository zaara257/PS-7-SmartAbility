// src/components/rewards/RewardVideoModal.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";


interface RewardVideoModalProps {
  videoSrc: string; // e.g. "/rewards/stamp/superhero(1).mp4"
  label: string;
  onContinue: () => void;
}

export default function RewardVideoModal({ videoSrc, label, onContinue }: RewardVideoModalProps) {
  const [muted, setMuted] = useState(false); // Default to unmuted per spec
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play safety check (browsers might block unmuted autoplay occasionally)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay with audio blocked, attempting muted autoplay:", err);
        setMuted(true);
      });
    }
  }, [videoSrc]);

  return (
    <AnimatePresence>
      <motion.div
        key="video-modal"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bark-brown/95 backdrop-blur-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="relative w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-sunshine-yellow flex flex-col">
          {/* Header info */}
          <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/20">
            <span className="font-fredoka text-sm text-white font-semibold">
              ✨ {label}
            </span>
          </div>

          {/* Sound toggle overlay */}
          <button
            onClick={() => setMuted(!muted)}
            className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 border border-white/20 transition-all active:scale-95 cursor-pointer"
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            <span className="text-xl leading-none flex items-center justify-center w-6 h-6 select-none">
              {muted ? "🔇" : "🔊"}
            </span>
          </button>

          {/* Video Container */}
          <div className="aspect-video w-full relative bg-neutral-900 flex items-center justify-center">
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              playsInline
              muted={muted}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Bottom Bar with big tapping target Continue Button */}
          <div className="bg-cream-bg p-6 flex justify-center items-center">
            <button
              onClick={onContinue}
              className="
                w-full max-w-sm px-8 py-5 rounded-3xl
                bg-gradient-to-r from-forest-green to-leaf-green
                border-b-4 border-forest-green/80
                text-white font-baloo text-2xl font-bold
                shadow-lg shadow-forest-green/20
                hover:brightness-105 active:scale-95 active:border-b-0 active:mt-1
                transition-all cursor-pointer text-center
              "
              id="video-continue-btn"
            >
              Continue 🌱
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
