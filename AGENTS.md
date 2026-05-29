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
│   ├── Power-up system (iron, gravity, magnet, smoke, tracker — see Phase 1)
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
- Slingshot physics with sub-stepping (5 steps/frame)
- Bumper collisions with varying restitution and boost
- Sand & ice hazard patches (friction modifiers)
- Fog of war (shrouds Hider from Seeker at distance)
- Power-ups: Iron Ball, Gravity Well, Magnet, Smoke Screen, Tracker (5 types — Seeker-only)
- Runner can steal/deny orbs by touching them first
- 8 orbs per round, one of each type guaranteed, bumper-safe spawn positions
- Manual activation (Space/HUD button) for Iron, Magnet, Tracker
- Auto-activation for Gravity, Smoke
- Iron: 50% friction reduction for 2 rounds (all surfaces)
- Magnet: 35% homing curve toward Runner on next launch (pulsing blue ring indicator)
- Smoke: 50% fog-of-war radius reduction for 1 round
- Tracker: reveals Runner exact position for 3s (green ring)
- Gravity: 80px instant pull toward Seeker
- Particle system (sparks, debris, shockwaves) — capped at 500
- Cinematic camera: tracking, zoom, shake
- Slow-motion freeze on tag
- Sudden death mode on tied matches (compact map, no fog)
- Colorblind mode (shape overlays on balls)
- CPU opponent (easy/medium/hard)
- Mobile viewport meta tags + touch safe hit areas
- Leaderboard: global survival scores via Firebase Realtime DB (REST + client-side sorting)
- RoundMeta tracking + score calculation (calculateRoundScore in scoring.ts)
- Headless playtesting harness (headless/) with 6 AI strategies
- Playtesting analysis tools (tools/)

### Removed / On Hold
- Shop and badges (removed in commit 05e4f93); leaderboard restored for survival mode via Firebase Realtime DB
- Orb respawn (power-up orb spawns once per round; respawn timer constant exists but not wired)
- Directional fog (shroud always radial)
- Cloak & Magnet power-ups (existed in v1.3, removed, not yet restored)
- Map template system
- Game modes (Time Attack, Endless)
- Scoring combos UI (RoundMeta tracked, calculateRoundScore() implemented, round-over display not yet wired)
- Replay system
- Sound effects (stubs exist, no audio synthesis)
- PWA manifest (vite-plugin-pwa installed but no manifest/icons configured)

---

## Code Structure & Conventions

### Constants
All magic numbers are centralized in `src/constants.ts`. Before editing any value, search the file to see if it already exists. If not, add a new constant with a clear comment grouping (Physics, Camera, Slingshot, etc.).

### Types
Extended types in `src/types.ts`:
- `PowerUpType`: 'iron' | 'gravity' | 'magnet' | 'smoke' | 'tracker'
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

- Feature branches use the `pages.yml` workflow with `workflow_dispatch` trigger only (not automatic on push)
- Trigger manually: `gh workflow run pages.yml --ref feature/<name>`
- Build uses `BASE_PATH=/Circle-Chase/preview/<branch-name>/` so assets resolve correctly
- **Known issue:** GitHub's auto `pages-build-deployment` action runs after Deploy writes to gh-pages and may overwrite preview directories. Previews may not be reliably servable. Use local preview builds for feature testing instead.
- Preview directories on gh-pages are never cleaned up automatically; old ones can be manually deleted if needed
- **Recommended:** Always test with `npm run build` (production) or `BASE_PATH=/Circle-Chase/preview/<name>/ npm run build` (preview) locally before merging to main

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

## Phase Roadmap

### Completed ✓

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Constants, types, colorblind, CPU config | ✓ Done |
| 1 | GameCanvas → 11 modules (1951→981 lines) | ✓ Done |
| 1.5 | Text Polish & Rebrand: "Turn Tag" | ✓ Done |
| 1.6 | Audio design plan (Web Audio API) | ✓ Done |
| 2 | CPU AI opponent (easy/medium/hard) | ✓ Done |
| 3 | 6 power-ups: Iron, Rocket, Gravity, Vampire, Superball, EMP | ✓ Done |
| 4 | Score calculation (`calculateRoundScore()` in `src/game/scoring.ts`) | ✓ Done |

### Active / Pending

| Phase | Description | Status |
|-------|-------------|--------|
| 5 | Scoring combos UI — wire `calculateRoundScore` into round-over screen | 🔴 Pending |
| 6 | Gravity Well continuous pull fix — intermittent bug, under investigation | 🔴 Pending |
| 7 | Sound effects — Web Audio API synthesis (stubs exist) | ⏳ Pending |
| 8 | Game modes — Time Attack, Endless | ⏳ Pending |
| 9 | PWA — installable, offline (vite-plugin-pwa installed, needs manifest/icons) | ⏳ Pending |
| 10 | Replay system — record/playback rounds | ⏳ Pending |
| 11 | Capacitor/TWA — Android app store wrap | ⏳ Pending |
| 12 | Statistics tracking — per-game stats | ⏳ Pending |

### One-Shot Fixes (No Phase)
- Sudden death camera fix — known issue in compact map
- CPU AI improvement — medium/hard need obstacle avoidance
- Power-up validation — filter Vampire from Survival mode
- Orb respawn wiring — timer constant exists, not connected to game loop

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
