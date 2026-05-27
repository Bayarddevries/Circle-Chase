# 🎮 Turn Tag — Playtesting System

## Overview

The playtesting system allows automated AI-driven playtesting of Turn Tag (Circle Chase)
without requiring agents to visually interpret the game. It consists of three components
that form a pipeline:

```
┌─────────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  1. Debug Overlay   │────▶│  2. Playwright   │────▶│  3. Log Analyzer  │
│  (in-game browser)  │     │  Runner (Python)  │     │  (Python → Markdown)│
│                     │     │                  │     │                   │
│ Structured state    │     │ Simulates matches │     │ Anomaly detection │
│ logging via         │     │ in headless       │     │ Balance analysis  │
│ debugOverlay.ts     │     │ Chromium browser  │     │ Report generation │
└─────────────────────┘     └──────────────────┘     └───────────────────┘
       Game modifies              Runner collects         Analyzer reads
       window.__gameLog           log via JS eval        JSON → Markdown
```

## Architecture

### Component 1: Debug Overlay (`src/game/debugOverlay.ts`)

A zero-overhead logging system embedded in the game. When disabled (default),
it performs no work. When enabled, it captures:

**Frame entries** (logged every render frame):
- Ball positions and velocities (Hider + Seeker)
- Current game phase and turn number
- Active role (whose turn it is)
- Active power-up
- Whether balls are moving
- Round meta (turns survived, bumper hits, power-up collector)

**Event entries** (logged on specific game events):
- `round_start` — New round begins
- `round_end` — Round ends with scores and winner
- `turn_swap` — Turn passes to other player
- `bumper_hit` — Ball hits a bumper (with combo count)
- `tag_attempt` — Seeker attempts to tag Hider
- `powerup_collect` — Power-up orb collected
- `near_miss` — Near-miss event
- `tag_freeze` — Tag freeze frame

**Data bridge**: All entries are stored in `window.__gameLog` for extraction
by the Playwright runner.

**Activation** (two paths):
1. **Manual**: Press `D` in the game to enable + toggle overlay. Shift+D to fully disable.
2. **Automated**: Set `window.__debugRequested = true` before GameCanvas mounts.
   GameCanvas consumes this flag on mount via useEffect. The Playwright runner
   uses this path.

**Drawing**: The debug panel renders directly on the canvas (top-left, 320px wide)
showing recent frames, events, distances, and log size. Only renders when both
enabled AND visible.

### Component 2: Playwright Runner (`tests/playtest/run_matches.py`)

An async Python script using Playwright that runs N matches in a headless Chromium browser.

**Flow per match**:
1. Navigate to game URL
2. Set `window.__debugRequested = true` to enable debug logging
3. Detect menu phase, click START button
4. Loop until `match_over`:
   - `round_intro`: click ENGAGE
   - `playing`: simulate slingshot shot (canvas mouse drag), wait for settle
   - `round_over`: click PROCEED
   - `tag_freeze`: wait for animation
5. Extract `window.__gameLog` via JS evaluation
6. Count events, capture console errors

**Output**: JSON file with per-match data and aggregate summary.

**Configuration** (top of file):
- `DEFAULT_MATCHES = 10`
- `GAME_URL = "http://localhost:5173"` (Vite dev server)
- `TIMEOUT_PHASE = 10` (seconds to wait for phase transition)
- `SHOT_SETTLE_TIME = 1.5` (seconds to wait after each shot)

**Important details**:
- The runner does NOT use keyboard presses to enable debug mode.
  It uses `window.__debugRequested` (JS evaluation) instead.
- `wait_for_balls_stop` polls `window.__gameLog` length to detect physics settle.
  Falls back to fixed delay if no log data is available.
- If START click fails, retries with text-based buttons, then Enter key as fallback.

### Component 3: Playtest Analyzer (`tests/playtest/analyze_py`)

Consumes the JSON output from the runner and produces a structured Markdown report.

**Anomaly detection**:
- **Negative scores** (critical) — hider or seeker score < 0
- **Excessive turns** (warning) — > 50 turns in a round (possible stuck ball)
- **Negative distance** (critical) — tag distance < 0 (collision bug)
- **Excessive combo** (info) — bumper combo > 20
- **Console errors** (critical) — any JavaScript error logged

**Balance analysis**:
- Win rates (Runner vs Chaser)
- Average turns per round
- Min/max turns
- Score averages per role
- Power-up collection counts
- Bumper hits and near misses total
- Balance assessment (Runner-favored / Chaser-favored / Balanced)

**Output sections**:
1. Summary table (matches, rounds, wins, turns)
2. Score analysis
3. Power-up collection
4. Anomalies (grouped by severity: 🔴 Critical, 🟡 Warnings, 🔵 Info)
5. Balance assessment

