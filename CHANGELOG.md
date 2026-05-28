# Changelog

## [Unreleased]

### Added
- 4 new power-ups: Rocket Burst, Gravity Well, Vampire, EMP
  - Rocket: 3× launch speed on seeker fling
  - Gravity: on orb collect, teleports Hider toward Seeker by distance-based offset (60-150px) — **known issue: still reports continuous pull, under investigation**
  - Vampire: steal 1 point on tag
  - EMP: freeze runner 1.5s on bumper hit
- 6 new sound effects (Web Audio API synthesis):
  - playPowerUpActivate() per type (whoosh, hum, chromatic, zap, spark)
  - playMatchOver() — now wired on match_over phase
  - playTurnStart() — now wired on turn transitions
- CHANGELOG.md tracking
- Gravity visual feedback: pulsing amber rings on Seeker + red pull arrow from Hider → Seeker (fades over 1.5 s)
- `KNOWN_ISSUES.md` for tracking unresolved bugs

### Changed
- Power-up types: removed Laser, Sonar, Cloak, Magnet (replaced with new 4)
- HelpManual: switched amber → emerald theme; documented all 6 power-ups
- Constants: added ROCKET_SPEED_MULT, GRAVITY_BURST_BASE/MAX, GRAVITY_BURST_MIN/MAX_DIST, GRAVITY_VISUAL_MS, EMP_FREEZE_MS/FRAMES, VAMPIRE_BONUS, ORBIT_SPEED/RADIUS
- HUD badge colors per power-up type
- Map generation now spawns new orb types
- Gravity Well: continuous pull removed from physics.ts; replaced with one-time teleport on orb collect — **reverted to known issue, needs further investigation**
- Removed rotating dashed turn halos from both balls (cleaner visual, solid edges only)
- Renderer signatures simplified: removed unused `isHiderTurn`/`isSeekerTurn` params
- Replay button: shows "TRY AGAIN" in Survival mode, "REPLAY SERIES" in Versus

### Fixed
- Duplicate gravity physics block in `physics.ts` (was applied 3× due to patch collision) — cleaned to single instance
- Duplicate gravity arrow drawing code removed from GameCanvas.tsx
- Collision clarity: balls now use solid white edge boundaries only, no dashed outlines
- Replay flow: Survival mode restarts correctly without role swap

### Known Issues
- **Gravity Well continuous pull** — Hider still pulled toward Seeker continuously after gravity orb collect. Multiple fix attempts (impulse, scaled impulse, teleport) all failed to resolve. Root cause unknown — likely a re-trigger path not yet identified. See `KNOWN_ISSUES.md` for details.
