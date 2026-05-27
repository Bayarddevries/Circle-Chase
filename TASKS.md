# Circle Chase

Merged roadmap: original Google Tasks + recent suggestions. Done items marked.

## Done ✅

- [x] Phase 1 — Module extraction (game/*.ts refactor)
- [x] Phase 2 — AI opponent (easy/medium/hard)
- [x] Phase 9 — Sound effects + haptics (Web Audio API, procedural)
- [x] Player piece visual upgrade — Tech Neon (gradient, solid edge, animated rings)
- [x] Multiple power-up orbs on map — 3-4 orbs spawn per round with different types (laser, superball, iron, sonar, cloak, magnet) | [Phase 3]
- [x] Cloak + Magnet power-ups — restore removed logic | [Phase 3]
- [x] Map template system — 6 curated layouts | [Phase 4]
- [x] Bigger tag explosion — flash burst, dual shockwave, more particles
- [x] Quick tag bonus fix — within 3 turns, counter was broken
- [x] PWA — installable, offline, homescreen-ready | [Phase 7]
- [x] 4 new power-ups: Rocket Burst, Gravity Well, Vampire, EMP
- [x] 6 new sound effects — power-up activate, match over, turn start
- [x] Power-up duration fix — lasts until end of next turn
- [x] Leaderboard: Firebase SDK → REST API fix + client-side sorting
- [x] HelpManual updated — new power-ups + emerald theme
- [x] Canvas zero-height bug fix
- [x] Dead code removal (laser/sonar conditions)

## Next Up 🔜

- [ ] Sudden death camera fix — known issue in compact map
- [ ] CPU AI improvement — medium/hard difficulties need obstacle avoidance logic (currently launches directly into obstacles)
- [ ] Gravity powerup balance — reduce pull strength; currently OP for Seeker to suck Hider in
- [ ] Collision clarity — circles need hard visual edges; rotating dashed lines don't count as contact and are confusing
- [ ] Power-up validation — Vampire doesn't make sense in Survival mode; filter power-ups by active game mode
- [ ] Replay flow fix — after Survival mode, "Replay" should restart Survival (not switch to Vs. mode)

## Mid-term ⌛

- [ ] Scoring combos — distance, quick tag, bumper streak | [Phase 5]
- [ ] Visual facelift — coordinated pass on colors, HUD, fonts, transitions (deferred)

## Later 📋

- [ ] Statistics tracking — per-game stats
- [ ] Game modes — Time Attack, Endless | [Phase 6]
- [ ] Replay system — record & playback rounds | [Phase 8]
- [ ] Capacitor/TWA — Android app store wrap
- [ ] Meta-progression — shop, leaderboard, badges | [Phase 10]
