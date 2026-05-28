# Circle Chase — Task Tracker

Done items marked. Active work at top.

## In Progress 🔄

- [ ] **Gravity Well continuous pull** — known issue, under investigation (see KNOWN_ISSUES.md)
- [ ] **Scoring combos UI** — RoundMeta tracked, calculations done, display not yet wired to round-over screen

## Done ✅

### Features
- [x] Phase 0 — Constants file, RoundMeta tracking, colorblind mode, CPU config
- [x] Phase 1 — GameCanvas refactor into 11 modules (1951 → 981 lines)
- [x] Phase 1.5 — Text polish & rebrand: "Turn Tag", tagline "Turn-Based Tag 'Em Up"
- [x] Phase 2 — AI opponent (easy/medium/hard) with difficulty-based aim error
- [x] Phase 3 — 6 power-ups: Iron, Rocket, Gravity, Vampire, Superball, EMP
- [x] Phase 4 — Scoring system: hider/seeker score formulas with combo bonuses
- [x] Leaderboard: Firebase SDK → REST API fix + client-side sorting
- [x] Headless playtesting harness (`headless/`) with 6 AI strategies
- [x] Playtesting analysis tools (`tools/`) — match result analysis, parameter sweep
- [x] Gravity visual feedback — pulsing rings, pull arrow (fades over 1.5s)
- [x] Collision clarity — solid white edge boundaries, dashed turn halos removed
- [x] Replay flow fix — Survival shows "TRY AGAIN", restarts without role swap
- [x] Canvas zero-height bug fix
- [x] Dead code removal (old laser/sonar conditions)
- [x] Power-up duration fix — lasts until end of next turn
- [x] Input handling refinements

### Fixes
- [x] Duplicate gravity physics block in physics.ts (applied 3× due to patch collision)
- [x] Duplicate gravity arrow drawing code removed from GameCanvas.tsx
- [x] Gravity impulse scaled to match player launch speeds (5-15, not 180-450)
- [x] Gravity replaced continuous pull with single burst + time-based duration

## Next Up 🔜

- [ ] Scoring combos UI — wire calculateRoundScore into round-over screen display
- [ ] Sudden death camera fix — known issue in compact map
- [ ] CPU AI improvement — medium/hard need obstacle avoidance (currently launches into obstacles)
- [ ] Power-up validation — Vampire doesn't make sense in Survival mode; filter by game mode

## Mid-term ⌛

- [ ] Sound effects — Web Audio API synthesis (all stubs exist, no audio)
- [ ] Statistics tracking — per-game stats
- [ ] Game modes — Time Attack, Endless

## Later 📋

- [ ] PWA — installable, offline, homescreen-ready
- [ ] Replay system — record & playback rounds
- [ ] Capacitor/TWA — Android app store wrap
- [ ] Meta-progression — shop, badges (optional)
