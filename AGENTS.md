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

1. **MainMenu** — Player name input, best-of selector (3/5/7), colorblind mode toggle, CPU opponent toggle with difficulty (easy/medium/hard), help button
2. **Round Intro** — Role assignment display (who's Hider/Seeker this round), "ENGAGE" button
3. **Playing** — Canvas-based physics game loop. Players alternate turns (Hider first). Slingshot controls (drag back to aim, release to launch). Round ends when Seeker tags Hider.
4. **Round Over** — Shows turns survived, score update. "PROCEED" button.
5. **Match Over** — Champion declaration, round history log, replay/menu buttons.
6. **Sudden Death** — Tie-breaker round on compact map, no fog of war, first tag wins.

### Component Tree

```
App.tsx (state machine)
├── MainMenu.tsx          — Config form, name inputs, best-of selector, colorblind/CPU options
├── GameCanvas.tsx        — Canvas rendering, physics engine, input handling
│   ├── Procedural map generation (bumpers, hazards, power-up orb)
│   ├── Physics sub-stepping (5 steps/frame)
│   ├── Slingshot drag controls
│   ├── Particle system (sparks, debris, shockwaves) — capped at 500
│   ├── Sonar ping system (Hider position leak)
│   ├── Power-up system (laser, superball, iron, sonar) — cloak & magnet planned
│   ├── DPI-aware canvas scaling
│   ├── Colorblind mode overlays (square for Hider, triangle for Seeker)
│   ├── Camera shake & slow-motion effects
│   └── RoundMeta tracking for scoring combos (turnsSurvived, bumperHits, etc.)
├── MatchOverlay.tsx      — Round intro, round over, match over, sudden death screens
└── HelpManual.tsx        — Operations manual modal

```

### State Machine (App.tsx)

| Phase | Trigger | Next |
|-------|---------|------|
| `menu` | user fills form + clicks START | `round_intro` |
| `round_intro` | clicks ENGAGE | `playing` |
| `playing` | Seeker tags Hider | `tag_freeze` → `round_over` |
| `round_over` | PROCEED (more rounds) | `round_intro` |
| `round_over` | PROCEED (match end) | `match_over` |
| `match_over` | PLAY AGAIN | `round_intro` |
| `match_over` | EXIT | `menu` |
| `playing` (sudden death) | Seeker tags Hider | `tag_freeze` → `match_over` |

---

## Current Feature Set (Post-Phase 0)

### Core Working
- Slingshot physics with sub-stepping
- Bumper collisions with varying restitution and boost
- Sand & ice hazard patches (friction modifiers)
- Fog of war (shrouds Hider from Seeker at distance)
- Sonar power-up reveals Hider position periodically
- Power-ups: Laser, Superball, Iron, Sonar
- Particle system (sparks, debris, shockwaves)
- Cinematic camera: tracking, zoom, shake
- Slow-motion freeze on tag
- Sudden death mode on tied matches (compact map, no fog)
- Colorblind mode (shape overlays on balls)
- CPU opponent (easy/medium/hard)
- Mobile viewport meta tags + touch safe hit areas
 - Leaderboard: global survival scores via Firebase Realtime DB (REST + client-side sorting)

### Removed / On Hold
 - Shop and badges (removed in commit 05e4f93); leaderboard restored for survival mode via Firebase Realtime DB.
- Orb respawn (power-up orb currently spawns once and stays)
- Directional fog (shroud always radial)
- Cloak & Magnet power-ups (tokens defined but logic removed)
- Map template system
- Game modes (Time Attack, Endless)
- Scoring combos (RoundMeta tracking in place, calculations pending)
- Replay system
- Sound effects
- PWA manifest

---

## Code Structure & Conventions

### Constants
All magic numbers are centralized in `src/constants.ts`. Before editing any value, search the file to see if it already exists. If not, add a new constant with a clear comment grouping (Physics, Camera, Slingshot, etc.).

### Types
Extended types in `src/types.ts`:
- `PowerUpType`: 'laser' \| 'superball' \| 'iron' \| 'sonar' \| 'cloak' \| 'magnet'
- `AIDifficulty`: 'easy' \| 'medium' \| 'hard'
- `RoundMeta`: { turnsSurvived, powerUpCollected, bumperHits, tagTurn }
- `ScoreBreakdown`: breakdown of scoring components
- `MatchConfig`: includes isCpu?, difficulty?, colorblindMode?

### RoundMeta Tracking
GameCanvas maintains mutable refs to track per-round stats:
- `roundMetaRef`: accumulated stats during a round
- `currentTurnNumberRef`: turn counter for quick-tag detection
- `totalDistanceRef` + `distanceSamplesRef`: for average distance
- `minDistanceRef`: closest approach in current seeker turn
- `comboCountRef`: consecutive bumper hits
- `nearMissTriggeredRef`: for near-miss bonus (once per round)

These are cleared at round start and used when the round over screen appears (see Phase 5: scoring combos).

---

## Deployment

### Production (main branch)
**URL:** https://bayarddevries.github.io/Circle-Chase/

- Push to `main` → GitHub Actions builds → deploys via `deploy-pages` artifact API to GitHub Pages
- Workflow: `.github/workflows/pages.yml`
- Build: `GITHUB_PAGES=true npm run build`
- vite.config.ts: `base: '/Circle-Chase/'` when `GITHUB_PAGES=true`
- **Never push unverified changes to main.** It's the live game.

### Branch Previews (feature branches)
**URL pattern:** https://bayarddevries.github.io/Circle-Chase/preview/<branch-name>/

- Push any `feature/*` branch → GitHub Actions builds → deploys to `gh-pages/preview/<branch-name>/`
- Build uses `BASE_PATH=/Circle-Chase/preview/<branch-name>/` so assets resolve correctly
- No external services needed — all on GitHub
- Preview directories on gh-pages are never cleaned up automatically; old ones can be manually deleted if needed

### Local Development
```bash
npm install
npm run dev   # http://localhost:3000
npm run build # outputs to dist/
```

No environment variables needed for local dev. Preview builds locally with:
```bash
GITHUB_PAGES=true npm run build   # production build
BASE_PATH=/Circle-Chase/preview/my-feature/ npm run build   # preview build
```

### Troubleshooting
- If live site serves old content: trigger a redeploy by pushing to main
- `gh-pages` branch is the source of truth for GitHub Pages (branch-based deployment)
- Production files go to root of gh-pages; previews go to `/preview/<branch>/`
- Never manually edit the `gh-pages` branch — let Actions handle it

---

## Phase Roadmap

### Phase 0 ✓ (Complete)
- Constants file established
- Type extensions (RoundMeta, ScoreBreakdown, AIDifficulty)
- Colorblind mode UI + rendering
- CPU opponent + difficulty selector in MainMenu
- All magic numbers replaced with constants

### Phase 1 — Refactor GameCanvas ✓ (Complete)
Break the 1900+ line monolith into focused modules. Pure refactor, NO behavior changes.

**All 11 modules extracted:**
- `src/game/particles.ts`, `camera.ts`, `sonar.ts`, `input.ts`, `trails.ts`, `fog.ts`, `map.ts`, `minimap.ts`, `powerups.ts`, `renderer.ts`, `physics.ts`

**Progress:** GameCanvas 1951 → 981 lines (-970). All modules extracted, build passes, deployed, verified.

### Phase 1.5 — Text Polish & Rebrand ✓ (Complete)
Marketing report identified "Chase Tag" as best name, but team preferring "Turn Tag". Text polish campaign executed:

- **Branding**: Title "Turn Tag", tagline "Turn-Based Tag 'Em Up"
- **File**: `docs/TEXT-POLISH.md` (planned changes before implementation)
- **Implementation covers 4 UI components**: MainMenu, MatchOverlay, GameCanvas (HUD), HelpManual
- **50+ string updates**: User-facing text simplified (eliminated jargon)
- **4 bug fixes** during polish:
  1. Removed "The" from tagline → "Turn-Based Tag 'Em Up"
  2. Added name entry prompt below "MATCH SETUP" header
  3. Fixed bottom content cutoff → `overflow-y-auto` on layout container
  4. Fog freeze during slow-motion → added `!tagFrozenRef.current` check
- **Verification**: Browser snapshots via Vite dev server (http://100.108.183.33:8083/)
- **Deploy**: GitHub Actions auto-deployed commit `86ae6a3` to production
- **Status**: Live at https://bayarddevries.github.io/Circle-Chase/

### Phase 1.6 — Audio Design Plan ✓ (Complete)
Researched in-house audio generation options. Decided on procedural Web Audio API synthesis (zero external files).

**Deliverable**: `docs/SOUND-PLAN.md` contains full spec
- **Architecture**: Procedural synth, no npm packages, works offline
- **15 sound effects**: whoosh, bumper clang, wall thud, tag explosion, sonar ping, power-up collect/activate, sand/ice enter, cloak, magnet, sudden death sting, round start, match win, UI click/hover
- **Dynamic music**: Looping ambient pad + bass + arp, tempo shifts with tension
- **Technical validation**: Tested FluidSynth + `midiutil` pipeline successfully (5 sounds generated: menu theme, round intro, tag hit, victory fanfare, countdown)

**Next**: Implement after mobile UI finalized

### Phase 2 — AI Opponent (NEXT)
- `src/game/particles.ts` (283 lines) — updateParticles, drawParticles, spawnTag/Bumper/Orb/Launch ✓
- `src/game/camera.ts` (47 lines) — updateCamera, applyCameraTransform, restoreCameraTransform ✓
- `src/game/sonar.ts` (76 lines) — updateSonarPings, maybeSpawnSonarPing, drawSonarPings ✓
- `src/game/input.ts` (65 lines) — screenToMap, calculateLaunch ✓
- `src/game/trails.ts` (61 lines) — updateTrail, drawTrail ✓
- `src/game/fog.ts` (39 lines) — drawFogOfWar ✓
- `src/game/map.ts` — procedural generation (pending)
- `src/game/minimap.ts` — minimap HUD (pending)
- `src/game/powerups.ts` — orb collection, pulse, drawing (pending)
- `src/game/renderer.ts` — ball/bumper/hazard drawing (pending, largest)
- `src/game/physics.ts` — substepping, collisions, friction (pending, do last)

**Progress:** GameCanvas 1951 → 1636 lines (-315). 6/11 modules done.
**Gate: GameCanvas ~200 lines, build passes, deploy, verify.**

### Phase 2 — AI Opponent
Implement the actual AI behavior using the existing config:
- AI aims at Hider + error margin based on difficulty
- AI delay (think time) before firing
- AI selects launch direction/power
- AI respects power-ups (e.g., uses laser if available)

### Phase 3 — Restore Lost Powers
Add back Cloak and Magnet:
- Cloak: Hider becomes invisible to Seeker canvas rendering (but sonar still works)
- Magnet: Seeker pulls ball toward Hider (seems reversed based on v1.3? verify: magnet might draw Hider toward orb? Need to check original v1.3 logic)
- Orb respawn timer (10s after collection)

### Phase 4 — Map Templates
Define 3-5 distinct map layouts (symmetrical, wide, tall, obstacle-heavy) instead of full procedural randomness.

### Phase 5 — Scoring Combos
Calculate score using RoundMeta:
- Base: turnsSurvived
- Quick tag penalty/bonus
- Combo bonus for consecutive bumper hits
- Near miss bonus (seeker within 50px)
- Power-up collection bonus
- Survival streak bonus

Show breakdown in round over screen.

### Phase 6 — Game Modes
- Time Attack: survive X seconds with Hider
- Endless: infinite rounds, escalating difficulty (more hazards, smaller maps?)

### Phase 7 — PWA
Add `manifest.webmanifest`, service worker for offline play. Prepare for Android app (TWA/Capacitor).

### Phase 8 — Replay System
Record input events (slingshot drag per turn) and play back. Not full state serialization — just inputs allow deterministic replay.

### Phase 9 — Sound
Simple sound effects using Web Audio API or howler.js.

### Phase 10 — Meta-progression (optional)
If desired, reintroduce shop/leaderboard/badges with persistent storage (localStorage for now).

---

## Engineering Discipline (Karpathy)

This project follows Karpathy's engineering discipline:
- **Single source of truth:** No duplicate state; derived data computed on render
- **Explicitness over magic:** All constants named and documented
- **Bugs are opportunities:** When something breaks, understand the root cause before fixing
- **Iterative refinement:** Small, reviewable changes; keep build green
- **Communication:** Commit messages explain the "why", not just the "what"

---

## Useful Commands

```bash
# Install deps
npm install

# Dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# GitHub Pages deploy (automatic on push to main)
git push origin main
```

---\n\n**Last updated:** 2026-05-26 (v0.3.0 deployed, text polish complete, audio plan delivered)
