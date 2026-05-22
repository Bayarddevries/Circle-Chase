# Circle Chase

A 2-player turn-based physics evasion game. One player hides, the other seeks. Built with React + TypeScript + Vite.

![Game Banner](https://ai.google.dev/static/site-assets/images/share-ais-513315318.png)

## Play

**Local dev server:**
```bash
npm install
npm run dev
# http://localhost:3000
```

**Prerequisites:** Node.js v18+

## How to Play

1. Enter player names and select match length (best of 3/5/7)
2. Each round, one player is the **Hider**, the other is the **Seeker**
3. **Hider goes first** — drag backwards from your ball to aim, release to launch
4. Players alternate turns until the Seeker tags the Hider
5. Hider earns 1 point per turn survived
6. Roles swap each round. Highest total score wins!

### Seeker Advantages
- +50% speed, -15% friction
- Power-up orbs spawn on the map (Laser, Superball, Iron, Sonar)

### Hider Advantages
- Goes first every round
- Fog of War hides you beyond 350px
- Sonar pings leak your position every 3s (double-edged!)

### Sudden Death
Tied after all rounds? Compact map, no fog, first tag wins.

## Tech Stack

- React 19, TypeScript, Vite 6, TailwindCSS 4
- Canvas 2D API (no game engine)
- Custom physics engine with sub-stepping

## Project Structure

```
src/
├── App.tsx               # Game state machine
├── types.ts              # TypeScript types
├── index.css             # Tailwind + custom styles
└── components/
    ├── GameCanvas.tsx    # Physics + rendering
    ├── MainMenu.tsx      # Config form
    ├── MatchOverlay.tsx  # Transition screens
    └── HelpManual.tsx    # Help modal
```

## License

Apache-2.0
