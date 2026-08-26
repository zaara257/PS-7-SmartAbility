// src/components/ui/GardenIllustration.tsx
// Vibrant, highly detailed illustrated SVGs for each garden stage.
// Uses inline CSS keyframe animations for premium interactive touch (swaying stems,
// floating magic sparkles, fluttering butterflies, and glowing fruits).

import type { ReactElement } from "react";
import type { GardenStage } from "../../types/child";

interface GardenIllustrationProps {
  stage: GardenStage;
  className?: string;
}

// Common styles injected into SVGs to run hardware-accelerated animations
const SVG_STYLES = `
  .anim-sway {
    transform-origin: bottom center;
    animation: svgSway 3s ease-in-out infinite;
  }
  .anim-sway-slow {
    transform-origin: bottom center;
    animation: svgSway 4.5s ease-in-out infinite;
  }
  .anim-float {
    animation: svgFloat 2.5s ease-in-out infinite;
  }
  .anim-pulse {
    animation: svgPulse 2s ease-in-out infinite;
  }
  .anim-flutter {
    transform-origin: center;
    animation: svgFlutter 0.8s ease-in-out infinite;
  }
  .anim-sparkle-1 {
    transform-origin: center;
    animation: svgSparkle 1.8s ease-in-out infinite;
  }
  .anim-sparkle-2 {
    transform-origin: center;
    animation: svgSparkle 2.4s ease-in-out infinite;
  }

  @keyframes svgSway {
    0%, 100% { transform: rotate(-3deg); }
    50% { transform: rotate(3deg); }
  }
  @keyframes svgFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  @keyframes svgPulse {
    0%, 100% { opacity: 0.3; transform: scale(0.95); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  @keyframes svgFlutter {
    0%, 100% { transform: scaleX(1); }
    50% { transform: scaleX(0.2); }
  }
  @keyframes svgSparkle {
    0%, 100% { transform: scale(0.7) rotate(0deg); opacity: 0.4; }
    50% { transform: scale(1.2) rotate(45deg); opacity: 1; }
  }
`;

// ─── SVG per garden stage ───────────────────────────────────────────

// Seed stage: detailed soil mound, glowing seed cracks, floating magic dust
function SeedSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Seed stage">
      <style>{SVG_STYLES}</style>
      {/* Background glow */}
      <circle cx="100" cy="140" r="45" fill="url(#seedGlow)" className="anim-pulse" />
      <ellipse cx="100" cy="165" rx="60" ry="15" fill="#8B6247" opacity="0.3" />
      {/* Rich layered soil */}
      <ellipse cx="100" cy="155" rx="35" ry="18" fill="#6B4A3D" />
      <ellipse cx="100" cy="150" rx="25" ry="12" fill="#8B6247" />
      {/* Seed pod */}
      <path d="M 85 142 Q 100 120 115 142 Q 100 160 85 142 Z" fill="#D4A373" stroke="#6B4A3D" strokeWidth="2" />
      {/* Tiny sprout leaf peaking out */}
      <path d="M 98 132 Q 95 120 88 115 Q 98 120 98 132 Z" fill="#7FB069" className="anim-sway" />
      {/* Sparkles */}
      <circle cx="75" cy="115" r="3" fill="#F4D35E" className="anim-sparkle-1" />
      <circle cx="125" cy="120" r="4" fill="#F4D35E" className="anim-sparkle-2" />
      
      <defs>
        <radialGradient id="seedGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4D35E" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F4D35E" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// Sprout stage: curved green stem, two leaves, blooming bud
function SproutSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Sprout stage">
      <style>{SVG_STYLES}</style>
      <ellipse cx="100" cy="170" rx="55" ry="14" fill="#8B6247" opacity="0.3" />
      <ellipse cx="100" cy="162" rx="38" ry="10" fill="#6B4A3D" />
      
      {/* Growing stem group */}
      <g className="anim-sway">
        <path d="M 100 162 Q 95 130 102 105" stroke="#4A7C59" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Left Leaf */}
        <path d="M 98 130 Q 75 125 70 110 Q 88 115 98 130 Z" fill="#7FB069" stroke="#4A7C59" strokeWidth="1" />
        {/* Right Leaf */}
        <path d="M 100 120 Q 122 110 128 95 Q 112 105 100 120 Z" fill="#4A7C59" stroke="#3A6C49" strokeWidth="1" />
        {/* Glowing rose bud */}
        <circle cx="102" cy="102" r="10" fill="#F2A6B0" />
        <circle cx="102" cy="102" r="6" fill="#F4D35E" />
      </g>
      {/* Floating sparkles */}
      <circle cx="60" cy="90" r="3" fill="#F4D35E" className="anim-sparkle-2" />
      <circle cx="140" cy="100" r="4.5" fill="#F4D35E" className="anim-sparkle-1" />
    </svg>
  );
}

