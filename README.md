<div align="center">
  <h1>Turn Tag</h1>
  <p><em>Turn-Based Tag 'Em Up</em></p>
</div>

A 2-player turn-based physics evasion game built with React + TypeScript + Vite. Hider vs Seeker on a neon-lit procedurally generated arena. Pass-and-play hotseat.

[![Live on GitHub Pages](https://img.shields.io/badge/GitHub-Pages-9cf?logo=github)](https://bayarddevries.github.io/Circle-Chase/)

## Tech Stack

- React 19 + TypeScript
- Vite 6
- TailwindCSS 4
- HTML5 Canvas (no game engine)
- GitHub Actions for Pages deployment

## Play

### Local Development

```bash
git clone https://github.com/Bayarddevries/Circle-Chase.git
cd Circle-Chase
npm install
npm run dev
# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm run preview  # locally preview built assets
```

### Deploy (GitHub Pages)

Push to `main` triggers deployment via `.github/workflows/pages.yml`. Site lives at:

https://bayarddevries.github.io/Circle-Chase/

## Features

### Core Gameplay
- Slingshot launch physics with sub-stepping (5 steps/frame)
- Procedural maps: bumpers, sand/ice hazards, power-up orbs
- Fog of war shrouds Hider from distant Seeker
- Sudden death tie-breaker (compact map, no fog)
- Best-of-3/5/7 match series
- Colorblind mode (shape overlays)
- CPU opponent with difficulty selector (easy/medium/hard)
- Mobile viewport tuning + touch-safe hit areas
- Leaderboard: global survival scores via Firebase Realtime DB

### Power-Ups (6 types)
| Power-Up | Who | Effect |
|----------|-----|--------|
| **Iron** | Hider | Immune to bumper recoil |
| **Rocket** | Seeker | 3× launch speed on fling |
| **Gravity** | Seeker | Teleports Hider toward Seeker (burst, distance-based) |
| **Vampire** | Seeker | Steal 1 point on tag |
| **Superball** | Either | Enhanced bumper bounces |
| **EMP** | Either | Freeze opponent 1.5s on bumper hit |

### Scoring
- **Hider**: turns survived + bumper hits × 1 + near-miss bonus × 1 + power-up bonus × 2
- **Seeker**: tag base 5 + quick tag bonus 3 (if ≤3 turns) + power-up bonus × 2
- Round winner determined by higher score

### Effects & Polish
- Particle system: sparks, debris, shockwaves (capped at 500)
- Cinematic camera: follow, zoom, screen shake
- Slow-motion freeze on tag
- Neon visual style with solid-edge collision boundaries

## Architecture

See [AGENTS.md](AGENTS.md) for full developer guide: component breakdown, state machine, constants system, deployment troubleshooting, and roadmap.

### Constants

All magic numbers are centralized in `src/constants.ts`. New values should be added here with descriptive names.

### Types

Extended types in `src/types.ts` include `RoundMeta` for per-round statistics and `ScoreBreakdown` for combo scoring.

## Phase Roadmap

- Phase 0 — Constants, RoundMeta, Colorblind, CPU config ✓
- Phase 1 — Refactor GameCanvas into modules ✓
- Phase 1.5 — Text Polish & Rebrand ✓
- Phase 2 — AI Opponent (easy/medium/hard) ✅ working
- Phase 3 — Power-Ups (6 types) ✅ implemented
- Phase 4 — Scoring Combos ✅ calculated, UI display pending
- Phase 5 — Scoring UI (round-over breakdown display) — **pending**
- Phase 6 — Gravity Well continuous pull — **under investigation**
- Phase 7 — Sound effects — **pending**
- Phase 8 — Game Modes (Time Attack, Endless) — **pending**
- Phase 9 — PWA (installable, offline) — **pending**
- Phase 10 — Replay system — **pending**
- Phase 11 — Statistics tracking — **pending**
- Phase 12 — Capacitor/TWA — Android app store wrap — **planned**

## Playtesting

A headless playtesting harness lives in `headless/` with 6 AI strategies for automated balance testing. Analysis tools in `tools/` support match result analysis and parameter sweep. See `tools/PLAYTESTING.md` for methodology.

## Engineering Discipline

- One phase at a time. Complete + deploy before starting next.
- Feature branches: `feature/<description>`.
- Commit after each successful step within a phase.
- If something breaks, revert immediately. Don't compound errors.
- Build must pass before every deploy.
- All constants in `src/constants.ts`. No magic numbers.

## Known Issues

See [CHANGELOG.md](CHANGELOG.md) and `KNOWN_ISSUES.md` for open bugs.

## License

APACHE-2.0 — see LICENSE file.
