/**
 * CLI runner for headless playtesting.
 * 
 * Usage:
 *   npx tsx headless/runner.ts                    # default: 100 matches, all strategies
 *   npx tsx headless/runner.ts --matches 50        # 50 matches per strategy
 *   npx tsx headless/runner.ts --strategy random   # only random strategy
 *   npx tsx headless/runner.ts --output results/   # output directory
 *   npx tsx headless/runner.ts --best-of 5         # best-of-5 matches
 */

import * as fs from 'fs';
import * as path from 'path';
import { runMatch, MatchResult } from './game-loop';
import { STRATEGIES, getStrategy, AIStrategy } from './ai-strategies';
import { generateSummary, formatSummaryMarkdown } from './summary-report';
import { MatchConfig } from './game-state';

interface Args {
  matches: number;
  strategy: string | null;
  output: string;
  bestOf: number;
  p1Name: string;
  p2Name: string;
  sweep: string | null;
  sweepValues: number[];
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = {
    matches: 100,
    strategy: null,
    output: 'tools/results',
    bestOf: 3,
    p1Name: 'P1',
    p2Name: 'P2',
    sweep: null,
    sweepValues: [],
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
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
      case '--p1':
        result.p1Name = args[++i];
        break;
      case '--p2':
        result.p2Name = args[++i];
        break;
      case '--sweep':
        result.sweep = args[++i];
        // Collect all following number arguments as sweep values
        while (i + 1 < args.length && !args[i + 1].startsWith('-') && !isNaN(parseFloat(args[i + 1]))) {
          result.sweepValues.push(parseFloat(args[++i]));
        }
        if (result.sweepValues.length < 2) {
          console.error(`Error: --sweep requires at least 2 numeric values. Got: ${result.sweepValues}`);
          process.exit(1);
        }
        break;
      case '--help':
      case '-h':
        console.log('Turn Tag Headless Playtester');
        console.log('');
        console.log('Options:');
        console.log('  --matches, -n    Matches per strategy (default: 100)');
        console.log('  --strategy, -s   Single strategy to run (default: all)');
        console.log('  --output, -o     Output directory (default: tools/results)');
        console.log('  --best-of, -b    Best-of rounds per match (default: 3)');
        console.log('  --p1             P1 name (default: P1)');
        console.log('  --p2             P2 name (default: P2)');
        console.log('  --help, -h       Show this help');
        console.log('');
        console.log('Available strategies:', Object.keys(STRATEGIES).join(', '));
        process.exit(0);
    }
  }

  return result;
}

