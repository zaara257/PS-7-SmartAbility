// src/constants/characterLines.ts
// Encouraging lines per animal character.
// Each animal has 7 lines. Picked with useNonRepeatingPick to avoid immediate repeats.
// TODO: review copy — all lines below are placeholder text for functional testing.
// Replace with final child-facing copy before production.

import type { FavouriteAnimal } from "../types/child";

export const CHARACTER_LINES: Record<FavouriteAnimal, string[]> = {
  rabbit: [
    "Hop, hop — you did it! I knew you could!", // TODO: review copy
    "Every little hop gets you further than you think!", // TODO: review copy
    "You're faster than you know — look how far you've come!", // TODO: review copy
    "Keep bounding forward — the meadow is yours!", // TODO: review copy
    "That was AMAZING! Even my ears wiggled with excitement!", // TODO: review copy
    "You should be SO proud of yourself right now!", // TODO: review copy
    "What a superstar — I'm your biggest fan!", // TODO: review copy
  ],
  fox: [
    "Clever and kind — that's you all over!", // TODO: review copy
    "Foxes are curious and brave, just like you!", // TODO: review copy
    "Look at you go — sharp as a fox and twice as wonderful!", // TODO: review copy
    "You figured it out! Brilliant minds do brilliant things!", // TODO: review copy
    "Every great adventure starts with one brave step — you took it!", // TODO: review copy
    "You make the forest brighter just by being in it!", // TODO: review copy
    "Wow! That was something special — you should feel great!", // TODO: review copy
  ],
  owl: [
    "Wise and wonderful — that's you! I'm so impressed!", // TODO: review copy
    "Every owl knows: trying is the wisest thing of all!", // TODO: review copy
    "Hoo-hoo-hooray! You did it brilliantly!", // TODO: review copy
    "You're learning so much — your wings are growing every day!", // TODO: review copy
    "The night is full of stars, and so are you!", // TODO: review copy
    "Patience and effort — the two owl superpowers. You've got both!", // TODO: review copy
    "That deserves a round of feathered applause — well done!", // TODO: review copy
  ],
  butterfly: [
    "You're spreading your wings and it's beautiful to watch!", // TODO: review copy
    "Every flutter counts — you're flying higher every day!", // TODO: review copy
    "Look at all those colours! Just like you — bright and dazzling!", // TODO: review copy
    "Transformation takes courage. You've got so much of it!", // TODO: review copy
    "You turned something hard into something beautiful. Amazing!", // TODO: review copy
    "Dancing through challenges like only a butterfly can!", // TODO: review copy
    "The garden is better because you're in it — truly!", // TODO: review copy
  ],
  turtle: [
    "Slow and steady — and look how far you've come!", // TODO: review copy
    "Every step matters, and yours really counted today!", // TODO: review copy
    "Strong shell, stronger heart — that's you!", // TODO: review copy
    "You showed up and gave it your all. That's everything!", // TODO: review copy
    "Turtles carry their home with them — and you carry such a kind spirit!", // TODO: review copy
    "Patience is a superpower, and you've mastered it!", // TODO: review copy
    "One gentle step at a time — and look, you made it!", // TODO: review copy
  ],
  bird: [
    "Spread those wings — you're soaring today!", // TODO: review copy
    "Even little birds have the biggest songs. Sing yours proudly!", // TODO: review copy
    "Tweet tweet! That means 'you did spectacularly well!'", // TODO: review copy
    "The sky isn't the limit for you — you're already there!", // TODO: review copy
    "Every morning birds start fresh. You do too, and it shows!", // TODO: review copy
    "Your effort today made the whole tree sing with joy!", // TODO: review copy
    "Feathers, freedom, and fantastic — that's you today!", // TODO: review copy
  ],
  cat: [
    "Purrfectly done! You nailed it!", // TODO: review copy
    "Cats always land on their feet — and so do you!", // TODO: review copy
    "Nine lives of curiosity — and you use every one so well!", // TODO: review copy
    "That took real focus. Cats know all about focus!", // TODO: review copy
    "Meow! (That means 'I'm incredibly proud of you!')", // TODO: review copy
    "You moved with grace and got it done — whiskers would be twitching with pride!", // TODO: review copy
    "Playful, clever, and unstoppable — that's you!", // TODO: review copy
  ],
  dog: [
    "Woof! You did it and I couldn't be more excited!", // TODO: review copy
    "Loyal, brave, and brilliant — you are all three today!", // TODO: review copy
    "Tails wagging, hearts full — because of YOU!", // TODO: review copy
    "You fetched that challenge and brought it all the way home!", // TODO: review copy
    "Every dog knows: love and effort conquer everything. You proved it!", // TODO: review copy
    "Bounding with joy over here — because you're just that great!", // TODO: review copy
    "Best friend, best effort, best YOU!", // TODO: review copy
  ],
  unicorn: [
    "Magic is real — and you just made some happen!", // TODO: review copy
    "Only someone truly special could do what you just did!", // TODO: review copy
    "Sparkle, shimmer, and SHINE — that's your superpower today!", // TODO: review copy
    "Every wish you make matters, and today you made one come true!", // TODO: review copy
    "You're one of a kind — just like every unicorn should be!", // TODO: review copy
    "Rainbows follow you everywhere, and it's easy to see why!", // TODO: review copy
    "That was pure magic. Pure. Magic. I'm in awe!", // TODO: review copy
  ],
  dinosaur: [
    "ROAR! That was the mightiest effort I've ever seen!", // TODO: review copy
    "Dinosaurs ruled the earth — and you're ruling this moment!", // TODO: review copy
    "Prehistoric power, modern-day courage — that's you!", // TODO: review copy
    "T-Rexes never give up. Neither do you. RESPECT!", // TODO: review copy
    "That was ENORMOUS — just like your heart!", // TODO: review copy
    "Stomping through challenges like only a dino can — incredible!", // TODO: review copy
    "Millions of years of awesome, and it all led to THIS moment with you!", // TODO: review copy
  ],
};
