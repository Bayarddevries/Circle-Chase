/**
 * Summary report generator.
 * Takes multiple match results and produces cross-match analysis with insights.
 */

import { MatchResult } from './game-loop';

export interface SummaryReport {
  totalMatches: number;
  totalRounds: number;
  totalFrames: number;
  totalDurationMs: number;
  strategyBreakdown: Record<string, {
    matches: number;
    wins: number;
    losses: number;
    ties: number;
    avgRoundsPerMatch: number;
    avgTurnsPerRound: number;
    hiderWinRate: number;
    seekerWinRate: number;
    avgHiderScore: number;
    avgSeekerScore: number;
    avgMatchDurationMs: number;
  }>;
  overallBalance: {
    hiderWinRate: number;
    seekerWinRate: number;
    avgTurnsPerRound: number;
    avgMatchDurationMs: number;
    mostDominantStrategy: string;
    leastDominantStrategy: string;
  };
  insights: string[];
  findings: string[];
  suggestions: string[];
}

export function generateSummary(matches: MatchResult[]): SummaryReport {
  const strategies = new Map<string, MatchResult[]>();

  for (const m of matches) {
    const existing = strategies.get(m.strategy) || [];
    existing.push(m);
    strategies.set(m.strategy, existing);
  }

  const strategyBreakdown: Record<string, SummaryReport['strategyBreakdown'][string]> = {};

  for (const [name, results] of strategies) {
    let totalWins = 0;
    let totalLosses = 0;
    let totalTies = 0;
    let totalRounds = 0;
    let totalTurns = 0;
    let hiderWins = 0;
    let seekerWins = 0;
    let totalHiderScore = 0;
    let totalSeekerScore = 0;
    let totalDuration = 0;

    for (const r of results) {
      if (r.winner === 'p1' || r.winner === 'p2') {
        // Determine if the "first player" in the strategy won
        totalWins++;
      } else {
        totalTies++;
      }
      totalRounds += r.rounds.length;
      for (const round of r.rounds) {
        totalTurns += round.turnsSurvived;
        if (round.winner === 'hider') hiderWins++;
        else seekerWins++;
        totalHiderScore += round.hiderScore;
        totalSeekerScore += round.seekerScore;
      }
      totalDuration += r.durationMs;
    }

    const totalGames = results.length;
    const totalRoundGames = totalRounds || 1;

    strategyBreakdown[name] = {
      matches: totalGames,
      wins: totalWins,
      losses: totalLosses,
      ties: totalTies,
      avgRoundsPerMatch: totalRounds / totalGames,
      avgTurnsPerRound: totalTurns / totalRoundGames,
      hiderWinRate: hiderWins / totalRoundGames,
      seekerWinRate: seekerWins / totalRoundGames,
      avgHiderScore: totalHiderScore / totalGames,
      avgSeekerScore: totalSeekerScore / totalGames,
      avgMatchDurationMs: totalDuration / totalGames,
    };
  }

  // Overall balance
  const allRounds = matches.flatMap(m => m.rounds);
  const totalHiderWins = allRounds.filter(r => r.winner === 'hider').length;
  const totalSeekerWins = allRounds.length - totalHiderWins;
  const totalAllTurns = allRounds.reduce((s, r) => s + r.turnsSurvived, 0);

  let mostDominant = '';
  let leastDominant = '';
  let bestHiderRate = -1;
  let worstHiderRate = 2;

  for (const [name, breakdown] of Object.entries(strategyBreakdown)) {
    const winRate = Math.max(breakdown.hiderWinRate, breakdown.seekerWinRate);
    if (winRate > bestHiderRate) {
      bestHiderRate = winRate;
      mostDominant = name;
    }
    if (winRate < worstHiderRate) {
      worstHiderRate = winRate;
      leastDominant = name;
    }
  }

  const overallBalance = {
    hiderWinRate: totalHiderWins / (allRounds.length || 1),
    seekerWinRate: totalSeekerWins / (allRounds.length || 1),
    avgTurnsPerRound: totalAllTurns / (allRounds.length || 1),
    avgMatchDurationMs: matches.reduce((s, m) => s + m.durationMs, 0) / (matches.length || 1),
    mostDominantStrategy: mostDominant,
    leastDominantStrategy: leastDominant,
  };

  // ── Generate insights ──
  const insights: string[] = [];
  const findings: string[] = [];
  const suggestions: string[] = [];

  // Balance insight
  if (overallBalance.hiderWinRate > 0.6) {
    insights.push(`Hider wins ${ (overallBalance.hiderWinRate * 100).toFixed(0) }% of rounds — game may favor the hider.`);
  } else if (overallBalance.seekerWinRate > 0.6) {
    insights.push(`Seeker wins ${ (overallBalance.seekerWinRate * 100).toFixed(0) }% of rounds — game may favor the seeker.`);
  } else {
    insights.push(`Balanced win rates — Hider ${ (overallBalance.hiderWinRate * 100).toFixed(0) }% vs Seeker ${ (overallBalance.seekerWinRate * 100).toFixed(0) }%.`);
  }

  // Turn length insight
  if (overallBalance.avgTurnsPerRound < 3) {
    insights.push(`Average round ends in ${ overallBalance.avgTurnsPerRound.toFixed(1) } turns — very fast games.`);
  } else if (overallBalance.avgTurnsPerRound > 20) {
    insights.push(`Average round lasts ${ overallBalance.avgTurnsPerRound.toFixed(0) } turns — long chases.`);
  } else {
    insights.push(`Average round lasts ${ overallBalance.avgTurnsPerRound.toFixed(1) } turns.`);
  }

  // Strategy comparison
  if (strategyBreakdown['heuristic'] && strategyBreakdown['random']) {
    const h = strategyBreakdown['heuristic'];
    const r = strategyBreakdown['random'];
    if (h.seekerWinRate > 0.8 && r.hiderWinRate > 0.8) {
      findings.push('Heuristic AI dominates as seeker but random AI lets hider win — skill gap is large.');
      suggestions.push('Consider adding seeker power-ups or hider evasion tools to balance skilled play.');
    }
  }

  // Passive strategy analysis
  if (strategyBreakdown['passive']) {
    const p = strategyBreakdown['passive'];
    if (p.avgTurnsPerRound > 30) {
      findings.push('Passive strategy leads to very long rounds — low-power shots make tagging difficult.');
      suggestions.push('Minimum shot power or turn timer could prevent stall tactics.');
    }
  }

  // Bumper-chaser analysis
  if (strategyBreakdown['bumper_chaser']) {
    const b = strategyBreakdown['bumper_chaser'];
    if (b.avgHiderScore > 100) {
      findings.push(`Bumper-chaser scores ${ b.avgHiderScore.toFixed(0) } avg points per match — scoring may be too generous with combos.`);
      suggestions.push('Consider capping combo multiplier or reducing bumper hit points.');
    }
  }

  // Speed analysis
  const totalFrames = matches.reduce((s, m) => s + m.totalFrames, 0);
  const totalDuration = matches.reduce((s, m) => s + m.durationMs, 0);
  const avgFps = totalDuration > 0 ? (totalFrames / totalDuration) * 1000 : 0;
  insights.push(`Simulation speed: ${ avgFps.toFixed(0) } frames/sec (${ (totalDuration / 1000).toFixed(1) }s for ${ matches.length } matches).`);

  // Anomaly detection across matches
  const noTagRounds = allRounds.filter(r => {
    const hasTag = r.events.some(e => e.eventType === 'tag_attempt');
    return !hasTag;
  }).length;
  if (noTagRounds > 0) {
    findings.push(`${ noTagRounds } rounds (${ (noTagRounds / allRounds.length * 100).toFixed(0) }%) ended without a tag — reached max-turn limit.`);
  }

  return {
    totalMatches: matches.length,
    totalRounds: allRounds.length,
    totalFrames,
    totalDurationMs: totalDuration,
    strategyBreakdown,
    overallBalance,
    insights,
    findings,
    suggestions,
  };
}

