/**
 * Realistic balance test — runs matches with role-appropriate behavior.
 * Tests different seeker accuracy levels to simulate human/fog-of-war conditions.
 */

import { runMatch, MatchResult } from './game-loop';
import { getStrategy, AIStrategy } from './ai-strategies';
import { MatchConfig } from './game-state';

/**
 * Uses the 'survive' strategy which branches on activeRole:
 * - Hider: aims away from seeker, uses bumpers as shields
 * - Seeker: aims directly at hider
 */
function stats(matches: MatchResult[]) {
  const allRounds = matches.flatMap(m => m.rounds);
  const hiderWins = allRounds.filter(r => r.winner === 'hider').length;
  const totalTurns = allRounds.reduce((s, r) => s + r.turnsSurvived, 0);
  const totalHScore = allRounds.reduce((s, r) => s + r.hiderScore, 0);
  const totalSScore = allRounds.reduce((s, r) => s + r.seekerScore, 0);
  const noTagRounds = allRounds.filter(r => !r.events.some(e => e.eventType === 'tag_attempt')).length;

  return {
    roundsPlayed: allRounds.length,
    hiderWinRate: hiderWins / (allRounds.length || 1),
    avgTurns: totalTurns / (allRounds.length || 1),
    avgHiderScore: totalHScore / (allRounds.length || 1),
    avgSeekerScore: totalSScore / (allRounds.length || 1),
    noTagRate: noTagRounds / (allRounds.length || 1),
  };
}

function main() {
  console.log('=== Realistic Balance Test ===\n');
  console.log('Strategy: survive (hider evades, seeker chases)\n');

  const baseConfig: MatchConfig = {
    p1Name: 'P1',
    p2Name: 'P2',
    bestOfRounds: 3,
    isCpu: false,
    difficulty: 'medium',
    gameMode: 'standard',
  };

  const strategy = getStrategy('survive');

  // Test 1: Perfect accuracy for both roles
  console.log('━━━ Perfect accuracy (1.0) ━━━');
  const m1: MatchResult[] = [];
  for (let i = 0; i < 30; i++) m1.push(runMatch({ ...baseConfig, accuracy: 1.0 }, strategy, i));
  const s1 = stats(m1);
  console.log(`  Hider win rate: ${(s1.hiderWinRate * 100).toFixed(1)}%`);
  console.log(`  Avg turns: ${s1.avgTurns.toFixed(1)}`);
  console.log(`  Avg score H/S: ${s1.avgHiderScore.toFixed(0)}/${s1.avgSeekerScore.toFixed(0)}`);
  console.log(`  No-tag rate: ${(s1.noTagRate * 100).toFixed(0)}%`);

  // Test 2: Good accuracy (simulates experienced player)
  console.log('\n━━━ Good accuracy (0.85) ━━━');
  const m2: MatchResult[] = [];
  for (let i = 0; i < 30; i++) m2.push(runMatch({ ...baseConfig, accuracy: 0.85 }, strategy, i));
  const s2 = stats(m2);
  console.log(`  Hider win rate: ${(s2.hiderWinRate * 100).toFixed(1)}%`);
  console.log(`  Avg turns: ${s2.avgTurns.toFixed(1)}`);
  console.log(`  Avg score H/S: ${s2.avgHiderScore.toFixed(0)}/${s2.avgSeekerScore.toFixed(0)}`);
  console.log(`  No-tag rate: ${(s2.noTagRate * 100).toFixed(0)}%`);

  // Test 3: Medium accuracy (simulates average player)
  console.log('\n━━━ Medium accuracy (0.6) ━━━');
  const m3: MatchResult[] = [];
  for (let i = 0; i < 30; i++) m3.push(runMatch({ ...baseConfig, accuracy: 0.6 }, strategy, i));
  const s3 = stats(m3);
  console.log(`  Hider win rate: ${(s3.hiderWinRate * 100).toFixed(1)}%`);
  console.log(`  Avg turns: ${s3.avgTurns.toFixed(1)}`);
  console.log(`  Avg score H/S: ${s3.avgHiderScore.toFixed(0)}/${s3.avgSeekerScore.toFixed(0)}`);
  console.log(`  No-tag rate: ${(s3.noTagRate * 100).toFixed(0)}%`);

  // Test 4: Poor seeker accuracy (simulates fog-of-war handicap)
  console.log('\n━━━ Poor seeker accuracy (0.4) ━━━');
  const m4: MatchResult[] = [];
  for (let i = 0; i < 30; i++) m4.push(runMatch({ ...baseConfig, accuracy: 0.4 }, strategy, i));
  const s4 = stats(m4);
  console.log(`  Hider win rate: ${(s4.hiderWinRate * 100).toFixed(1)}%`);
  console.log(`  Avg turns: ${s4.avgTurns.toFixed(1)}`);
  console.log(`  Avg score H/S: ${s4.avgHiderScore.toFixed(0)}/${s4.avgSeekerScore.toFixed(0)}`);
  console.log(`  No-tag rate: ${(s4.noTagRate * 100).toFixed(0)}%`);

  // Test 5: Role-specific accuracy (seeker has fog penalty)
  console.log('\n━━━ Role-specific (hider=0.9, seeker=0.5) ━━━');
  const m5: MatchResult[] = [];
  for (let i = 0; i < 30; i++) {
    m5.push(runMatch({ ...baseConfig, seekerAccuracy: 0.5, hiderAccuracy: 0.9 }, strategy, i));
  }
  const s5 = stats(m5);
  console.log(`  Hider win rate: ${(s5.hiderWinRate * 100).toFixed(1)}%`);
  console.log(`  Avg turns: ${s5.avgTurns.toFixed(1)}`);
  console.log(`  Avg score H/S: ${s5.avgHiderScore.toFixed(0)}/${s5.avgSeekerScore.toFixed(0)}`);
  console.log(`  No-tag rate: ${(s5.noTagRate * 100).toFixed(0)}%`);

  console.log('\n=== Summary ===');
  console.log('Accuracy  | Hider Win% | Avg Turns | No-Tag%');
  console.log('──────────|────────────|───────────|────────');
  console.log(`Perfect   | ${(s1.hiderWinRate * 100).toFixed(1).padStart(7)}%  | ${s1.avgTurns.toFixed(1).padStart(6)}    | ${(s1.noTagRate * 100).toFixed(0).padStart(4)}%`);
  console.log(`Good (0.85)| ${(s2.hiderWinRate * 100).toFixed(1).padStart(7)}%  | ${s2.avgTurns.toFixed(1).padStart(6)}    | ${(s2.noTagRate * 100).toFixed(0).padStart(4)}%`);
  console.log(`Medium    | ${(s3.hiderWinRate * 100).toFixed(1).padStart(7)}%  | ${s3.avgTurns.toFixed(1).padStart(6)}    | ${(s3.noTagRate * 100).toFixed(0).padStart(4)}%`);
  console.log(`Poor      | ${(s4.hiderWinRate * 100).toFixed(1).padStart(7)}%  | ${s4.avgTurns.toFixed(1).padStart(6)}    | ${(s4.noTagRate * 100).toFixed(0).padStart(4)}%`);
  console.log(`Role-spec | ${(s5.hiderWinRate * 100).toFixed(1).padStart(7)}%  | ${s5.avgTurns.toFixed(1).padStart(6)}    | ${(s5.noTagRate * 100).toFixed(0).padStart(4)}%`);
}

main();