### Pipeline Script (`tests/playtest/playtest.sh`)

Convenience wrapper that runs both stages:
```bash
./playtest.sh 10                               # 10 matches on localhost:5173
./playtest.sh 5 https://bayarddevries.github.io/Circle-Chase/  # on live site
```

Outputs timestamped files:
- `results/playtest_YYYYMMDD_HHMMSS.json`
- `reports/report_YYYYMMDD_HHMMSS.md`

## Quick Start

### Prerequisites

1. **Run dev server** (in a separate terminal):
   ```bash
   cd /home/bayarddevries/Circle-Chase
   npm run dev
   ```

2. **Install Playwright browser** (one-time):
   ```bash
   cd /home/bayarddevries/Circle-Chase
   source /home/bayarddevries/.hermes/hermes-agent/venv/bin/activate
   playwright install chromium
   ```

### Run a Playtest

```bash
# Run 10 matches (default) against Vite dev server:
cd /home/bayarddevries/Circle-Chase/tests/playtest
./playtest.sh

# Or specify match count:
./playtest.sh 20

# Or run against live site:
./playtest.sh 5 https://bayarddevries.github.io/Circle-Chase/

# Or run individual components:
python run_matches.py --matches 5 --output results/test.json
python analyze.py results/test.json --output reports/test.md
```

### Read the Report

```bash
# View latest report:
cat reports/report_*.md | tail -100

# Or open in VS Code / text editor
```

## How the Debug Flag System Works

This is the most important part to understand. The system uses **two互补 paths**
to enable debug logging, because of a timing challenge:

**The timing problem**: GameCanvas (which has the debug overlay code) only renders
when the game is NOT in `menu` phase. But Playwright needs to enable debug mode
before clicking START. If we use keyboard presses, the keydown event fires before
GameCanvas mounts and is lost.

**Solution — two-path activation**:

```
Path A (manual, in-browser):
  User presses D → GameCanvas's keydown handler catches it → enables debug

Path B (automated, Playwright):
  Runner sets window.__debugRequested = true (via JS evaluation)
      ↓
  App.tsx's global keydown handler also sets it on manual D press
      ↓
  GameCanvas mounts → useEffect reads window.__debugRequested → enables debug
      ↓
  Flag is cleared (set back to false)
```

This means:
- If the runner sets the flag, GameCanvas picks it up on mount and enables logging
- The flag is idempotent — setting it multiple times is harmless
- Normal players are never affected (flag defaults to false)
- The keyboard handler still works for manual toggling during gameplay

## Adding New Event Types

To instrument a new game event for playtesting:

1. Add the event type to `DebugEventEntry['eventType']` in `debugOverlay.ts`
2. Add event logging in `GameCanvas.tsx` at the relevant game logic point:
   ```typescript
   debugLogEvent(debugStateRef.current, 'my_new_event', {
     key1: value1,
     key2: value2,
   });
   ```
3. If needed, add anomaly detection in `analyze.py` `detect_anomalies()`
4. If needed, add balance metrics in `analyze.py` `analyze_balance()`

## Known Issues

- **Slingshot simulation is random**: The runner drags in random directions from
  random start positions. It does NOT aim at the opponent ball. This means matches
  are not "smart" — they test physics and collision correctness, not game balance
  against optimal play. Smart AI playtesting is a future enhancement.

- **No `window.__ballsMoving`**: The runner's `wait_for_balls_stop` was written
  for a `__ballsMoving` global that doesn't exist. It falls back to polling
  `__gameLog` length, which works but is less precise than a direct signal.

- **Match completion depends on UI selectors**: If button text changes (e.g.,
  "START" → "BEGIN"), the runner may fail to start matches. Update selectors in
  `run_one_match()` if UI text changes.

- **Headless canvas rendering**: Chromium's headless mode supports WebGL/Canvas,
  but complex visual effects may render differently than in a visible browser.
  Physics should be identical since it's CPU-based, not GPU-dependent.

## File Reference

| File | Purpose |
|------|---------|
| `src/game/debugOverlay.ts` | Debug state management, frame/event logging, canvas overlay drawing |
| `src/components/GameCanvas.tsx` | Debug event calls at game logic points; keyboard/flag activation |
| `src/App.tsx` | `__gamePhase` exposure; `__debugRequested` global keydown handler |
| `tests/playtest/run_matches.py` | Playwright runner — runs matches, extracts logs |
| `tests/playtest/analyze.py` | Log analyzer — anomaly detection, balance, reports |
| `tests/playtest/playtest.sh` | Pipeline convenience script |
| `tests/playtest/results/` | JSON results output directory |
| `tests/playtest/reports/` | Markdown report output directory |
