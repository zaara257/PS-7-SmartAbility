// src/constants/rhymes.ts
// Rotating rhyme pool for Level 4.
// TODO: review copy — all rhymes below are placeholder text for functional testing.
// Replace with final child-facing copy before production.

export interface RhymeDef {
  id: string;
  emoji: string;
  lines: [string, string, string, string]; // 4-line rhyme
}

// prettier-ignore
export const RHYME_POOL: RhymeDef[] = [
  {
    id: "r1",
    emoji: "🌟",
    lines: [
      "You tried your best and that's the way,",   // TODO: review copy
      "To make the most of every day!",             // TODO: review copy
      "With every step and every try,",             // TODO: review copy
      "Your star shines bright up in the sky!",     // TODO: review copy
    ],
  },
  {
    id: "r2",
    emoji: "🌈",
    lines: [
      "After the rain the rainbow shows,",          // TODO: review copy
      "And after trying, confidence grows!",        // TODO: review copy
      "You did it once, you'll do it again,",       // TODO: review copy
      "The rainbow blooms through shine and rain!", // TODO: review copy
    ],
  },
  {
    id: "r3",
    emoji: "🌱",
    lines: [
      "A tiny seed beneath the ground,",            // TODO: review copy
      "Keeps pushing up without a sound.",          // TODO: review copy
      "Just like you — each day you grow,",         // TODO: review copy
      "Stronger than you'll ever know!",            // TODO: review copy
    ],
  },
  {
    id: "r4",
    emoji: "🎈",
    lines: [
      "Up, up, up your balloon floats high,",       // TODO: review copy
      "Carrying your effort to the sky!",           // TODO: review copy
      "Hold on tight and let it soar,",             // TODO: review copy
      "Because you're worth cheering for!",         // TODO: review copy
    ],
  },
  {
    id: "r5",
    emoji: "🦋",
    lines: [
      "Brave little wings begin to spread,",        // TODO: review copy
      "No need to worry, no need to dread.",        // TODO: review copy
      "You stretch and try and off you fly —",      // TODO: review copy
      "A butterfly against the sky!",               // TODO: review copy
    ],
  },
  {
    id: "r6",
    emoji: "🏆",
    lines: [
      "Champions aren't born in a single day,",    // TODO: review copy
      "They practice hard and learn to play.",      // TODO: review copy
      "You showed up, tried, and gave your all —", // TODO: review copy
      "That makes you the greatest of all!",        // TODO: review copy
    ],
  },
  {
    id: "r7",
    emoji: "🌻",
    lines: [
      "The sunflower always faces the sun,",        // TODO: review copy
      "Just like you when the day's begun.",        // TODO: review copy
      "Turn toward the light and you will see,",   // TODO: review copy
      "How wonderful you're going to be!",         // TODO: review copy
    ],
  },
  {
    id: "r8",
    emoji: "🎶",
    lines: [
      "Every note starts with one small sound,",   // TODO: review copy
      "And look at the music you have found!",     // TODO: review copy
      "Keep playing your song, true and bright —", // TODO: review copy
      "You fill the whole world with delight!",    // TODO: review copy
    ],
  },
];
