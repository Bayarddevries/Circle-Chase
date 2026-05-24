<div align="center">
  <img width="1200" height="475" alt="Circle Chase Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Circle Chase

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

Push to `main` triggers automatic deployment via `.github/workflows/pages.yml`. Site lives at:

https://bayarddevries.github.io/Circle-Chase/

## Features (Post-Phase 0)

- Slingshot launch physics with sub-stepping
- Procedural maps: bumpers, sand/ice hazards, power-up orb
- Fog of war shrouds Hider from distant Seeker
- Sonar power-up reveals Hider location in pulses
- Four power-ups: Laser, Superball, Iron, Sonar
- Particle effects: sparks, debris, shockwaves
- Cinematic camera: follow, zoom, screen shake
- Slow motion freeze on tag
- Sudden death tie-breaker (compact map, no fog)
- Colorblind mode (shape overlays)
- CPU opponent with difficulty selector (config only; AI logic pending)
- Mobile viewport tuning + touch-safe hit areas

## Architecture

See [AGENTS.md](AGENTS.md) for full developer guide: component breakdown, state machine, constants system, deployment troubleshooting, and roadmap.

### Constants

All magic numbers are centralized in `src/constants.ts`. New values should be added here with descriptive names.

### Types

Extended types in `src/types.ts` include `RoundMeta` for per-round statistics and `ScoreBreakdown` for upcoming combo scoring.

## Phase Roadmap

- Phase 0 — Constants, RoundMeta, Colorblind, CPU config ✓
- Phase 1 — Refactor GameCanvas into modular hooks (next)
- Phase 2 — Implement AI opponent logic
- Phase 3 — Restore Cloak + Magnet, orb respawn, directional fog
- Phase 4 — Map template system
- Phase 5 — Scoring combos
- Phase 6 — Time Attack + Endless modes
- Phase 7 — PWA (offline + installable)
- Phase 8 — Replay system
- Phase 9 — Sound effects
- Phase 10 — Meta-progression (optional)

See `docs/PLAN-OF-ATTACK.md` for full breakdown.

## Engineering Discipline

This project follows Karpathy's principles: single source of truth, explicitness over magic, bugs as learning opportunities, iterative refinement, and clear communication via commit messages.

## License

APACHE-2.0 — see LICENSE file.
