# Circle Chase — Known Issues

## 1. Sudden Death: Camera breaks, players can't take their turn
**Reported:** 2026-05-24 (Phase 2 testing)

When a tied match triggers sudden death, the camera transformation breaks on the compact map. Players are unable to interact (drag/launch) and the game appears stuck.

**Suspected cause:** The sudden death map dimensions (`SD_MAP_WIDTH` / `SD_MAP_HEIGHT`) differ from normal play. The camera transform or input coordinate mapping may use the wrong dimensions during sudden death, or the `isSuddenDeath` flag doesn't propagate correctly through the game loop.

**Not yet investigated.** Needs reproduction + root cause analysis.

---

## 2. Scoring calculations need review
**Reported:** 2026-05-24 (Phase 2 testing)

The scoring displayed after a round and at match end feels off. Current scoring:
- Hider earns +1 point per turn survived
- Seeker gets points on tag (via `turnsSurvived` being credited to the Hider)
- No bonus for bumper hits, power-up collection, quick tag, or near misses

**RoundMeta tracking exists** in `GameCanvas.tsx` (bumperHits, powerUpCollected, tagTurn, comboCount, nearMiss) but none of these feed into the score calculation. The scoring pipeline (round → match) needs to be reviewed holistically:
- What scores each action?
- What's displayed on the round-over screen?
- How is the champion determined at match end?
- Does the CPU scoring path account correctly?

**Needs:** Audit `handleRoundComplete` in `App.tsx`, the `MatchOverlay` score display, and the `GameCanvas` scoring pipeline.

---

## 3. Black screen on initial round (resolved)
See `docs/BUGFIX-2026-05-24-black-screen.md` for the full postmortem.

Root cause was a combination of:
- CSS: `h-screen` on GameCanvas root div (nested 100vh conflict)
- JS: `physicsStepLocal()` referencing bare `hider`/`seeker`/`bumpers` (not `Ref.current`)
- JS: `updateOrbPulse` using `time` instead of `_time`

All fixed and verified.