// Sapling stage: small wooden trunk, two green canopies, blooming flowers
function SaplingSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Sapling stage">
      <style>{SVG_STYLES}</style>
      <ellipse cx="100" cy="172" rx="60" ry="14" fill="#8B6247" opacity="0.3" />
      {/* Trunk */}
      <path d="M 95 172 L 97 105 L 103 105 L 105 172 Z" fill="#6B4A3D" />
      {/* Canopy */}
      <g className="anim-sway">
        <ellipse cx="100" cy="85" rx="38" ry="34" fill="#7FB069" />
        <ellipse cx="78" cy="95" rx="20" ry="18" fill="#4A7C59" />
        <ellipse cx="122" cy="95" rx="20" ry="18" fill="#4A7C59" />
        {/* Flowers */}
        <circle cx="90" cy="72" r="8" fill="#F2A6B0" />
        <circle cx="90" cy="72" r="4" fill="#F4D35E" />
        <circle cx="112" cy="85" r="7" fill="#F4A259" />
        <circle cx="112" cy="85" r="3" fill="#F4D35E" />
      </g>
      <circle cx="100" cy="40" r="4" fill="#F4D35E" className="anim-sparkle-1" />
    </svg>
  );
}

// Small Tree stage: taller trunk, split branches, apples/fruits growing
function SmallTreeSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Small tree stage">
      <style>{SVG_STYLES}</style>
      <ellipse cx="100" cy="175" rx="65" ry="14" fill="#8B6247" opacity="0.3" />
      {/* Trunk and Branch */}
      <path d="M 92 175 L 94 110 L 80 85 L 85 82 L 98 105 L 108 175 Z" fill="#6B4A3D" />
      {/* Main canopy */}
      <g className="anim-sway">
        <ellipse cx="100" cy="85" rx="46" ry="42" fill="#7FB069" />
        <ellipse cx="70" cy="98" rx="25" ry="22" fill="#4A7C59" />
        <ellipse cx="130" cy="98" rx="25" ry="22" fill="#4A7C59" />
        {/* Bright red glowing fruits */}
        <circle cx="85" cy="80" r="6" fill="#F2A6B0" className="anim-float" />
        <circle cx="115" cy="75" r="6" fill="#F2A6B0" className="anim-float" />
        <circle cx="100" cy="100" r="7" fill="#F4A259" className="anim-float" />
      </g>
      {/* Sparkles */}
      <circle cx="50" cy="65" r="4.5" fill="#F4D35E" className="anim-sparkle-2" />
      <circle cx="150" cy="60" r="3.5" fill="#F4D35E" className="anim-sparkle-1" />
    </svg>
  );
}

// Cocoon stage: tree branch with glowing cocoon, magical insect particles
function CocoonSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Cocoon stage">
      <style>{SVG_STYLES}</style>
      <ellipse cx="100" cy="175" rx="60" ry="12" fill="#8B6247" opacity="0.3" />
      {/* Hanging branch structure */}
      <path d="M 40 75 Q 100 55 160 75" stroke="#6B4A3D" strokeWidth="8" fill="none" strokeLinecap="round" />
      
      {/* Cocoon hanger */}
      <line x1="100" y1="67" x2="100" y2="95" stroke="#8B6247" strokeWidth="3" />
      
      {/* Cocoon capsule */}
      <g className="anim-sway">
        <ellipse cx="100" cy="120" rx="22" ry="32" fill="#B784A7" stroke="#8B6247" strokeWidth="2" />
        <ellipse cx="100" cy="120" rx="16" ry="26" fill="#F2A6B0" opacity="0.75" />
        {/* Silk wraps */}
        <path d="M 85 115 Q 100 110 115 115" stroke="#B784A7" strokeWidth="2.5" fill="none" opacity="0.8" />
        <path d="M 86 128 Q 100 123 114 128" stroke="#B784A7" strokeWidth="2.5" fill="none" opacity="0.8" />
      </g>

      {/* Magical glow surrounding the cocoon */}
      <circle cx="100" cy="120" r="40" fill="url(#cocoonGlow)" className="anim-pulse" pointerEvents="none" />

      <defs>
        <radialGradient id="cocoonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B784A7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#B784A7" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// Butterfly stage: flower patch with fluttering animated butterfly
function ButterflySVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Butterfly stage">
      <style>{SVG_STYLES}</style>
      <ellipse cx="100" cy="175" rx="65" ry="12" fill="#8B6247" opacity="0.3" />
      
      {/* Pretty flower background */}
      <g className="anim-sway-slow">
        <path d="M 70 175 Q 65 140 75 125" stroke="#4A7C59" strokeWidth="4" fill="none" />
        <circle cx="75" cy="120" r="8" fill="#F4D35E" />
        <circle cx="75" cy="120" r="4" fill="#F2A6B0" />
        
        <path d="M 130 175 Q 135 145 125 130" stroke="#4A7C59" strokeWidth="4" fill="none" />
        <circle cx="125" cy="125" r="7" fill="#F4A259" />
        <circle cx="125" cy="125" r="3" fill="#F4D35E" />
      </g>

      {/* Butterfly wings with scaleX animation */}
      <g transform="translate(100, 90)" className="anim-float">
        <g className="anim-flutter">
          {/* Left wing */}
          <path d="M 0 -5 Q -25 -25 -35 -10 Q -25 15 0 5" fill="#F4A259" stroke="#6B4A3D" strokeWidth="1.5" />
          <path d="M 0 3 Q -20 18 -25 8 Q -18 -5 0 0" fill="#F2A6B0" stroke="#6B4A3D" strokeWidth="1.5" />
          
          {/* Right wing */}
          <path d="M 0 -5 Q 25 -25 35 -10 Q 25 15 0 5" fill="#F4A259" stroke="#6B4A3D" strokeWidth="1.5" />
          <path d="M 0 3 Q 20 18 25 8 Q 18 -5 0 0" fill="#F2A6B0" stroke="#6B4A3D" strokeWidth="1.5" />
        </g>
        {/* Body */}
        <ellipse cx="0" cy="0" rx="3.5" ry="15" fill="#6B4A3D" />
        {/* Antennae */}
        <path d="M -2 -14 Q -8 -22 -6 -24" stroke="#6B4A3D" strokeWidth="1.5" fill="none" />
        <path d="M 2 -14 Q 8 -22 6 -24" stroke="#6B4A3D" strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  );
}

// Full Garden stage: large blooming tree, flowers, fruit, butterflies, sparkles
function FullTreeSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Full tree stage">
      <style>{SVG_STYLES}</style>
      <ellipse cx="100" cy="178" rx="75" ry="12" fill="#8B6247" opacity="0.35" />
      
      {/* Heavy broad trunk */}
      <path d="M 88 178 L 92 110 L 108 110 L 112 178 Z" fill="#6B4A3D" />
      
      {/* Broad beautiful multi-layered canopy */}
      <g className="anim-sway-slow">
        <ellipse cx="100" cy="98" rx="60" ry="52" fill="#7FB069" />
        <ellipse cx="64" cy="108" rx="35" ry="28" fill="#4A7C59" />
        <ellipse cx="136" cy="108" rx="35" ry="28" fill="#4A7C59" />
        <ellipse cx="100" cy="65" rx="42" ry="34" fill="#7FB069" />
        
        {/* Multi-coloured glowing fruits & blossoms */}
        <circle cx="80" cy="90" r="7.5" fill="#F2A6B0" className="anim-float" />
        <circle cx="120" cy="85" r="7.5" fill="#F4D35E" className="anim-float" />
        <circle cx="100" cy="115" r="8" fill="#F4A259" className="anim-float" />
        <circle cx="60" cy="112" r="6" fill="#B784A7" className="anim-float" />
        <circle cx="140" cy="112" r="6" fill="#F2A6B0" className="anim-float" />
      </g>

      {/* Mini butterfly hovering */}
      <g transform="translate(145, 60)" className="anim-float">
        <g className="anim-flutter" style={{ transform: "scale(0.5)" }}>
          <path d="M 0 -5 Q -15 -18 -20 -8 Q -15 8 0 2" fill="#F4D35E" />
          <path d="M 0 -5 Q 15 -18 20 -8 Q 15 8 0 2" fill="#F4D35E" />
        </g>
        <ellipse cx="0" cy="0" rx="1.5" ry="6" fill="#6B4A3D" />
      </g>

      {/* Sparkle groups */}
      <circle cx="70" cy="45" r="4" fill="#F4D35E" className="anim-sparkle-1" />
      <circle cx="130" cy="40" r="5" fill="#F4D35E" className="anim-sparkle-2" />
      <circle cx="100" cy="30" r="3.5" fill="#F4D35E" className="anim-sparkle-1" />
    </svg>
  );
}

// ─── Stage → Component map ───────────────────────────────────────────

const STAGE_MAP: Record<GardenStage, (props: { className?: string }) => ReactElement> = {
  seed:      SeedSVG,
  sprout:    SproutSVG,
  sapling:   SaplingSVG,
  smallTree: SmallTreeSVG,
  cocoon:    CocoonSVG,
  butterfly: ButterflySVG,
  fullTree:  FullTreeSVG,
};

export default function GardenIllustration({ stage, className = "w-28 h-28" }: GardenIllustrationProps) {
  const StageComponent = STAGE_MAP[stage] ?? SeedSVG;
  return <StageComponent className={className} />;
}
