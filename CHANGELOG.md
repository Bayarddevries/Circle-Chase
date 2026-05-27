# Changelog

## [Unreleased]

### Added
- 4 new power-ups: Rocket Burst, Gravity Well, Vampire, EMP
  - Rocket: 3× launch speed on seeker fling
  - Gravity: constant pull toward seeker
  - Vampire: steal 1 point on tag
  - EMP: freeze runner 1.5s on bumper hit
- 6 new sound effects (Web Audio API synthesis):
  - playPowerUpActivate() per type (whoosh, hum, chromatic, zap, spark)
  - playMatchOver() — now wired on match_over phase
  - playTurnStart() — now wired on turn transitions
- CHANGELOG.md tracking

### Changed
- Power-up types: removed Laser, Sonar, Cloak, Magnet (replaced with new 4)
- HelpManual: switched amber → emerald theme; documented all 6 power-ups
- Constants: added ROCKET_SPEED_MULT, GRAVITY_PULL, EMP_FREEZE_MS/FRAMES, VAMPIRE_BONUS, ORBIT_SPEED/RADIUS
- HUD badge colors per power-up type
- Map generation now spawns new orb types

### Fixed
- Canvas zero-height bug (nesting h-screen caused collapse to 0px)
- Dead code: removed laser beamLength condition, sonar fog/aiming conditions
- Duplicate showScoreMessage('TAG! +5') in triggerTagEvent
- Power-up duration: now lasts until end of next turn (was expiring same turn)
- Leaderboard: Firebase SDK ordered query failure fixed by switching to REST API + client-side sorting; added console warnings for debugging.