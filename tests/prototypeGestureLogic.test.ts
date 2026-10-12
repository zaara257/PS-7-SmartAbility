import assert from "node:assert/strict";
import test from "node:test";

import {
  addPrototypeVote,
  evaluatePrototypeScores,
  PROTOTYPE_GESTURE_LABELS,
  stablePrototypeLevel,
} from "../src/components/rewards/prototypeGestureLogic.ts";
import {
  canTriggerReward,
  GESTURE_LABELS,
  GESTURE_V2_REWARD_LEVELS,
  getStableLevel,
} from "../src/components/rewards/scannerLogic.ts";

test("prototype model indices retain the approved semantic mapping", () => {
  assert.deepEqual(PROTOTYPE_GESTURE_LABELS, ["1", "2", "3", "4", "background"]);
  assert.deepEqual(GESTURE_LABELS, ["1", "2", "3", "4", "background"]);

  for (const [index, label] of PROTOTYPE_GESTURE_LABELS.entries()) {
    const scores = [0.01, 0.01, 0.01, 0.01, 0.01];
    scores[index] = 0.96;
    const result = evaluatePrototypeScores(scores);
    assert.ok(result);
    assert.equal(result.label, label);
    assert.equal(result.candidate, label === "background" ? null : Number(label));
  }
});

test("prototype score filtering rejects weak or ambiguous gesture candidates", () => {
  assert.equal(evaluatePrototypeScores([0.45, 0.43, 0.04, 0.04, 0.04])?.candidate, null);
  assert.equal(evaluatePrototypeScores([0.76, 0.08, 0.06, 0.05, 0.05])?.candidate, null);
  assert.equal(evaluatePrototypeScores([0.9, 0.1, 0.0, 0.0]) , null);
});

test("prototype stability requires nine matching votes and never returns level five", () => {
  let votes: Array<1 | 2 | 3 | 4 | null> = [];
  for (let index = 0; index < 8; index += 1) votes = addPrototypeVote(votes, 3);
  assert.equal(stablePrototypeLevel(votes), null);
  votes = addPrototypeVote(votes, 3);
  assert.equal(stablePrototypeLevel(votes), 3);
  assert.equal(stablePrototypeLevel(Array.from({ length: 12 }, () => null)), null);
});

test("background and missing-hand frames cannot produce a stable reward level", () => {
  assert.equal(evaluatePrototypeScores([0.01, 0.01, 0.01, 0.01, 0.96])?.candidate, null);
  const missingHandVotes = Array.from({ length: 12 }, () => null) as Array<1 | 2 | 3 | 4 | null>;
  assert.equal(getStableLevel(missingHandVotes, GESTURE_V2_REWARD_LEVELS), null);
});

test("the reward guard prevents duplicate and cooldown triggers", () => {
  assert.equal(canTriggerReward(4, false, 0, 100), true);
  assert.equal(canTriggerReward(4, true, 0, 100), false);
  assert.equal(canTriggerReward(4, false, 101, 100), false);
  assert.equal(canTriggerReward(null, false, 0, 100), false);
});
