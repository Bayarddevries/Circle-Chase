# Turn Tag Playtesting Tools

## Headless Harness

The `headless/` directory contains a Node.js playtesting framework that runs AI-vs-AI matches and collects balance data.

### Quick Start

```bash
# Run 100 matches with all 6 AI strategies
npx tsx headless/runner.ts

# Run 50 matches with a specific strategy
npx tsx headless/runner.ts --matches 50 --strategy evasive

# Run a parameter sweep (e.g. SEEKER_SPEED_MULT)
npx tsx headless/runner.ts --sweep SEEKER_SPEED_MULT --sweep-values 0.5,1.0,1.5,2.0

# Custom output directory
npx tsx headless/runner.ts --output tools/results/my-test/
```

### AI Strategies (6 total)

| Strategy | Behavior |
|----------|----------|
| `random` | Random aim direction/power |
| `passive` | Aims directly at Hider, no prediction |
| `aggressive` | Aims at Hider + leads the shot |
| `evasive` | Hider flees, Seeker chases with prediction |
| `bumper_chaser` | Uses bumpers to bounce toward Hider |
| `heuristic` | Adaptive: switches based on distance and obstacles |

### Output

Each run produces:
- Per-match JSON files with full event logs
- `summary-data-<timestamp>.json` — aggregate stats
- `summary-report-<timestamp>.markdown` — human-readable report

### Smoke Test

```bash
npx tsx headless/smoke-test.ts
```

Runs 5 matches (1 per strategy) and prints a summary. Good for quick verification.

### Balance Test

```bash
npx tsx headless/realistic-balance-test.ts
```

Runs matches with varied difficulty settings and collects win-rate data.

### Sweep Mode

```bash
npx tsx headless/sweep.ts --constant SEEKER_SPEED_MULT --values 0.5,0.75,1,1.25,1.5,1.75,2
```

Sweeps a constant across values, producing per-value result sets for comparison.

## Manual Testing

### Local Play

```bash
npm run dev
# Open http://localhost:3000
```

### Production Play

https://bayarddevries.github.io/Circle-Chase/

## Analysis Tools

### analyze_match.py

Analyze a single match export:

```bash
python3 tools/analyze_match.py tools/results/<strategy>/match-0000.json
```

## Adding a New AI Strategy

1. Define the strategy in `headless/ai-strategies.ts`:
   ```typescript
   export const myStrategy: AIStrategy = {
     name: 'my_strategy',
     description: 'Brief description',
     hider: (state, config) => { /* return { angle, power } */ },
     seeker: (state, config) => { /* return { angle, power } */ },
   };
   ```
2. Add it to the `STRATEGIES` array.
3. Test: `npx tsx headless/smoke-test.ts --strategy my_strategy`
