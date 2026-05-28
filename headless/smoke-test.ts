/**
 * Quick smoke test for the headless harness.
 * Runs a single match with random AI and prints results.
 */

import { runMatch } from './game-loop';
import { getStrategy } from './ai-strategies';

const config = {
  p1Name: 'P1',
  p2Name: 'P2',
  bestOfRounds: 3,
  isCpu: false,
  difficulty: 'medium' as const,
  gameMode: 'standard' as const,
};

const strategy = getStrategy('random');

console.log('Running smoke test: 1 match with random AI...');
const result = runMatch(config, strategy, 0);

console.log('\n=== RESULTS ===');
console.log(`Strategy: ${result.strategy}`);
console.log(`Duration: ${result.durationMs}ms`);
console.log(`Total frames: ${result.totalFrames}`);
console.log(`Total events: ${result.totalEvents}`);
console.log(`Rounds played: ${result.rounds.length}`);
console.log(`Final score: P1=${result.finalP1Score} P2=${result.finalP2Score}`);
console.log(`Winner: ${result.winner}`);

for (const round of result.rounds) {
  console.log(`\nRound ${round.roundIndex}:`);
  console.log(`  Turns survived: ${round.turnsSurvived}`);
  console.log(`  Score: H=${round.hiderScore} S=${round.seekerScore}`);
  console.log(`  Winner: ${round.winner}`);
  console.log(`  Events: ${round.events.filter(e => e.type === 'event').length}`);
  console.log(`  Frames: ${round.events.filter(e => e.type === 'frame').length}`);
}

// Quick validation
const issues: string[] = [];
if (result.rounds.length === 0) issues.push('No rounds played');
if (result.totalFrames === 0) issues.push('No frames logged');
if (result.durationMs === 0) issues.push('Zero duration');

for (const round of result.rounds) {
  const tagEvents = round.events.filter(e => e.eventType === 'tag_attempt');
  if (tagEvents.length === 0) issues.push(`Round ${round.roundIndex}: no tag event`);
  const turnSwaps = round.events.filter(e => e.eventType === 'turn_swap');
  if (turnSwaps.length === 0) issues.push(`Round ${round.roundIndex}: no turn swaps`);
}

if (issues.length > 0) {
  console.log('\n⚠️ ISSUES:');
  issues.forEach(i => console.log(`  - ${i}`));
} else {
  console.log('\n✅ Smoke test passed!');
}
