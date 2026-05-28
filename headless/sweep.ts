/**
 * Parameter sweep runner.
 * Spawns separate processes for each constant value to avoid module caching issues.
 *
 * Usage:
 *   npx tsx headless/sweep.ts --const SEEKER_SPEED_MULT 0.6 0.8 1.0 1.2 1.4 1.6 --matches 30 --strategy heuristic
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as constants from '../src/constants';

const CONSTANTS = constants as Record<string, number>;

interface SweepArgs {
  constant: string;
  values: number[];
  matches: number;
  strategy: string;
  bestOf: number;
  output: string;
  accuracy: number;
  seekerAccuracy: number | null;
  hiderAccuracy: number | null;
}

function parseArgs(): SweepArgs {
  const args = process.argv.slice(2);
  const result: SweepArgs = {
    constant: '',
    values: [],
    matches: 30,
    strategy: 'heuristic',
    output: 'tools/results/sweep',
    bestOf: 3,
    accuracy: 0.85,
    seekerAccuracy: null,
    hiderAccuracy: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--const':
      case '-c':
        result.constant = args[++i];
        while (i + 1 < args.length && !args[i + 1].startsWith('-') && !isNaN(parseFloat(args[i + 1]))) {
          result.values.push(parseFloat(args[++i]));
        }
        break;
      case '--matches':
      case '-n':
        result.matches = parseInt(args[++i], 10);
        break;
      case '--strategy':
      case '-s':
        result.strategy = args[++i];
        break;
      case '--output':
      case '-o':
        result.output = args[++i];
        break;
      case '--best-of':
      case '-b':
        result.bestOf = parseInt(args[++i], 10);
        break;
      case '--accuracy':
      case '-a':
        result.accuracy = parseFloat(args[++i]);
        break;
      case '--seeker-accuracy':
        result.seekerAccuracy = parseFloat(args[++i]);
        break;
      case '--hider-accuracy':
        result.hiderAccuracy = parseFloat(args[++i]);
        break;
      case '--help':
      case '-h':
        console.log('Turn Tag Parameter Sweep');
        console.log('');
        console.log('Usage: npx tsx headless/sweep.ts --const CONST_NAME val1 val2 val3 ... [options]');
        console.log('');
        console.log('Options:');
        console.log('  --const, -c      Constant name + values (required)');
        console.log('  --matches, -n    Matches per value (default: 30)');
        console.log('  --strategy, -s   AI strategy (default: heuristic)');
        console.log('  --best-of, -b    Best-of rounds (default: 3)');
        console.log('  --accuracy, -a   Base accuracy 0-1 (default: 0.85)');
        console.log('  --seeker-accuracy  Seeker accuracy override (simulates fog-of-war handicap)');
        console.log('  --hider-accuracy  Hider accuracy override');
        console.log('  --output, -o     Output directory (default: tools/results/sweep)');
        console.log('  --help, -h       Show this help');
        console.log('');
        console.log('Available constants:');
        Object.keys(CONSTANTS)
          .filter(k => typeof CONSTANTS[k] === 'number')
          .sort()
          .forEach(k => console.log(`  ${k} = ${CONSTANTS[k]}`));
        console.log('');
        console.log('Example:');
        console.log('  npx tsx headless/sweep.ts -c SEEKER_SPEED_MULT 0.6 0.8 1.0 1.2 1.4 -n 50 -s heuristic');
        process.exit(0);
    }
  }

  if (!result.constant) {
    console.error('Error: --const is required. Use --help to see available constants.');
    process.exit(1);
  }
  if (!(result.constant in CONSTANTS)) {
    console.error(`Error: Unknown constant "${result.constant}". Use --help to see available constants.`);
    process.exit(1);
  }
  if (typeof CONSTANTS[result.constant] !== 'number') {
    console.error(`Error: "${result.constant}" is not a numeric constant.`);
    process.exit(1);
  }
  if (result.values.length < 2) {
    console.error(`Error: Need at least 2 values to sweep. Got: ${result.values}`);
    process.exit(1);
  }

  return result;
}

interface SweepRunResult {
  value: number;
  outputFile: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

function runSweepForValue(
  constant: string,
  value: number,
  matches: number,
  strategy: string,
  bestOf: number,
  outputDir: string,
  accuracy: number,
  seekerAccuracy: number | null,
  hiderAccuracy: number | null,
): Promise<SweepRunResult> {
  return new Promise((resolve) => {
    const outputFile = path.join(outputDir, `value-${value}-${Date.now()}.json`);

    // Spawn a separate tsx process with the constant override via env var
    const child = spawn('npx', [
      'tsx', 'headless/sweep-worker.ts',
      '--const', constant,
      '--value', String(value),
      '--matches', String(matches),
      '--strategy', strategy,
      '--best-of', String(bestOf),
      '--output', outputFile,
      '--accuracy', String(accuracy),
      ...(seekerAccuracy !== null ? ['--seeker-accuracy', String(seekerAccuracy)] : []),
      ...(hiderAccuracy !== null ? ['--hider-accuracy', String(hiderAccuracy)] : []),
    ], {
      cwd: process.cwd(),
      env: { ...process.env, SWEEP_VALUE: `${constant}=${value}` },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (exitCode) => {
      resolve({ value, outputFile: outputFile, exitCode: exitCode ?? 0, stdout, stderr });
    });
  });
}

async function runSweep(): Promise<void> {
  const args = parseArgs();
  const baselineValue = CONSTANTS[args.constant];

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║         Turn Tag Parameter Sweep                ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Constant: ${args.constant} (baseline: ${baselineValue})`);
  console.log(`Values:   ${args.values.join(', ')}`);
  console.log(`Matches:  ${args.matches} per value`);
  console.log(`Strategy: ${args.strategy}`);
  console.log(`Output:   ${args.output}`);
  console.log('');

  fs.mkdirSync(args.output, { recursive: true });

  const startTime = Date.now();
  const runResults: SweepRunResult[] = [];

  // Run sequentially to avoid overwhelming the system
  for (const value of args.values) {
    console.log(`\n━━━ ${args.constant} = ${value} ━━━`);
    const result = await runSweepForValue(
      args.constant, value, args.matches, args.strategy, args.bestOf, args.output,
      args.accuracy, args.seekerAccuracy, args.hiderAccuracy,
    );
    runResults.push(result);
  }

  // ── Collect results ──
  console.log('\n\n━━━ Collecting results ━━━');

  const sweepData: {
    constant: string;
    baselineValue: number;
    values: { value: number; hiderWinRate: number; seekerWinRate: number; avgTurns: number; avgHiderScore: number; avgSeekerScore: number; noTagRate: number; totalRounds: number; totalFrames: number; avgDurationMs: number }[];
  } = {
    constant: args.constant,
    baselineValue,
    values: [],
  };

  for (const run of runResults) {
    // Parse the stdout to extract stats
    // The sweep-worker outputs JSON at the end
    const jsonMatch = run.stdout.match(/SWEEP_RESULT_JSON\n([\s\S]+?)\nEND_SWEEP_RESULT/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        sweepData.values.push({ value: run.value, ...data });
      } catch {
        console.error(`  Warning: Could not parse results for value ${run.value}`);
      }
    }
  }

  // ── Generate sweep report ──
  const report = generateSweepReport(sweepData);
  const reportPath = path.join(args.output, `sweep-report-${args.constant}-${Date.now()}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`\n📊 Sweep report: ${reportPath}`);

  const dataPath = path.join(args.output, `sweep-data-${args.constant}-${Date.now()}.json`);
  fs.writeFileSync(dataPath, JSON.stringify(sweepData, null, 2));
  console.log(`📄 Sweep data: ${dataPath}`);

  const totalTime = Date.now() - startTime;
  console.log(`\n✅ Sweep complete! ${(totalTime / 1000).toFixed(1)}s`);
}

function generateSweepReport(data: { constant: string; baselineValue: number; values: { value: number; hiderWinRate: number; seekerWinRate: number; avgTurns: number; avgHiderScore: number; avgSeekerScore: number; noTagRate: number; totalRounds: number; totalFrames: number; avgDurationMs: number }[] }): string {
  const lines: string[] = [];

  lines.push(`# Parameter Sweep: ${data.constant}`);
  lines.push('');
  lines.push(`**Baseline:** ${data.baselineValue} | **Values tested:** ${data.values.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Results table
  lines.push('## Results by Value');
  lines.push('');
  lines.push(`| ${data.constant} | Hider Win% | Seeker Win% | Avg Turns | Avg H Score | Avg S Score | No-Tag% | Frames |`);
  lines.push(`|${'─'.repeat(data.constant.length + 2)}|------------|------------|-----------|-------------|-------------|---------|--------|`);

  for (const v of data.values) {
    const marker = v.value === data.baselineValue ? ' ← baseline' : '';
    lines.push(`| ${v.value}${marker} | ${(v.hiderWinRate * 100).toFixed(0)}% | ${(v.seekerWinRate * 100).toFixed(0)}% | ${v.avgTurns.toFixed(1)} | ${v.avgHiderScore.toFixed(0)} | ${v.avgSeekerScore.toFixed(0)} | ${(v.noTagRate * 100).toFixed(0)}% | ${v.totalFrames.toLocaleString()} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // Trend analysis
  lines.push('## Trend Analysis');
  lines.push('');

  if (data.values.length >= 2) {
    const first = data.values[0];
    const last = data.values[data.values.length - 1];
    const hiderTrend = last.hiderWinRate - first.hiderWinRate;
    const turnsTrend = last.avgTurns - first.avgTurns;

    if (Math.abs(hiderTrend) > 0.05) {
      const direction = hiderTrend > 0 ? 'increases' : 'decreases';
      lines.push(`- As ${data.constant} increases, hider win rate **${direction}** by ${(Math.abs(hiderTrend) * 100).toFixed(0)} percentage points.`);
    } else {
      lines.push(`- As ${data.constant} increases, hider win rate stays relatively stable.`);
    }

    if (Math.abs(turnsTrend) > 2) {
      const direction = turnsTrend > 0 ? 'longer' : 'shorter';
      lines.push(`- As ${data.constant} increases, rounds get **${direction}** by ${Math.abs(turnsTrend).toFixed(1)} turns on average.`);
    } else {
      lines.push(`- As ${data.constant} increases, round length stays relatively stable.`);
    }
  }

  lines.push('');

  // Sweet spot
  lines.push('## Sweet Spot Analysis');
  lines.push('');

  let closestToBalanced = data.values[0];
  let closestDiff = Math.abs(data.values[0].hiderWinRate - 0.5);
  for (const v of data.values) {
    const diff = Math.abs(v.hiderWinRate - 0.5);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestToBalanced = v;
    }
  }

  lines.push(`- **Closest to 50/50 balance:** ${data.constant} = ${closestToBalanced.value}`);
  lines.push(`  - Hider win rate: ${(closestToBalanced.hiderWinRate * 100).toFixed(0)}%`);
  lines.push(`  - Avg turns/round: ${closestToBalanced.avgTurns.toFixed(1)}`);
  lines.push('');

  // Best for ~10 turn rounds
  let bestFun = data.values[0];
  let bestFunDist = Math.abs(data.values[0].avgTurns - 10);
  for (const v of data.values) {
    const dist = Math.abs(v.avgTurns - 10);
    if (dist < bestFunDist) {
      bestFunDist = dist;
      bestFun = v;
    }
  }

  lines.push(`- **Best for ~10-turn average rounds:** ${data.constant} = ${bestFun.value}`);
  lines.push(`  - Avg turns/round: ${bestFun.avgTurns.toFixed(1)}`);
  lines.push(`  - Hider win rate: ${(bestFun.hiderWinRate * 100).toFixed(0)}%`);
  lines.push('');

  // Recommendation
  lines.push('## Recommendation');
  lines.push('');

  if (closestToBalanced.value !== data.baselineValue) {
    const baselineResult = data.values.find(v => v.value === data.baselineValue);
    const baselineHiderRate = baselineResult ? baselineResult.hiderWinRate : 0;
    lines.push(`**Suggested value: ${data.constant} = ${closestToBalanced.value}** (current: ${data.baselineValue})`);
    lines.push('');
    lines.push(`This would shift the hider win rate from ${(baselineHiderRate * 100).toFixed(0)}% to ${(closestToBalanced.hiderWinRate * 100).toFixed(0)}%, closer to the 50/50 target.`);
  } else {
    lines.push(`**Current baseline ${data.constant} = ${data.baselineValue} is already close to optimal.**`);
    lines.push('');
    const baselineHiderRate = data.values.find(v => v.value === data.baselineValue)?.hiderWinRate ?? 0;
    lines.push(`Hider win rate is ${(baselineHiderRate * 100).toFixed(0)}% at baseline.`);
  }

  lines.push('');

  return lines.join('\n');
}

runSweep().catch(console.error);
