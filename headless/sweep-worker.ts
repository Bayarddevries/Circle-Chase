/**
 * Sweep worker — runs a batch of matches with a constant override.
 * Called by sweep.ts for each value in the sweep range.
 *
 * Usage:
 *   npx tsx headless/sweep-worker.ts --const SEEKER_SPEED_MULT --value 1.2 --matches 30 --strategy heuristic
 */

import * as fs from 'fs';
import { runMatch, MatchResult } from './game-loop';
import { getStrategy } from './ai-strategies';
import { MatchConfig } from './game-state';

function parseArgs() {
  const args = process.argv.slice(2);
  const result: {
    constant: string;
    value: number;
    matches: number;
    strategy: string;
    bestOf: number;
    output: string;
    accuracy: number;
    seekerAccuracy: number | null;
    hiderAccuracy: number | null;
  } = {
    constant: '',
    value: 0,
    matches: 30,
    strategy: 'heuristic',
    bestOf: 3,
    output: 'tools/results/sweep-worker.json',
    accuracy: 0.85,
    seekerAccuracy: null,
    hiderAccuracy: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--const': result.constant = args[++i]; break;
      case '--value': result.value = parseFloat(args[++i]); break;
      case '--matches': result.matches = parseInt(args[++i], 10); break;
      case '--strategy': result.strategy = args[++i]; break;
      case '--best-of': result.bestOf = parseInt(args[++i], 10); break;
      case '--output': result.output = args[++i]; break;
      case '--accuracy': result.accuracy = parseFloat(args[++i]); break;
      case '--seeker-accuracy': result.seekerAccuracy = parseFloat(args[++i]); break;
      case '--hider-accuracy': result.hiderAccuracy = parseFloat(args[++i]); break;
    }
  }

  return result;
}

function buildOverrides(constant: string, value: number): Record<string, number> {
  // Map constant names to the override keys that calculateLaunch understands
  const overrides: Record<string, number> = {};

  if (constant === 'SEEKER_SPEED_MULT') {
    overrides.SEEKER_SPEED_MULT = value;
  } else if (constant === 'HIDER_BASE_SPEED') {
    overrides.HIDER_BASE_SPEED = value;
  } else {
    // Try to use the constant name directly as an override key
    // This won't work for constants that calculateLaunch doesn't accept,
    // but it's a reasonable fallback
    console.error(`  Warning: sweep may not affect "${constant}" — only SEEKER_SPEED_MULT and HIDER_BASE_SPEED are supported for launch physics.`);
    console.error(`  The constant will be noted in the report but results may not differ.`);
  }

  return overrides;
}

function main() {
  const args = parseArgs();
  const strategy = getStrategy(args.strategy);
  const overrides = buildOverrides(args.constant, args.value);

  const config: MatchConfig = {
    p1Name: 'P1',
    p2Name: 'P2',
    bestOfRounds: args.bestOf,
    isCpu: false,
    difficulty: 'medium',
    gameMode: 'standard',
    accuracy: args.accuracy,
    seekerAccuracy: args.seekerAccuracy ?? undefined,
    hiderAccuracy: args.hiderAccuracy ?? undefined,
  };

  console.log(`  Running ${args.matches} matches with ${args.constant}=${args.value}...`);

  const matches: MatchResult[] = [];

  for (let i = 0; i < args.matches; i++) {
    const result = runMatch(config, strategy, i, Object.keys(overrides).length > 0 ? overrides : undefined);
    matches.push(result);
    if ((i + 1) % 10 === 0 || i === args.matches - 1) {
      const pct = ((i + 1) / args.matches * 100).toFixed(0);
      process.stdout.write(`\r  ${pct}% (${i + 1}/${args.matches})`);
    }
  }

  console.log('');

  // Collect stats
  const allRounds = matches.flatMap(m => m.rounds);
  const hiderWins = allRounds.filter(r => r.winner === 'hider').length;
  const totalTurns = allRounds.reduce((s, r) => s + r.turnsSurvived, 0);
  const totalHScore = allRounds.reduce((s, r) => s + r.hiderScore, 0);
  const totalSScore = allRounds.reduce((s, r) => s + r.seekerScore, 0);
  const totalFrames = matches.reduce((s, m) => s + m.totalFrames, 0);
  const noTagRounds = allRounds.filter(r => !r.events.some(e => e.eventType === 'tag_attempt')).length;
  const totalDuration = matches.reduce((s, m) => s + m.durationMs, 0);

  const summary = {
    value: args.value,
    constant: args.constant,
    hiderWinRate: hiderWins / (allRounds.length || 1),
    seekerWinRate: (allRounds.length - hiderWins) / (allRounds.length || 1),
    avgTurns: totalTurns / (allRounds.length || 1),
    avgHiderScore: totalHScore / (allRounds.length || 1),
    avgSeekerScore: totalSScore / (allRounds.length || 1),
    noTagRate: noTagRounds / (allRounds.length || 1),
    totalRounds: allRounds.length,
    totalFrames,
    avgDurationMs: totalDuration / (matches.length || 1),
  };

  console.log(`  Hider win rate: ${(summary.hiderWinRate * 100).toFixed(0)}%`);
  console.log(`  Avg turns: ${summary.avgTurns.toFixed(1)}`);
  console.log(`  Avg score: H=${summary.avgHiderScore.toFixed(0)} S=${summary.avgSeekerScore.toFixed(0)}`);

  // Output JSON for the parent process to parse
  console.log(`SWEEP_RESULT_JSON`);
  console.log(JSON.stringify(summary));
  console.log(`END_SWEEP_RESULT`);

  // Save full match data
  fs.writeFileSync(args.output, JSON.stringify({
    constant: args.constant,
    value: args.value,
    strategy: args.strategy,
    summary,
    matches: matches.map(m => ({
      winner: m.winner,
      finalP1Score: m.finalP1Score,
      finalP2Score: m.finalP2Score,
      rounds: m.rounds.length,
      totalFrames: m.totalFrames,
    })),
  }, null, 2));
}

main();
