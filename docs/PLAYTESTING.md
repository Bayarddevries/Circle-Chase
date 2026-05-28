# 🎮 Turn Tag — Playtesting System

## Overview

The playtesting system runs AI-vs-AI matches in headless Node.js (no browser needed) and produces balance data. It lives in `headless/` with analysis tools in `tools/`.

```
┌─────────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  1. AI Strategies   │────▶│  2. Game Loop    │────▶│  3. Analysis      │
│  (headless/)        │     │  (headless/)     │     │  (tools/)        │
│                     │     │                  │     │                   │
│ 6 AI play styles    │     │ Deterministic    │     │ Match analysis    │
│ with configurable   │     │ physics sim      │     │ Balance reports   │
│ parameters          │     │ Match orchestration│    │ Parameter sweeps  │
└─────────────────────┘     └──────────────────┘     └───────────────────┘
```

## Pipeline

1. **Runner** (`headless/runner.ts`) — CLI entry point. Runs N matches per strategy, collects results.
2. **Game Loop** (`headless/game-loop.ts`) — Simulates a full match turn-by-turn using the same physics/constants as the real game.
3. **AI Strategies** (`headless/ai-strategies.ts`) — 6 strategies: random, passive, aggressive, evasive, bumper_chaser, heuristic.
4. **Summary Report** (`headless/summary-report.ts`) — Aggregates results into JSON + Markdown.
5. **Sweep** (`headless/sweep.ts`) — Sweeps a constant across values to find balance sweet spots.

## Key Files

| File | Purpose |
|------|---------|
| `headless/runner.ts` | CLI runner — run all strategies |
| `headless/sweep.ts` | Parameter sweep mode |
| `headless/realistic-balance-test.ts` | Pre-configured balance test |
| `headless/smoke-test.ts` | Quick verification (5 matches) |
| `headless/game-loop.ts` | Match simulation engine |
| `headless/game-state.ts` | Match config + state types |
| `headless/ai-strategies.ts` | 6 AI strategy implementations |
| `headless/summary-report.ts` | Aggregate stats + Markdown formatting |
| `tools/analyze_match.py` | Single-match analysis |
| `tools/PLAYTESTING.md` | Methodology + usage docs |

## Match Data Format

Each match produces a JSON file with:
- `MatchConfig` — settings used (best-of, difficulty, etc.)
- Per-round: turns survived, scores, events, tag turn
- Per-frame: ball positions, velocities, collisions
- `strategyOne`, `strategyTwo` — which AIs played

## Balance Metrics

Key metrics tracked per match:
- **Hider win rate** — % of rounds won by hider
- **Average turns survived** — how long hider evades
- **Score differential** — hider vs seeker average scores
- **Quick tag rate** — % of rounds where seeker tags in ≤3 turns

## Design Goals

- Produce **actionable data**: "change X from A to B" not "interesting pattern"
- **Parameter sweep mode**: automatically test a range of values for one constant
- **Anomaly capture**: flag unusual events (negative scores, stuck balls, impossible physics)
- **Balance targets**: define pass/fail criteria (e.g., "hider should win 40-60% of rounds")

See `tools/PLAYTESTING.md` for CLI usage and adding new strategies.
