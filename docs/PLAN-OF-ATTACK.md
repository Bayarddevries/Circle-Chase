# Circle Chase — Feature Audit & Plan of Attack

## Current State (what's live right now)

### What WORKS (confirmed in current build):
- Core game loop: slingshot physics, bumper collisions, wall bounces, friction
- 4 power-ups: Laser, Superball, Iron Ball, Sonar
- Fog of war (300px radius) + sonar pings
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

### What was LOST in the AI Studio cleanup (v1.3 → current):
- **constants.ts** — all magic numbers inlined in GameCanvas (141 lines of constants gone)
- **AI opponent** — full CPU seeker with 3 difficulty levels (easy/medium/hard) removed
- **2 power-ups** — Cloak (3s invisibility) and Magnet (5s pull) removed
- **Colorblind mode** — shape overlays on balls removed
- **Orb respawn timer** — orb now stays gone after collection
- **Directional fog of war** — was cone-based, now simple radius
- **Meta-progression** — credits, shop, leaderboard, badges all removed
- **Unlock system** — ball skins, trail colors, bumper themes, map backgrounds removed
- **RoundMeta tracking** — per-round stats (bumper hits, power-up collected, tag turn) removed

### What was NEVER built (planned but not implemented):
- PWA (installable, offline)
- Map template system (6 layout types)
- Game mode variants (Time Attack, Endless)
- Scoring combos (distance bonus, quick tag, bumper combo, near-miss, streak)
- Replay system (record/playback)
- Sound effects
- GameCanvas refactor (still 1825-line monolith)

---

## Plan of Attack — Phased Implementation

### PHASE 0: Foundation (DO FIRST — unblocks everything)
**Effort: 2-3 hours**
**Risk: Low**

#### 0a. Restore constants.ts
Create `src/constants.ts` with all magic numbers from the v1.3 version plus any new ones. Import in GameCanvas. Build + verify.

#### 0b. Restore RoundMeta tracking
Add `RoundMeta` interface back to types.ts. Track per-round: turnsSurvived, powerUpCollected, bumperHits, tagTurn. Pass from GameCanvas to App.tsx on round complete. This is needed for scoring combos AND was used by meta-progression.

#### 0c. Restore colorblind mode
Add `colorblindMode` to MatchConfig. Add shape overlays (square for Hider, triangle for Seeker) in GameCanvas rendering. Add toggle in MainMenu.

**Gate: Build passes, game plays identically, deploy to gh-pages, verify live.**

---

### PHASE 1: GameCanvas Refactor
**Effort: 3-4 hours**
**Risk: Medium — touching the core file**

Split 1825-line GameCanvas.tsx into modules. Pure refactor, NO behavior changes.

Target structure:
```
src/game/
├── types.ts          — internal game types
├── constants.ts      — (already exists from Phase 0)
├── physics.ts        — substepping, collisions, friction
├── renderer.ts       — all canvas draw calls
├── input.ts          — slingshot state machine + coordinate transforms
├── map.ts            — procedural generation
├── particles.ts      — particle spawn/update/draw
├── camera.ts         — follow, zoom, shake
├── fog.ts            — fog of war rendering
├── minimap.ts        — minimap drawing
├── sonar.ts          — ping logic
└── powerups.ts       — orb collection, effects
```

Extraction order (safest first):
1. particles.ts (self-contained)
2. camera.ts (clear I/O)
3. input.ts (coordinate math helpers)
4. map.ts (generation logic)
5. minimap.ts (rendering only)
6. fog.ts (rendering only)
7. sonar.ts (ping management)
8. powerups.ts (collision + effects)
9. renderer.ts (all draw functions — largest)
10. physics.ts (last — most interconnected)

After each extraction: build + verify in browser.

**Gate: All modules extracted, GameCanvas.tsx ~200 lines, build passes, deploy, verify.**

---

### PHASE 2: AI Opponent
**Effort: 3-4 hours**
**Risk: Medium — adds complexity to game loop**

Restore the CPU Seeker AI from v1.3. Key components:
- `isCpu` and `difficulty` in MatchConfig
- AI thinking delay (1s), aim error based on difficulty
- Target prediction using last known hider position (from sonar)
- Visual "AI thinking" indicator
- AI only controls Seeker; Hider is always human

Difficulty levels:
- Easy: ±15% aim error, slower reaction
- Medium: ±8% aim error, normal reaction
- Hard: ±3% aim error, faster reaction, better prediction

**Gate: AI plays believably on all 3 difficulties, build passes, deploy.**

---

### PHASE 3: Power-Up Restoration + New Additions
**Effort: 2-3 hours**
**Risk: Low**

Restore from v1.3:
- **Cloak**: Hider invisible for 3 seconds (180 frames)
- **Magnet**: Seeker pulls Hider toward them for 5 seconds (300 frames)

Add improvements:
- **Orb respawn timer**: Orb respawns after 10 seconds if not collected
- **Orb respawn visibility**: Show countdown timer on HUD when orb is gone
- **Directional fog of war**: Cone-based visibility based on Seeker movement direction (from v1.3)

**Gate: All 6 power-ups work, orb respawn visible, fog is directional, build + deploy.**

---

### PHASE 4: Map Template System
**Effort: 4-6 hours**
**Risk: Low — isolated to map.ts module**

