# Project Summary — Circle Chase

## What We Built

A 2-player turn-based physics evasion game where one player (the Hider) tries to avoid being tagged by the other (the Seeker) across a neon-lit procedural arena. Built as a local hotseat pass-and-play game — both players share the same screen.

## How It Works

1. Players enter their names and select a best-of series (3/5/7 rounds)
2. Each round, players are assigned roles (Hider/Seeker), alternating each round
3. The Hider flings first using slingshot controls (drag back to aim, release to launch)
4. Players alternate turns until the Seeker tags the Hider
5. The Hider earns points for each turn survived
6. After all rounds, the player with the highest score wins
7. Ties trigger a Sudden Death round on a compact map

## Key Features

- **Canvas-based physics engine** — 5-step sub-stepping per frame, slow-motion on tag
- **Procedural map generation** — Random neon bumpers, sand traps, ice patches, power-up orbs
- **Slingshot controls** — Drag backwards from your ball to aim, release to launch
- **Fog of War** — Hider is hidden beyond 350px from Seeker
- **Sonar pings** — Hider's position leaks every 3 seconds through the fog
- **Power-up system** — Laser Sight, Superball, Iron Ball, Sonar Pulse
- **Sudden Death** — Tie-breaker round on compact map, first tag wins
- **Particle effects** — Sparks, debris, shockwave rings
- **Neon dark theme** — Amber/emerald accents, cinematic glow effects
- **Help manual** — Full operations guide built into the game

## Tech Stack

- React 19, TypeScript, Vite 6, TailwindCSS 4
- Canvas 2D API for rendering
- No external game engine — custom physics
- Gemini API integration (AI Studio capability)

## File Structure

```
Circle-Chase/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # State machine, game phase management
│   ├── types.ts              # TypeScript type definitions
│   ├── index.css             # Tailwind import, custom animations
│   └── components/
│       ├── GameCanvas.tsx    # Canvas game loop, physics, rendering (~1663 lines)
│       ├── MainMenu.tsx      # Player config form
│       ├── MatchOverlay.tsx  # Round/match transition screens
│       └── HelpManual.tsx    # Help manual modal
├── index.html                # HTML entry
├── package.json              # Dependencies, scripts
├── vite.config.ts            # Vite + Tailwind plugin config
├── tsconfig.json             # TypeScript config
├── .env.example              # Environment variable template
├── .gitignore                # Ignore node_modules, dist, .env
├── AGENTS.md                 # Agent operating instructions
├── TASKS.md                  # Task tracker
├── CHANGELOG.md              # Version history
└── PROJECT_SUMMARY.md        # This file
```

## Design Tokens

- `--font-sans: "Inter"` — UI text
- `--font-mono: "JetBrains Mono"` — Monospace (scores, labels)
- Background: `#020502` (near-black)
- Primary accent: Amber (`#d97706` range)
- Secondary accent: Emerald (`#10b981` range)
- Danger/Tag: Rose (`#f43f5e` range)
- Seeker orange: `#ff6600`

## Deployment

```bash
npm run build
git push origin main
```

## Future Ideas

- Touch input for mobile play
- Sound effects and music
- AI opponent mode
- Online multiplayer
- Level editor
- More power-ups
- Tournament bracket mode