export function formatSummaryMarkdown(report: SummaryReport): string {
  const lines: string[] = [];

  lines.push('# Turn Tag Playtest Summary Report');
  lines.push('');
  lines.push(`**Matches:** ${report.totalMatches} | **Rounds:** ${report.totalRounds} | **Frames:** ${report.totalFrames.toLocaleString()}`);
  lines.push(`**Total simulation time:** ${(report.totalDurationMs / 1000).toFixed(1)}s`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Overall Balance');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Hider win rate | ${(report.overallBalance.hiderWinRate * 100).toFixed(0)}% |`);
  lines.push(`| Seeker win rate | ${(report.overallBalance.seekerWinRate * 100).toFixed(0)}% |`);
  lines.push(`| Avg turns/round | ${report.overallBalance.avgTurnsPerRound.toFixed(1)} |`);
  lines.push(`| Avg match duration | ${report.overallBalance.avgMatchDurationMs.toFixed(0)}ms |`);
  lines.push('');

  if (Object.keys(report.strategyBreakdown).length > 1) {
    lines.push('---');
    lines.push('');
    lines.push('## Strategy Comparison');
    lines.push('');
    lines.push(`| Strategy | Matches | Hider Win% | Seeker Win% | Avg Turns | Avg Score (H/S) |`);
    lines.push(`|----------|---------|-----------|------------|-----------|-----------------|`);
    for (const [name, b] of Object.entries(report.strategyBreakdown)) {
      lines.push(`| ${name} | ${b.matches} | ${(b.hiderWinRate * 100).toFixed(0)}% | ${(b.seekerWinRate * 100).toFixed(0)}% | ${b.avgTurnsPerRound.toFixed(1)} | ${b.avgHiderScore.toFixed(0)} / ${b.avgSeekerScore.toFixed(0)} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## Insights');
  lines.push('');
  for (const insight of report.insights) {
    lines.push(`- ${insight}`);
  }
  lines.push('');

  if (report.findings.length > 0) {
    lines.push('## Findings');
    lines.push('');
    for (const finding of report.findings) {
      lines.push(`- 🔍 ${finding}`);
    }
    lines.push('');
  }

  if (report.suggestions.length > 0) {
    lines.push('## Suggestions');
    lines.push('');
    for (const suggestion of report.suggestions) {
      lines.push(`- 💡 ${suggestion}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Per-strategy detail
  for (const [name, b] of Object.entries(report.strategyBreakdown)) {
    lines.push(`## ${name.toUpperCase()} Strategy Detail`);
    lines.push('');
    lines.push(`- Matches: ${b.matches}`);
    lines.push(`- Avg rounds/match: ${b.avgRoundsPerMatch.toFixed(1)}`);
    lines.push(`- Avg turns/round: ${b.avgTurnsPerRound.toFixed(1)}`);
    lines.push(`- Hider win rate: ${(b.hiderWinRate * 100).toFixed(0)}%`);
    lines.push(`- Avg hider score: ${b.avgHiderScore.toFixed(0)}`);
    lines.push(`- Avg seeker score: ${b.avgSeekerScore.toFixed(0)}`);
    lines.push(`- Avg duration: ${b.avgMatchDurationMs.toFixed(0)}ms`);
    lines.push('');
  }

  return lines.join('\n');
}
