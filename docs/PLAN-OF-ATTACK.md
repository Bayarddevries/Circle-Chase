# Circle Chase — Feature Audit & Plan of Attack

## Current State (what's live right now)

### What WORKS (confirmed in current build):
- Core game loop: slingshot physics, bumper collisions, wall bounces, friction
- 6 power-ups: Iron, Rocket, Gravity, Vampire, Superball, EMP
- Fog of war (radial shroud)
- Sonar ping system (Hider position leak — power-up orb)
- Minimap in HUD
- Sudden death tiebreaker
- Best-of-3/5/7 match series
- Round intro with role assignment
- Match overlay (round over, match over, sudden death intro)
- Help manual modal
- HUD with turn indicator, power-up badge, quit button
- Mobile viewport meta tags, touch input, CSS touch safety
- Neon visual style with particles, trails, screen shake, slow-mo tag
- GitHub Pages auto-deploy via Actions
- CPU opponent with difficulty-based aim error (easy/medium/hard)
- RoundMeta tracking (turnsSurvived, bumperHits, powerUpCollector, tagTurn, nearMiss, combo)
- Score calculation (hider: base + bumper + nearMiss + powerUp; seeker: tagBase + quickTag + powerUp)
- Colorblind mode (shape overlays)
- Leaderboard via Firebase REST API + client-side sorting
- Headless playtesting harness with 6 AI strategies (`headless/`)
- Playtesting analysis tools (`tools/`)

### Known Issues & On Hold
- **Gravity Well continuous pull** — user still reports continuous pull despite teleport fix (KNOWN_ISSUES.md)
- **Scoring UI** — calculateRoundScore() works but round-over screen doesn't show the breakdown yet
- **Sound effects** — stubs exist, no actual audio synthesis
- **Orb respawn** — orb spawns once per round (respawn timer defined but not wired)
- **Cloak & Magnet** — existed in v1.3, removed, not yet restored
- **Map template system** — not implemented
- **PWA manifest** — not configured
- **Replay system** — not implemented
- **Game modes** — Time Attack, Endless not implemented

---

## Plan of Attack — Remaining Phases

### PHASE 5: Scoring Combos UI
**Effort: 1-2 hours**
**Risk: Low**

Wire `calculateRoundScore()` into the round-over screen. Display per-component breakdown:
- Hider: base (turns survived), bumper bonus, near-miss, power-up
- Seeker: tag base, quick tag bonus, power-up
- Round winner highlight

**Gate: Score breakdown visible on round-over, build passes, deploy.**

---

### PHASE 6: Gravity Well Fix
**Effort: 1-2 hours**
**Risk: Medium — intermittent bug**

Debug the continuous pull. Steps:
1. Add console.log inside teleport block and orb collect callback
2. Search ALL occurrences of `'gravity'` across codebase
3. Identify re-trigger path
4. Fix and verify

**Gate: Gravity orb produces single teleport only, no continuous pull.**

---

### PHASE 7: Sound Effects
**Effort: 2-3 hours**
**Risk: Low**

Web Audio API singleton. Sounds: launch, bumper hit, tag, orb collect, power-up activate, sonar, ice, sand, match over, turn start.
Mobile AudioContext unlock on first interaction.

**Gate: All sounds play at correct moments, no mobile issues.**

---

### PHASE 8: Game Mode Variants
**Effort: 3-4 hours**
**Risk: Low-Medium**

- **Time Attack**: Fixed timer (30-120s), Hider wins if time expires, countdown HUD
- **Endless**: Single round, always Hider, score = turns survived

**Gate: Both modes work, scoring correct, build + deploy.**

---

### PHASE 9: PWA
**Effort: 2-3 hours**
**Risk: Low**

Already using `vite-plugin-pwa`. Configure manifest (fullscreen, landscape), create app icons (192×192, 512×512), add meta tags. Test install prompt + offline play.

**Gate: PWA audit passes, installable on mobile, offline play works.**

---

### PHASE 10: Replay System
**Effort: 4-5 hours**
**Risk: Medium-High**

Record at 10fps. Store: timestamp, positions, velocities, events. Map seed for deterministic regeneration. Replay viewer with play/pause, speed, scrub. localStorage, max 10 replays.

**Gate: Record a match, play it back accurately, build + deploy.**

---

### PHASE 11: Capacitor / TWA (Android)
**Effort: 2-3 hours**
**Risk: Low-Medium**

Wrap the PWA in Capacitor or TWA for Android Play Store distribution. Requires icons, splash screen, Android Studio build.

**Gate: APK builds, installs and runs on Android device.**

---

## Dependency Graph

```
Phase 5 (Scoring UI)          ← can do anytime
Phase 6 (Gravity Fix)         ← can do anytime
Phase 7 (Sound)               ← can do anytime
Phase 8 (Game Modes)          ← can do anytime
Phase 9 (PWA)                 ← needed for Phase 11
Phase 10 (Replay)             ← can do anytime
Phase 11 (Capacitor/TWA)      ← needs Phase 9
```

## Recommended Order

1. **Phase 5** — Scoring UI (quick win, closes a visible gap)
2. **Phase 6** — Gravity fix (known bug affecting gameplay)
3. **Phase 7** — Sound (polish)
4. **Phase 8** — Game modes (variety)
5. **Phase 9** — PWA (needed for Android path)
6. **Phase 10** — Replay
7. **Phase 11** — Capacitor/TWA

## Rules

1. One phase at a time. Complete + deploy before starting next.
2. Feature branches: `feature/<description>`.
3. Commit after each successful step within a phase.
4. If something breaks, revert immediately. Don't compound errors.
5. Test on mobile after each phase.
6. No AI-sounding text in UI. Keep labels simple.
7. All constants in `src/constants.ts`. No magic numbers.
8. Build must pass before every deploy.
9. **Never push unverified changes to main.**
