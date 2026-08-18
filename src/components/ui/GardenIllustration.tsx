// PLACEHOLDER: All stage illustrations below are placeholder SVGs.
// Replace with final illustrated artwork before production.
// Each SVG is 200x200, self-contained, and receives className for sizing.

import type { ReactElement } from "react";
import type { GardenStage } from "../../types/child";

interface GardenIllustrationProps {
  stage: GardenStage;
  className?: string;
}

// ─── PLACEHOLDER SVGs per garden stage ───────────────────────────────────────

// PLACEHOLDER: seed stage
function SeedSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Seed stage">
      <ellipse cx="100" cy="160" rx="55" ry="18" fill="#8B6247" opacity="0.25" />
      <ellipse cx="100" cy="145" rx="20" ry="14" fill="#6B4A3D" />
      <ellipse cx="100" cy="138" rx="14" ry="10" fill="#8B6247" />
      <path d="M100 130 Q92 118 88 105 Q95 110 100 108 Q105 110 112 105 Q108 118 100 130Z"
        fill="#7FB069" opacity="0.7" />
      {/* sparkle dots */}
      {[[-22,-30],[22,-25],[-5,-45],[18,-45]].map(([dx,dy],i) => (
        <circle key={i} cx={100+dx} cy={140+dy} r="3" fill="#F4D35E" opacity="0.8" />
      ))}
    </svg>
  );
}

// PLACEHOLDER: sprout stage
function SproutSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Sprout stage">
      <ellipse cx="100" cy="168" rx="55" ry="16" fill="#8B6247" opacity="0.25" />
      {/* soil mound */}
      <ellipse cx="100" cy="162" rx="38" ry="12" fill="#8B6247" />
      {/* stem */}
      <path d="M100 160 Q100 130 100 110" stroke="#4A7C59" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* left leaf */}
      <path d="M100 130 Q75 118 70 100 Q90 108 100 130Z" fill="#7FB069" />
      {/* right leaf */}
      <path d="M100 125 Q125 112 130 95 Q110 105 100 125Z" fill="#4A7C59" />
      {/* top bud */}
      <circle cx="100" cy="105" r="9" fill="#F2A6B0" />
      <circle cx="100" cy="105" r="5" fill="#F4D35E" />
    </svg>
  );
}

// PLACEHOLDER: sapling stage
function SaplingSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Sapling stage">
      <ellipse cx="100" cy="168" rx="55" ry="16" fill="#8B6247" opacity="0.25" />
      <rect x="94" y="100" width="12" height="70" rx="6" fill="#6B4A3D" />
      {/* canopy */}
      <ellipse cx="100" cy="88" rx="42" ry="38" fill="#7FB069" />
      <ellipse cx="78" cy="96" rx="22" ry="18" fill="#4A7C59" />
      <ellipse cx="122" cy="96" rx="22" ry="18" fill="#4A7C59" />
      {/* flowers */}
      <circle cx="90" cy="76" r="7" fill="#F2A6B0" />
      <circle cx="90" cy="76" r="3.5" fill="#F4D35E" />
      <circle cx="112" cy="82" r="7" fill="#F4A259" />
      <circle cx="112" cy="82" r="3.5" fill="#F4D35E" />
    </svg>
  );
}

// PLACEHOLDER: smallTree stage
function SmallTreeSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Small tree stage">
      <ellipse cx="100" cy="172" rx="60" ry="16" fill="#8B6247" opacity="0.25" />
      <rect x="92" y="110" width="16" height="64" rx="7" fill="#6B4A3D" />
      <ellipse cx="100" cy="95" rx="55" ry="50" fill="#7FB069" />
      <ellipse cx="70" cy="108" rx="28" ry="22" fill="#4A7C59" />
      <ellipse cx="130" cy="108" rx="28" ry="22" fill="#4A7C59" />
      <ellipse cx="100" cy="72" rx="32" ry="28" fill="#7FB069" />
      {/* fruit dots */}
      {[[88,94],[112,88],[102,112],[76,100]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="#F2A6B0" />
      ))}
    </svg>
  );
}

