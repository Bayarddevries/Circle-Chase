# Game Mode Variants Plan

## Goal

Add two new game modes beyond the standard best-of series: **Time Attack** and **Endless**. These increase replayability and give players different ways to engage with the game.

**Effort:** 3-4 hours
**No new npm packages**

---

## Current State

The game currently has one mode:
- **Standard:** Best-of series (3/5/7 rounds), Hider earns 1 point per turn survived, roles alternate, tie goes to Sudden Death

---

## New Modes

### Mode 1: Time Attack

**Concept:** The Hider has a fixed time limit to survive. The Seeker tries to tag them before time runs out. Shorter time = higher difficulty.

**Rules:**
- Each round has a countdown timer (starting at 60 seconds, configurable)
- Hider earns points for every second survived
- If time runs out, Hider wins the round (Seeker gets 0)
- If Seeker tags Hider, Seeker wins the round
- Roles alternate each round (same as Standard)
- Best-of series (3/5/7 rounds)
- No Sudden Death — ties broken by total time survived across all rounds

**UI Changes:**
- MainMenu: Add mode selector `[Standard | Time Attack | Endless]`
- MainMenu: When Time Attack selected, show timer duration slider `[30s | 45s | 60s | 90s | 120s]`
- HUD: Show countdown timer (large, top-center, amber when >10s, red pulse when ≤10s)
- Round Over: Show "Time Survived: X.Xs" instead of "Turns Survived: N"

**Scoring:**
- Hider: 1 point per second survived (rounded down)
- Seeker: 100 points for a tag (flat bonus for winning the round quickly)
- Round winner: whoever has more points that round
- Match winner: best-of series

**New Types:**

```typescript
// types.ts — add to existing types
export type GameMode = 'standard' | 'time_attack' | 'endless';

export interface MatchConfig {
  // ...existing fields
  gameMode?: GameMode;
  timeAttackDuration?: number;  // seconds, default 60
}
```

**New Constants:**

```typescript
// constants.ts
export const TIME_ATTACK_DEFAULT_DURATION = 60;  // seconds
export const TIME_ATTACK_MIN_DURATION = 30;
export const TIME_ATTACK_MAX_DURATION = 120;
export const TIME_ATTACK_SEEKER_TAG_BONUS = 100;  // points
export const TIME_ATTACK_WARNING_THRESHOLD = 10;  // seconds, start red pulse
```

**Implementation:**

```typescript
// In GameCanvas.tsx — add timer state
const [timeRemaining, setTimeRemaining] = useState(matchConfig.timeAttackDuration ?? TIME_ATTACK_DEFAULT_DURATION);

// In game loop — decrement timer each frame
if (matchConfig.gameMode === 'time_attack' && phase === 'playing') {
  setTimeRemaining(prev => {
    const next = prev - dt;
    if (next <= 0) {
      // Time's up — Hider wins the round
      handleRoundComplete(/* turns */ Math.floor((matchConfig.timeAttackDuration! - prev) * 60));
      return 0;
    }
    return next;
  });
}

// In HUD rendering
if (matchConfig.gameMode === 'time_attack') {
  drawTimer(ctx, timeRemaining, TIME_ATTACK_WARNING_THRESHOLD);
}
```

---

### Mode 2: Endless

**Concept:** One continuous round. The Hider tries to survive as long as possible. No role switching, no rounds. Pure survival.

**Rules:**
- Single round, no time limit
- Hider always stays Hider, Seeker always stays Seeker
- Score = turns survived
- Game ends when Seeker tags Hider
- Score goes directly to leaderboard
- No Sudden Death (not applicable)

**UI Changes:**
- MainMenu: Mode selector includes "Endless"
- HUD: Show "Turns: N" (no round counter, no score)
- No Round Intro screen (go straight to playing)
- Game Over screen: "Survived N turns" + leaderboard position

**Scoring:**
- 1 point per turn survived
- Score submitted to leaderboard on game over
- No credits awarded (or award based on turns survived — configurable)

**Implementation:**

```typescript
// In App.tsx — handle Endless mode
const handleRoundComplete = (turns: number) => {
  if (config.gameMode === 'endless') {
    // Endless: one round, game over immediately
    awardRound({ turnsSurvived: turns, powerUpCollected: false, bumperHits: 0, tagTurn: turns });
    setPhase('match_over');
    return;
  }
  // ...existing standard logic
};

// In GameCanvas.tsx — skip round intro for endless
useEffect(() => {
  if (matchConfig.gameMode === 'endless') {
    // Start playing immediately, no round intro
    onPhaseChange('playing');
  }
}, []);
```

---

## Mode Selection UI

Add to MainMenu.tsx, below the best-of selector:

```
Game Mode:  [Standard ▼]
            Standard
            Time Attack
            Endless
```

When "Time Attack" is selected, show an additional control:

```
Time Limit: [60s ▼]
            30s
            45s
            60s
            90s
            120s
```

When "Endless" is selected, hide the best-of selector (not applicable).

---

## State Machine Changes

The existing `GamePhase` type needs no changes. The modes affect behavior within existing phases:

| Phase | Standard | Time Attack | Endless |
|---|---|---|---|
| round_intro | Show roles | Show roles + timer | Skip |
| playing | Normal | Countdown timer | Normal |
| round_over | Show turns | Show time survived | N/A (goes to match_over) |
| match_over | Champion | Champion | "Survived N turns" |
| sudden_death | Tie breaker | N/A | N/A |

---

## File Summary

| File | Action | Purpose |
|---|---|---|
| `src/types.ts` | Modify | Add `GameMode` type, add fields to `MatchConfig` |
| `src/constants.ts` | Modify | Add time attack constants |
| `src/components/MainMenu.tsx` | Modify | Add mode selector, time limit selector |
| `src/components/GameCanvas.tsx` | Modify | Add timer logic, HUD timer display |
| `src/components/MatchOverlay.tsx` | Modify | Adjust round over / match over for new modes |
| `src/App.tsx` | Modify | Handle endless mode round completion |

---

## Implementation Order

1. Add types and constants
2. Add mode selector to MainMenu
3. Add timer logic to GameCanvas (Time Attack)
4. Add HUD timer display
5. Handle Endless mode in App.tsx and GameCanvas
6. Adjust MatchOverlay for new modes
7. Test each mode in browser
8. Build and verify

---

## Testing Checklist

- [ ] Standard mode works exactly as before
- [ ] Time Attack: timer counts down correctly
- [ ] Time Attack: Hider wins when time runs out
- [ ] Time Attack: Seeker wins when tag occurs before time runs out
- [ ] Time Attack: HUD timer turns red at ≤10s
- [ ] Time Attack: round over shows time survived
- [ ] Time Attack: best-of series works correctly
- [ ] Time Attack: tiebreaker uses total time survived
- [ ] Endless: no round intro, starts immediately
- [ ] Endless: single round, game over on tag
- [ ] Endless: score submitted to leaderboard
- [ ] Endless: no sudden death
- [ ] Mode selector persists in MatchConfig
- [ ] Time limit selector shows only for Time Attack
- [ ] Best-of selector hides for Endless
- [ ] Build passes