function main() {
  const args = parseArgs();

  // Create output directory
  fs.mkdirSync(args.output, { recursive: true });

  // Determine strategies to run
  let strategies: { name: string; strategy: AIStrategy }[];
  if (args.strategy) {
    strategies = [{ name: args.strategy, strategy: getStrategy(args.strategy) }];
  } else {
    strategies = Object.entries(STRATEGIES).map(([name, s]) => ({ name, strategy: s }));
  }

  const config: MatchConfig = {
    p1Name: args.p1Name,
    p2Name: args.p2Name,
    bestOfRounds: args.bestOf,
    isCpu: false,
    difficulty: 'medium',
    gameMode: 'standard',
  };

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║         Turn Tag Headless Playtester             ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Config: best-of-${config.bestOfRounds}, ${config.p1Name} vs ${config.p2Name}`);
  console.log(`Strategies: ${strategies.map(s => s.name).join(', ')}`);
  console.log(`Matches per strategy: ${args.matches}`);
  console.log(`Output: ${args.output}`);
  console.log('');

  const allMatches: MatchResult[] = [];
  const startTime = Date.now();

  for (const { name, strategy } of strategies) {
    console.log(`\nRunning ${args.matches} matches with ${name} strategy...`);
    const strategyMatches: MatchResult[] = [];

    for (let i = 0; i < args.matches; i++) {
      const result = runMatch(config, strategy, i);
      strategyMatches.push(result);
      allMatches.push(result);

      // Progress indicator
      if ((i + 1) % 10 === 0 || i === args.matches - 1) {
        const pct = ((i + 1) / args.matches * 100).toFixed(0);
        process.stdout.write(`\r  ${pct}% (${i + 1}/${args.matches})`);
      }
    }

    console.log('');

    // Save individual match data (thinned: just summary, not full logs)
    const strategyDir = path.join(args.output, name);
    fs.mkdirSync(strategyDir, { recursive: true });

    // Save strategy summary
    const hiderWins = strategyMatches.flatMap(m => m.rounds).filter(r => r.winner === 'hider').length;
    const seekerWins = strategyMatches.flatMap(m => m.rounds).length - hiderWins;
    const avgTurns = strategyMatches.flatMap(m => m.rounds).reduce((s, r) => s + r.turnsSurvived, 0) / (strategyMatches.flatMap(m => m.rounds).length || 1);

    console.log(`  Results: Hider ${hiderWins} wins, Seeker ${seekerWins} wins, Avg ${avgTurns.toFixed(1)} turns/round`);

    // Save full match data for first 5 matches (for detailed analysis)
    for (let i = 0; i < Math.min(5, strategyMatches.length); i++) {
      const matchData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        phase: 'headless_batch',
        config: {
          p1Name: config.p1Name,
          p2Name: config.p2Name,
          bestOfRounds: config.bestOfRounds,
          isCpu: false,
          difficulty: config.difficulty,
          gameMode: config.gameMode,
          strategy: name,
        },
        matchIndex: strategyMatches[i].matchIndex,
        finalP1Score: strategyMatches[i].finalP1Score,
        finalP2Score: strategyMatches[i].finalP2Score,
        winner: strategyMatches[i].winner,
        rounds: strategyMatches[i].rounds.map(r => ({
          roundIndex: r.roundIndex,
          turnsSurvived: r.turnsSurvived,
          hiderScore: r.hiderScore,
          seekerScore: r.seekerScore,
          winner: r.winner,
          isSuddenDeath: r.isSuddenDeath,
          // Include events but not full frame data to keep files manageable
          events: r.events.filter(e => e.type === 'event'),
          frameCount: r.events.filter(e => e.type === 'frame').length,
        })),
        debugLog: strategyMatches[i].events,
      };

      fs.writeFileSync(
        path.join(strategyDir, `match-${i.toString().padStart(4, '0')}.json`),
        JSON.stringify(matchData, null, 2),
      );
    }
    console.log(`  Saved ${Math.min(5, strategyMatches.length)} match files to ${strategyDir}/`);
  }

  // Generate summary report
  const summary = generateSummary(allMatches);
  const reportMd = formatSummaryMarkdown(summary);

  const reportPath = path.join(args.output, `summary-report-${Date.now()}.md`);
  fs.writeFileSync(reportPath, reportMd);
  console.log(`\n📊 Summary report: ${reportPath}`);

  // Also save raw summary data
  const summaryJsonPath = path.join(args.output, `summary-data-${Date.now()}.json`);
  fs.writeFileSync(summaryJsonPath, JSON.stringify(summary, null, 2));
  console.log(`📄 Summary data: ${summaryJsonPath}`);

  const totalTime = Date.now() - startTime;
  console.log(`\n✅ Done! ${allMatches.length} matches in ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`   ${summary.totalFrames.toLocaleString()} total frames simulated`);

  // Print key insights
  console.log('\n── Key Insights ──');
  for (const insight of summary.insights) {
    console.log(`  ${insight}`);
  }
  if (summary.findings.length > 0) {
    console.log('\n── Findings ──');
    for (const finding of summary.findings) {
      console.log(`  ${finding}`);
    }
  }
  if (summary.suggestions.length > 0) {
    console.log('\n── Suggestions ──');
    for (const suggestion of summary.suggestions) {
      console.log(`  ${suggestion}`);
    }
  }
}

main();
