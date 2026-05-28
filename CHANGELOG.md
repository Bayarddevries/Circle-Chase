# Changelog

## [Unreleased]

### Added
- Gravity Well power-up: single burst impulse (teleport) toward Seeker on orb collect
- `KNOWN_ISSUES.md` for tracking unresolved bugs
- Headless playtesting harness (`headless/`) with 6 AI strategies for automated balance testing
- Playtesting analysis tools (`tools/`) with match result analysis and parameter sweep capabilities
- `tools/PLAYTESTING.md` — playtesting methodology and harness documentation

### Changed
- Power-up set: iron, rocket, gravity, vampire, superball, emp (laser/sonar/cloak/magnet removed)
- Gravity Well: replaced continuous pull with single burst impulse, then with distance-based teleport (60-150px)
- Collision rendering: balls use solid white edge boundaries only, no dashed turn halos
- Renderer signatures simplified: removed unused params
- Replay button: "TRY AGAIN" in Survival mode, "REPLAY SERIES" in Versus
- Replaced old `tests/playtest/` shell scripts with TypeScript headless harness
- Input handling refinements (see `src/game/input.ts`)

### Fixed
- Duplicate gravity physics block in `physics.ts` (applied 3× due to patch collision) — cleaned to single instance
- Duplicate gravity arrow drawing code removed from `GameCanvas.tsx`
- Gravity impulse scaled to match player launch speeds (5-15 vs 180-450) to prevent persistent drift
- Gravity uses single burst + time-based duration instead of continuous pull
- Collision clarity: solid edges only, removed dashed outlines
- Replay flow: Survival mode restarts correctly without role swap
- Input edge cases in drag handling

### Known Issues
- **Gravity Well continuous pull** — Despite teleport fix, user still reports continuous pull. Root cause may be a re-trigger path not yet identified. See `KNOWN_ISSUES.md`.
- **Scoring combos UI** — RoundMeta tracking in place but detailed score breakdown not yet displayed in round-over screen
- **Orb respawn** — Power-up orb spawns once and stays (no respawn)
- **Cloak & Magnet power-ups** — Token types defined but logic removed
- **Sound effects** — Stub functions exist but no actual audio synthesis implemented
- **PWA manifest** — Not configured
