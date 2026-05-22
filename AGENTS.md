# AGENTS.md — Circle Chase

## Project Overview

**Circle Chase** is a 2-player turn-based physics evasion game built with React + TypeScript + Vite. One player is the Hider, the other is the Seeker. The Hider tries to survive as long as possible; the Seeker tries to tag them. Built as a local hotseat pass-and-play game.

**Repository:** https://github.com/Bayarddevries/Circle-Chase

**Tech Stack:** React 19, TypeScript, Vite 6, TailwindCSS 4, Canvas API

**Design Philosophy:** "Neon Night Golf Chase" — high-contrast dark theme with amber/emerald neon accents, cinematic physics, procedural map generation

---

## Architecture

### Game Flow

```
menu → round_intro → playing → round_over → (next round or match_over)
                                    ↓
                              sudden_death_intro → playing → match_over
```

1. **MainMenu** — Player name input, best-of selector (3/5/7), help button
2. **Round Intro** — Role assignment display (who's Hider/Seeker this round), "ENGAGE" button
3. **Playing** — Canvas-based physics game loop. Players alternate turns (Hider first). Slingshot controls (drag back to aim, release to launch). Round ends when Seeker tags Hider.
4. **Round Over** — Shows turns survived, score update, leaderboard. "PROCEED" button.
5. **Match Over** — Champion declaration, round history log, replay/menu buttons.
6. **Sudden Death** — Tie-breaker round on compact map, no fog of war, first tag wins.

### Component Tree

```
App.tsx (state machine)
├── MainMenu.tsx          — Config form, name inputs, best-of selector, Shop/Leaderboard/Profile buttons
├── GameCanvas.tsx        — Canvas rendering, physics engine, input handling
│   ├── Procedural map generation (bumpers, hazards, power-up orb)
│   ├── Physics sub-stepping (5 steps/frame)
│   ├── Slingshot drag controls
│   ├── Particle system (sparks, debris, shockwaves) — capped at 500
│   ├── Sonar ping system (Hider position leak)
│   ├── Power-up system (laser, superball, iron, sonar)
│   ├── DPI-aware canvas scaling
│   └── Touch-safe input handlers
├── MatchOverlay.tsx      — Round intro, round over, match over, sudden death screens
├── HelpManual.tsx        — Operations manual modal
├── ShopModal.tsx         — Purchase ball skins, trails, themes, backgrounds
├── LeaderboardModal.tsx  — Top-10 survival leaderboard
└── ProfileModal.tsx      — Badges and lifetime stats display
```

### Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | State machine, game phase management, score tracking, meta-progression |
| `src/types.ts` | TypeScript types (PlayerRole, GamePhase, PlayerBall, MetaState, etc.) |
| `src/constants.ts` | All game constants (physics, camera, rendering, AI, progression) — single source of truth |
| `src/components/GameCanvas.tsx` | Canvas game loop, physics, rendering, input (~1750 lines; refactor planned) |
| `src/components/MainMenu.tsx` | Player config form, shop/leaderboard/profile buttons |
| `src/components/MatchOverlay.tsx` | Round/match transition screens with meta-progression display |
| `src/components/HelpManual.tsx` | Help modal |
| `src/components/ShopModal.tsx` | Shop UI for purchasing unlocks with credits |
| `src/components/LeaderboardModal.tsx` | Leaderboard modal |
| `src/components/ProfileModal.tsx` | Badges and stats modal |
| `src/hooks/useMetaProgression.ts` | Credits, unlocks, leaderboard, badges (localStorage persistence) |
| `src/index.css` | Tailwind import, custom animations, scrollbar |
| `vite.config.ts` | Vite config with Tailwind plugin |
| `tsconfig.json` | TypeScript config (ES2022, bundler resolution) |

### Physics System

- **Sub-stepping:** 5 physics steps per frame for accuracy
- **Slow-motion:** `slowMotionRef` scales velocity during tag events (value < 1.0)
- **Boundary restitution:** 0.65 normal, 0.93 during slow-mo explosion
- **Bumper restitution:** 1.4x base, 3.0x with Superball power-up
- **Hazards:** Sand patches (extra 8% friction/frame), Ice patches (1% friction/frame)
- **Fog of War:** Hider hidden beyond 350px from Seeker (unless Sonar Pulse active)

### Power-Up System

Single-use orbs spawn in the middle zone. Seeker picks them up by collision:

| Power-Up | Effect |
|----------|--------|
| Laser Sight | 2.5x slingshot trajectory preview |
| Superball | 2x bumper/wall bounce intensity |
| Iron Ball | Ignores sand friction |
| Sonar Pulse | Reveals Hider position, removes fog |

**Note:** Power-up balance needs tuning (CC-007). Laser should increase speed. New power-ups planned: Cloak (Hider invisible 3s), Magnet (Seeker pulls Hider).

### Meta-Progression

- **Credits ("Cybernetic Credits"):** earned per round (turns survived × 1.5 if power-up collected)
- **Unskins, trail colors, bumper themes, map backgrounds**: purchasable with credits
- **Leaderboard:** top-10 survival turns (localStorage)
- **Badges:** Sand Dodger, Bounce Master, Quick Tag, First Round, Century Runner, Power Hungry
- **Persistence:** localStorage for all meta state

### Scoring

- Hider earns 1 point per turn survived
- Roles alternate each round (P1 Hider on even rounds)
- Best-of series (3/5/7 rounds)
- Tie after all rounds → Sudden Death (first tag wins)

### Controls

- **Slingshot:** Click/touch and drag backwards from your ball to aim, release to launch
- **Turn alternation:** Hider always goes first each round
- **Turn end:** Next turn starts only when BOTH balls have stopped moving
- **Touch:** `preventDefault()` on all touch handlers prevents mobile scroll

### Performance

- **DPI scaling:** Canvas multiplied by `devicePixelRatio`, context scaled
- **ShadowBlur:** Only large spark particles get shadowBlur (6px); debris/glass render flat
- **Particle cap:** Hard limit of 500 particles; oldest culled
- **Constants:** All magic numbers centralized in `src/constants.ts` for easy tuning

---

## Roadmap

### v1.3 (Next Sprint)
- AI Opponent (Seeker) with 3 difficulty levels
- Power-up balance rework (Laser speed buff, Iron ice immunity)
- New power-ups: Cloak, Magnet
- Orb respawn timer (10s)
- Fog of war rework (directional cone, sonar cooldown)
- Minimap in HUD

### v1.4
- Colorblind mode (shape overlays, palette toggle)
- Hazard icons (⨳ sand, ❄️ ice)
- Typo fix ("Collogation" → "Collection")
- Title branding consistency
- Power-up placement bias (spawn within view)

### v2.0
- Game mode variants (Time Attack, Endless)
- Map template system
- Audio (Web Audio API)
- Replay system
- PWA support (vite-plugin-pwa)
- ARIA live regions for accessibility
- GameCanvas module split (physics, renderer, input, map, particles, camera)
- Online multiplayer (WebRTC)
- Android app store (Capacitor/TWA wrapper)

---

## Development

### Prerequisites
- Node.js (v18+)
- Gemini API key (for AI Studio features)

### Setup
```bash
cd /home/bayarddevries/Circle-Chase
npm install
cp .env.example .env.local  # Add GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

### Build
```bash
npm run build    # Output: dist/
npm run preview  # Preview production build
```

### Deploy
```bash
git add .
git commit -m "message"
git push origin main
```

---

## Engineering Discipline (from Karpathy's CLAUDE.md)

Bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that *your* changes made unused.
- Don't remove pre-existing dead code unless asked.

**Test:** Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Context

### Related Projects
- **Hide & Fling** — 2-player physics tag game (predecessor/inspiration)
- **Air Hockey** — 2-player physics game
- **Buffalo Counter** — Scroll-driven data visualization
- **RRMNHC Website** — Métis heritage static site

### User Background
- Bayard deVries, Linux (Pop!_OS), local models
- Prefers direct, no-nonsense communication
- Values correctness and concise documentation

### Tech Environment
- Linux (Pop!_OS), 8GB RAM, GTX 1070 8GB (CPU-only for local models)
- GitHub org: Bayarddevries
- Local path: `/home/bayarddevries/Circle-Chase`
