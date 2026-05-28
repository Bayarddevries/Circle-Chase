# Changelog

## [Unreleased]

### Added
- 4 new power-ups: Rocket Burst, Gravity Well, Vampire, EMP
  - Rocket: 3× launch speed on seeker fling
  - Gravity: single burst impulse on orb collect (distance-based strength, stronger when closer)
  - Vampire: steal 1 point on tag
  - EMP: freeze runner 1.5s on bumper hit
- 6 new sound effects (Web Audio API synthesis):
  - playPowerUpActivate() per type (whoosh, hum, chromatic, zap, spark)
  - playMatchOver() — now wired on match_over phase
  - playTurnStart() — now wired on turn transitions
- CHANGELOG.md tracking
- Gravity visual feedback: pulsing amber rings on Seeker + red pull arrow from Hider → Seeker (fades over 1.5 s)

### Changed
- Power-up types: removed Laser, Sonar, Cloak, Magnet (replaced with new 4)
- HelpManual: switched amber → emerald theme; documented all 6 power-ups
- Constants: added ROCKET_SPEED_MULT, GRAVITY_BURST_BASE/MAX, GRAVITY_BURST_MIN/MAX_DIST, GRAVITY_VISUAL_MS, EMP_FREEZE_MS/FRAMES, VAMPIRE_BONUS, ORBIT_SPEED/RADIUS
- HUD badge colors per power-up type
- Map generation now spawns new orb types
- Gravity Well: switched from continuous pull to single burst impulse on orb collect — fair gameplay, Hider can escape
- Removed rotating dashed turn halos from both balls (cleaner visual, solid edges only)
- Renderer signatures simplified: removed unused `isHiderTurn`/`isSeekerTurn` params
- Replay button: shows "TRY AGAIN" in Survival mode, "REPLAY SERIES" in Versus

### Fixed
- Duplicate gravity physics block in `physics.ts` (was applied 3× due to patch collision) — cleaned to single instance
- Collision clarity: balls now use solid white edge boundaries only, no dashed outlines
- Replay flow: Survival mode restarts correctly without role swap