// PLACEHOLDER: cocoon stage  (metamorphosis metaphor)
function CocoonSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Cocoon stage">
      <ellipse cx="100" cy="168" rx="55" ry="16" fill="#8B6247" opacity="0.25" />
      {/* branch */}
      <path d="M60 80 Q100 60 140 80" stroke="#6B4A3D" strokeWidth="8" fill="none" strokeLinecap="round" />
      {/* hanging thread */}
      <line x1="100" y1="80" x2="100" y2="105" stroke="#8B6247" strokeWidth="3" />
      {/* cocoon body */}
      <ellipse cx="100" cy="133" rx="24" ry="36" fill="#B784A7" opacity="0.9" />
      <ellipse cx="100" cy="133" rx="18" ry="30" fill="#F2A6B0" opacity="0.6" />
      {/* silk wrap lines */}
      {[-12,-4,4,12].map((dy,i) => (
        <path key={i} d={`M78 ${133+dy} Q100 ${130+dy-4} 122 ${133+dy}`}
          stroke="#B784A7" strokeWidth="2" fill="none" opacity="0.5" />
      ))}
      {/* sparkles */}
      {[[-28,-20],[28,-15],[0,-38]].map(([dx,dy],i) => (
        <text key={i} x={100+dx} y={133+dy} textAnchor="middle" fontSize="14" opacity="0.8">✨</text>
      ))}
    </svg>
  );
}

// PLACEHOLDER: butterfly stage
function ButterflySVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Butterfly stage">
      <ellipse cx="100" cy="172" rx="55" ry="16" fill="#8B6247" opacity="0.25" />
      {/* body */}
      <ellipse cx="100" cy="115" rx="6" ry="20" fill="#6B4A3D" />
      {/* upper wings */}
      <path d="M100 105 Q68 70 50 90 Q60 115 100 112Z" fill="#F4A259" opacity="0.9" />
      <path d="M100 105 Q132 70 150 90 Q140 115 100 112Z" fill="#F4A259" opacity="0.9" />
      {/* lower wings */}
      <path d="M100 120 Q72 118 60 138 Q80 148 100 130Z" fill="#F2A6B0" opacity="0.9" />
      <path d="M100 120 Q128 118 140 138 Q120 148 100 130Z" fill="#F2A6B0" opacity="0.9" />
      {/* wing patterns */}
      <circle cx="78" cy="96" r="8" fill="#F4D35E" opacity="0.6" />
      <circle cx="122" cy="96" r="8" fill="#F4D35E" opacity="0.6" />
      {/* antennae */}
      <path d="M97 96 Q85 75 80 68" stroke="#6B4A3D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M103 96 Q115 75 120 68" stroke="#6B4A3D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="68" r="3" fill="#F4D35E" />
      <circle cx="120" cy="68" r="3" fill="#F4D35E" />
    </svg>
  );
}

// PLACEHOLDER: fullTree stage
function FullTreeSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Full tree stage">
      <ellipse cx="100" cy="174" rx="65" ry="16" fill="#8B6247" opacity="0.3" />
      <rect x="90" y="118" width="20" height="58" rx="9" fill="#6B4A3D" />
      {/* large canopy layers */}
      <ellipse cx="100" cy="108" rx="68" ry="60" fill="#7FB069" />
      <ellipse cx="68"  cy="120" rx="34" ry="26" fill="#4A7C59" />
      <ellipse cx="132" cy="120" rx="34" ry="26" fill="#4A7C59" />
      <ellipse cx="100" cy="75"  rx="42" ry="36" fill="#7FB069" />
      <ellipse cx="100" cy="58"  rx="26" ry="22" fill="#4A7C59" />
      {/* flowers & fruits scattered */}
      {[
        [85,70,"#F2A6B0"],[115,78,"#F4A259"],[68,108,"#F4D35E"],
        [132,105,"#F2A6B0"],[100,95,"#F4A259"],[78,128,"#B784A7"],
      ].map(([cx,cy,fill],i) => (
        <circle key={i} cx={Number(cx)} cy={Number(cy)} r="6" fill={String(fill)} />
      ))}
      {/* star sparkles at top */}
      {[[-10,-20],[10,-24],[0,-35]].map(([dx,dy],i) => (
        <text key={i} x={100+dx} y={58+dy} fontSize="12" textAnchor="middle">⭐</text>
      ))}
    </svg>
  );
}

// ─── Stage → Component map ────────────────────────────────────────────────────

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