6 templates with distinct strategic identities:
1. **Open Arena** — sparse bumpers (3), few hazards, pure skill
2. **Bumper Maze** — dense corridors (10 bumpers), gap-based navigation
3. **Sandstorm** — sand-dominated (6 sand, 2 ice), risk/reward paths
4. **Ice Rink** — ice-dominated (1 sand, 7 ice), chaotic sliding
5. **Symmetry** — mirrored layout, competitive fairness
6. **Chaos** — completely random (current default)

Layout algorithms: grid, corridors, clusters, symmetric
Hazard patterns: random, quadrants, dominated
Orb bias: center, hider-seekeer, neutral

Start with random-only (no UI selector). Add selector later if desired.

**Gate: All 6 templates generate without errors, visually distinct, build + deploy.**

---

### PHASE 5: Scoring & Combos
**Effort: 2-3 hours**
**Risk: Low — additive only**

Bonuses (all tracked per round via RoundMeta):
- **Distance bonus**: avg separation × 50 (max 50 pts)
- **Quick Tag**: tag in ≤3 turns = 25 pts
- **Bumper Combo**: consecutive hits ×1.5, ×2, ×2.5...
- **Near-Miss**: balls within 50px = 10 pts
- **Power-Up Efficiency**: collected = 15 pts
- **Survival Streak**: 10+ turns for 2+ consecutive rounds = 10/level

UI: Floating text during gameplay ("COMBO x2!", "CLOSE!"), score breakdown on round over.

**Gate: All bonuses track correctly, floating text visible, build + deploy.**

---

### PHASE 6: Game Mode Variants
**Effort: 3-4 hours**
**Risk: Low-Medium**

**Time Attack**: Fixed timer (30-120s), Hider wins if time expires, points = seconds survived, countdown HUD

**Endless**: Single round, always Hider, no Sudden Death, score = turns survived

UI: Mode selector in MainMenu, time duration slider for Time Attack

**Gate: Both modes work, scoring correct, build + deploy.**

---

### PHASE 7: PWA
**Effort: 2-3 hours**
**Risk: Low**

- Install `vite-plugin-pwa`
- Configure manifest (fullscreen, landscape, theme_color)
- Create app icons (192×192, 512×512)
- Add meta tags to index.html
- Test install prompt, offline play

**Gate: PWA audit passes, installable on mobile, offline play works.**

---

### PHASE 8: Replay System
**Effort: 4-5 hours**
**Risk: Medium-High**

- Record at 10fps (every 6 frames)
- Store: timestamp, positions, velocities, events
- Map seed for deterministic regeneration
- Replay viewer with play/pause, speed, scrub, round navigation
- localStorage, max 10 replays
- "Watch Replay" on match over, Replays list in MainMenu

**Gate: Record a match, play it back accurately, build + deploy.**

---

### PHASE 9: Sound Effects
**Effort: 2-3 hours**
**Risk: Low**

- Web Audio API singleton
- Sounds: launch, bumper hit, tag, orb collect, power-up activate, sonar, ice, sand
- Mobile AudioContext unlock on first interaction

**Gate: All sounds play at correct moments, no mobile issues.**

---

### PHASE 10: Meta-Progression (Optional — only if you want it back)
**Effort: 3-4 hours**
**Risk: Low**

Restore from v1.3:
- Credits earned per round (turns × multiplier)
- Shop with ball skins, trail colors, bumper themes, map backgrounds
- Leaderboard (top 10 survival times)
- Badges (Sand Dodger, Bounce Master, Quick Tag, Century Runner, etc.)
- All persisted in localStorage

**Gate: Full meta loop works, purchase/equip cycle functional.**

---

## Dependency Graph

```
Phase 0 (Constants + RoundMeta + Colorblind)
    │
    ├──→ Phase 1 (Refactor) ──→ Phase 4 (Map Templates)
    │                          ──→ Phase 5 (Scoring)
    │                          ──→ Phase 8 (Replay)
    │
    ├──→ Phase 2 (AI Opponent)
    │
    ├──→ Phase 3 (Power-Ups)
    │
    ├──→ Phase 6 (Game Modes)
    │
    ├──→ Phase 7 (PWA)  ← can be done anytime after Phase 0
    │
    ├──→ Phase 9 (Sound) ← can be done anytime after Phase 0
    │
    └──→ Phase 10 (Meta-Progression) ← optional
```

## Recommended Order

1. **Phase 0** — Foundation (constants, RoundMeta, colorblind)
2. **Phase 1** — Refactor (unblocks everything cleanly)
3. **Phase 2** — AI Opponent (restores lost feature)
4. **Phase 3** — Power-Ups (restores lost features)
5. **Phase 4** — Map Templates (new feature, high replayability impact)
6. **Phase 5** — Scoring Combos (new feature, adds depth)
7. **Phase 6** — Game Modes (new feature, variety)
8. **Phase 7** — PWA (deployment milestone → Play Store path)
9. **Phase 8** — Replay (complex, do after core is stable)
10. **Phase 9** — Sound (polish)
11. **Phase 10** — Meta-Progression (optional)

Total estimated effort: 25-35 hours of focused work.

## Rules

1. One phase at a time. Complete + deploy before starting next.
2. Feature branches: `feature/phase-0-constants`, `feature/phase-1-refactor`, etc.
3. Commit after each successful step within a phase.
4. If something breaks, revert immediately. Don't compound errors.
5. Test on mobile after each phase.
6. No AI-sounding text in UI. Keep labels simple.
7. All constants in `src/constants.ts`. No magic numbers.
8. Build must pass before every deploy.
