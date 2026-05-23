# Project Summary — Chase Tag

## What We Built

A 2-player turn-based physics evasion game where one player (the Runner) tries to avoid being tagged by the other (the Chaser) across a neon-lit procedural arena. Built as a local hotseat pass-and-play game.

## How It Works

1. Players enter their names and select number of rounds
2. Each round, players are assigned roles (Runner/Chaser), alternating each round
3. The Runner goes first using slingshot controls (drag back to aim, release to launch)
4. Players alternate turns until the Chaser tags the Runner
5. The Runner earns 1 point per turn survived
6. After all rounds, highest score wins
7. Ties trigger Sudden Death on a compact map

## Key Features

- **Canvas-based physics engine** — Sub-stepping per frame, slow-motion on tag
- **Procedural map generation** — Neon bumpers, sand traps, ice patches, power-up orbs
- **Slingshot controls** — Drag backwards from your ball to aim, release to launch
- **Fog of War** — Runner hidden beyond 350px from Chaser
- **Sonar pings** — Runner position leaks every 3 seconds
- **Power-up system** — Laser Sight, Superball, Iron Ball, Sonar Pulse
- **Sudden Death** — Tie-breaker round on compact map, first tag wins
- **Particle effects** — Sparks, debris, shockwave rings
- **Meta-progression** — Credits, unlocks, leaderboard, badges (localStorage)
- **DPI-aware canvas** — Crisp on retina displays
- **Touch-safe input** — preventDefault on all touch handlers
- **Constants system** — All game values centralized in constants.ts

## Live Demo

**URL:** https://bayarddevries.github.io/Chase-Tag/

**Local dev:** `npm run dev` → http://localhost:3000

## Tech Stack

- React 19, TypeScript, Vite 6, TailwindCSS 4
- Canvas 2D API for rendering
- No external game engine — custom physics
- GitHub Actions CI/CD → GitHub Pages

## File Structure

```
Chase-Tag/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # State machine, game phase management
│   ├── types.ts              # TypeScript type definitions
│   ├── constants.ts          # All game constants (physics, camera, rendering)
│   ├── index.css             # Tailwind import, custom animations
│   └── components/
│       ├── GameCanvas.tsx    # Canvas game loop, physics, rendering (~2000 lines)
│       ├── MainMenu.tsx      # Player config form
│       ├── MatchOverlay.tsx  # Round/match transition screens
│       ├── HelpManual.tsx    # How to Play modal
│       ├── ShopModal.tsx     # Purchase unlocks with credits
│       ├── LeaderboardModal.tsx  # Top-10 survival leaderboard
│       └── ProfileModal.tsx  # Badges and stats
│   └── hooks/
│       └── useMetaProgression.ts  # Credits, unlocks, leaderboard, badges
├── .github/workflows/pages.yml   # GitHub Actions deploy
├── index.html                # HTML entry
├── package.json              # Dependencies, scripts
├── vite.config.ts            # Vite + Tailwind plugin config
├── tsconfig.json             # TypeScript config
├── AGENTS.md                 # Agent operating instructions
├── TASKS.md                  # Task tracker
├── CHANGELOG.md              # Version history
├── ISSUES.md                 # Issue tracker
└── PROJECT_SUMMARY.md        # This file
```

## Design Tokens

- Background: `#020502` (near-black)
- Primary accent: Amber (`#d97706`)
- Secondary accent: Emerald (`#10b981`)
- Runner: White/cyan
- Chaser: Orange (`#ff6600`)

## Known Issues

- Game is unplayable on mobile (touch controls, viewport, layout)
- No AI opponent yet
- Power-up balance needs tuning
- No sound effects
- GameCanvas.tsx is ~2000 lines (needs modularization)

## Roadmap

### v1.3 (Next)
- Fix mobile playability
- AI Opponent with difficulty levels
- Power-up balance rework + new power-ups (Cloak, Magnet)
- Minimap in HUD

### v1.4
- Colorblind mode
- Consistent colour scheme pass
- Improved power-up/ball/hazard visuals

### v2.0
- PWA support
- Online multiplayer
- Android app store
- Audio
- Game mode variants
