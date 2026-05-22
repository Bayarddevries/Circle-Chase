# Changelog

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
- `GameCanvas.tsx` — Canvas rendering, physics, input handling (~1663 lines)
- `MainMenu.tsx` — Configuration form
- `MatchOverlay.tsx` — Round/match transition screens
- `HelpManual.tsx` — Operations manual modal
- `types.ts` — TypeScript type definitions

**Known Issues:**
- No touch input support (desktop only)
- No sound effects
- No AI opponent
- No PWA support
- No automated tests
