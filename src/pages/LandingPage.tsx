import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import FloatingBackground from "../components/ui/FloatingBackground";
import GardenIllustration from "../components/ui/GardenIllustration";
import Button from "../components/ui/Button";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-bg relative overflow-hidden flex flex-col font-fredoka text-bark-brown selection:bg-forest-green/20">
      {/* Ambient background - busier density for landing page */}
      <FloatingBackground density="medium" />

      {/* ── Navbar ───────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group focus:outline-none">
          <span className="text-3xl transform group-hover:rotate-12 transition-transform duration-300" role="img" aria-label="Sprout">
            🌱
          </span>
          <span className="font-baloo font-bold text-2xl text-forest-green tracking-wide">
            Green Forest
          </span>
        </Link>
        <Link to="/login" className="focus:outline-none">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
      </header>

      {/* ── Hero Content ─────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto px-6 py-8 md:py-16 w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Copy & Actions */}
        <div className="md:col-span-7 flex flex-col items-start text-left space-y-6 max-w-xl">
          
          {/* Pill Badge */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-leaf-green/15 border border-leaf-green/30 shadow-sm"
          >
            <span className="text-xs font-bold tracking-widest text-forest-green uppercase">
              🌱 A Growing Place for Every Child
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-baloo text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-bark-brown tracking-tight"
          >
            Every Child's Garden Grows at Their <br />
            <span className="text-forest-green bg-gradient-to-r from-forest-green to-leaf-green bg-clip-text text-transparent">
              Own Pace
            </span>
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-soil-brown/80 leading-relaxed font-fredoka"
          >
            Celebrate your child's milestones with a living digital garden. 
            Customize reward themes, track daily progress, and earn unique stickers 
            based on their favorite colors, animals, and interests.
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2"
          >
            <Link to="/login?mode=signup" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="bg-gradient-to-r from-leaf-green to-forest-green hover:from-forest-green hover:to-leaf-green border-none shadow-lg text-white"
              >
                Get Started <span className="ml-2 font-normal">→</span>
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" fullWidth>
                Sign In
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Right Column: Floating Demo & Accent Badges */}
        <div className="md:col-span-5 relative w-full flex items-center justify-center md:justify-end mt-8 md:mt-0">
          
          {/* Main Demo Card */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
            className="relative w-full max-w-[340px] bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl shadow-forest-green/10 border border-white/80"
          >
            {/* Accent color bar */}
            <div className="absolute top-0 inset-x-0 h-3 rounded-t-3xl bg-flower-pink" />

            {/* Stage title */}
            <div className="flex justify-between items-start pt-2 mb-4">
              <div>
                <h3 className="font-baloo text-2xl font-extrabold text-bark-brown">
                  Lily's Garden
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-flower-pink/10 text-xs font-bold text-flower-pink font-fredoka">
                  🌿 Sprout Stage
                </span>
              </div>
              <span className="text-2xl" role="img" aria-label="Watering Can">
                💧
              </span>
            </div>

            {/* Placeholder Illustration */}
            <div className="w-full h-40 bg-gradient-to-b from-sky-blue/5 to-transparent rounded-2xl flex items-center justify-center mb-5 border border-forest-green/5">
              <GardenIllustration stage="sprout" className="w-32 h-32" />
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex justify-between text-xs font-fredoka font-semibold text-soil-brown/80">
                <span>Next growth stage</span>
                <span>65%</span>
              </div>
              <div className="w-full h-3 bg-soil-brown/10 rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-gradient-to-r from-leaf-green to-forest-green rounded-full" />
              </div>
            </div>

            {/* Unlocked badge chip */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-leaf-green/10 border border-leaf-green/20">
              <span className="text-xl">🦋</span>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-forest-green font-fredoka">
                  New badge unlocked
                </p>
                <p className="text-[10px] text-soil-brown/70">
                  Earned for 5 days of care
                </p>
              </div>
            </div>
          </motion.div>

          {/* Floating badge 1: 100% Fun */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, x: -30, y: 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.4 }}
            className="absolute -bottom-6 left-4 md:-left-8 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg border border-white flex items-center gap-2"
          >
            <span className="text-lg">🌻</span>
            <span className="text-xs font-bold text-bark-brown font-fredoka">
              100% Kid Friendly
            </span>
          </motion.div>

          {/* Floating badge 2: Flower icon / theme */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, x: 30, y: -40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.5 }}
            className="absolute -top-6 right-2 md:-right-4 bg-white/90 backdrop-blur-md rounded-full w-12 h-12 shadow-lg border border-white flex items-center justify-center"
          >
            <span className="text-2xl animate-spin" style={{ animationDuration: '8s' }} role="img" aria-label="Flower">
              🌸
            </span>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-soil-brown/50 font-fredoka border-t border-leaf-green/10 mt-auto">
        &copy; {new Date().getFullYear()} Green Forest. Made for parents and therapists with love.
      </footer>
    </div>
  );
}
