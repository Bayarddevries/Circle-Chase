/**
 * Multi-strategy smoke test.
 * Runs a match with each AI strategy and compares results.
 */

import { runMatch } from './game-loop';
import { STRATEGIES } from './ai-strategies';

const config = {
  p1Name: 'P1',
  p2Name: 'P2',
  bestOfRounds: 3,
  isCpu: false,
  difficulty: 'medium' as const,
  gameMode: 'standard' as const,
};

const strategyNames = ['random', 'heuristic', 'aggressive', 'evasive', 'passive', 'bumper_chaser'];

for (const name of strategyNames) {
  const strategy = STRATEGIES[name];
  const result = runMatch(config, strategy, 0);

  const avgTurns = result.rounds.reduce((s, r) => s + r.turnsSurvived, 0) / result.rounds.length;
  const hiderWins = result.rounds.filter(r => r.winner === 'hider').length;
  const seekerWins = result.rounds.length - hiderWins;

  console.log(`\n${name.toUpperCase()}:`);
  console.log(`  Duration: ${result.durationMs}ms | Frames: ${result.totalFrames}`);
  console.log(`  Rounds: ${result.rounds.length} | Avg turns: ${avgTurns.toFixed(1)}`);
  console.log(`  Hider wins: ${hiderWins} | Seeker wins: ${seekerWins}`);
  console.log(`  Final score: P1=${result.finalP1Score} P2=${result.finalP2Score} | Winner: ${result.winner}`);
}
