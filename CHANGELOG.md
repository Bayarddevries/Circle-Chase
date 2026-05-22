# Changelog

## v1.2 — 2026-05-22

### Technical Foundation (Sprint 1)

**New Features:**
- High-DPI canvas rendering — `devicePixelRatio` scaling for crisp retina displays
- Touch input safety — `e.preventDefault()` on all touch handlers prevents mobile scroll jank
- Reduced shadowBlur on particles — only large sparks get glow, debris/glass render flat
- Particle system hard cap — max 500 particles, oldest culled first
- Centralized game constants — all magic numbers extracted to `src/constants.ts`
- Meta-progression system scaffold — `useMetaProgression` hook, `MetaState` type, leaderboard, badges, credits, shop (localStorage persistence)

**Components Added:**
- `src/constants.ts` — 60+ named constants (physics, camera, rendering, AI, progression)
- `src/hooks/useMetaProgression.ts` — meta-progression hook (credits, unlocks, leaderboard, badges)
- `src/components/ShopModal.tsx` — shop UI for purchasing unlocks
- `src/components/LeaderboardModal.tsx` — top-10 survival leaderboard
- `src/components/ProfileModal.tsx` — badges and stats display

**Components Modified:**
- `src/App.tsx` — added meta-progression state, purchase handler, modals; fixed type errors
- `src/components/GameCanvas.tsx` — DPI scaling, touch safety, shadowBlur reduction, particle cap, constants imports
- `src/components/MainMenu.tsx` — added `Store` icon import, `onOpenLeaderboard`/`onOpenProfile` props
- `src/types.ts` — added `AIDifficulty`, `Unlocks`, `LeaderboardEntry`, `Badge`, `MetaState`, `ShopItem`, `RoundMeta`, `PowerUpType` extensions
- `src/components/MatchOverlay.tsx` — added meta-progression display props

**Known Issues (from COMPREHENSIVE_REVIEW):**
- No AI opponent — planned for v1.3
- Power-up balance needs tuning (Superball too strong, Laser does nothing useful)
- No colorblind mode
- No minimap
- Typo "Collogation" in HelpManual.tsx
- Title inconsistency ("Neon Night Golf Chase" vs "NIGHT GOLF CHASE")
- Fog of war too simplistic

## v1.1 — 2026-05-22

### Meta-Progression Scaffold

**Components Added:**
- `src/hooks/useMetaProgression.ts` — meta-progression hook
- `src/components/ShopModal.tsx` — shop modal
- `src/components/LeaderboardModal.tsx` — leaderboard modal
- `src/components/ProfileModal.tsx` — profile modal

**Components Modified:**
- `src/types.ts` — added meta-progression types

## v1.0 — 2026-05-22

### Initial Release

**Features:**
- 2-player turn-based physics evasion game
- React 19 + TypeScript + Vite 6 + TailwindCSS 4
- Canvas-based rendering with 60fps game loop
- Physics engine with 5-step sub-stepping per frame
- Slingshot controls (drag back to aim, release to launch)
- Procedural map generation (neon bumpers, sand/ice hazards, power-up orbs)
- Turn-based gameplay: Hider flings first, then Seeker, alternating until tag
- Fog of War: Hider hidden beyond 350px from Seeker
- Sonar ping system: Hider position leaks every 3 seconds
- Power-up system: Laser Sight, Superball, Iron Ball, Sonar Pulse
- Score tracking: Hider earns 1 point per turn survived
- Best-of series: 3, 5, or 7 rounds
- Sudden Death tie-breaker on compact map with no fog
- Round intro with role assignment display
- Round over summary with score update
- Match over screen with champion declaration and round history log
- Help manual modal with full operations guide
- Neon dark theme (amber/emerald accents, cinematic glow effects)
- Main menu with player name inputs and match series selector

**Components:**
- `App.tsx` — State machine, game phase management
- `GameCanvas.tsx` — Canvas rendering, physics, input handling (~1750 lines)
- `MainMenu.tsx` — Configuration form
- `MatchOverlay.tsx` — Round/match transition screens
- `HelpManual.tsx` — Operations manual modal
- `types.ts` — TypeScript type definitions

**Known Issues:**
- No touch input support (desktop only) — FIXED v1.2
- No sound effects
- No AI opponent
- No PWA support
- No automated tests
