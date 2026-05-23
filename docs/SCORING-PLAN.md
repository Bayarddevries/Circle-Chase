# Scoring & Combos Plan

## Goal

Add depth to the scoring system with bonuses for skillful play. This makes the game more rewarding and gives players something to optimize beyond "survive longer."

**Effort:** 2-3 hours
**No new npm packages**

---

## Current State

Scoring is simple:
- Hider earns 1 point per turn survived
- Roles alternate each round
- Best-of series wins the match

This works but has no granularity. A Hider who barely survives 5 turns scores the same as one who dominates for 5 turns with style.

---

## New Scoring System

### Base Scoring (unchanged)

- Hider: 1 point per turn survived

### New Bonuses

#### 1. Distance Bonus

Reward Hiders who stay far from the Seeker.

```typescript
// Calculate average distance between Hider and Seeker over the round
const avgDistance = totalDistance / turnsSurvived;
const maxPossibleDistance = Math.sqrt(MAP_WIDTH ** 2 + MAP_HEIGHT ** 2);
const distanceRatio = avgDistance / maxPossibleDistance;

// Bonus: up to 50 points based on average distance
const distanceBonus = Math.floor(distanceRatio * 50);
```

**Example:** If Hider stays at 60% of max distance on average → 30 bonus points.

**Tracking:** In GameCanvas, accumulate `totalDistance` each frame during the Hider's turn. Divide by turns at round end.

#### 2. Quick Tag Bonus

Reward Seekers who tag quickly.

```typescript
// If Seeker tags within first 3 turns
const quickTagBonus = turnsSurvived <= 3 ? 25 : 0;
```

**Rationale:** Fast tags are skillful. A Seeker who reads the Hider's movement and strikes fast should be rewarded.

#### 3. Bumper Combo

Reward consecutive bumper bounces in a single launch.

```typescript
// Track bumper hits within a single ball movement (between launch and stop)
let comboCount = 0;
let comboMultiplier = 1;

// On bumper hit during movement:
comboCount++;
comboMultiplier = 1 + (comboCount - 1) * 0.5;  // 1x, 1.5x, 2x, 2.5x...

// At end of movement, award combo points
const comboBonus = Math.floor((comboMultiplier - 1) * 10);  // 0, 5, 10, 15...
```

**Example:** 3 bumper bounces in one launch → 2x multiplier → 10 bonus points.

**Visual feedback:** Show "COMBO x2!" text at the ball position when combo ≥ 2.

#### 4. Near-Miss Bonus

Reward Seekers who almost tag the Hider.

```typescript
// Track minimum distance between balls during Seeker's turn
if (currentDistance < minDistance) {
  minDistance = currentDistance;
}

// If closest approach was within 50px but no tag occurred
const nearMissBonus = minDistance < 50 ? 10 : 0;
```

**Visual feedback:** Show "CLOSE!" text when balls pass within 50px.

#### 5. Power-Up Efficiency Bonus

Reward collecting and using power-ups.

```typescript
// Already tracked: powerUpCollected boolean
// New: did the power-up contribute to the outcome?
const powerUpBonus = powerUpCollected ? 15 : 0;
```

#### 6. Survival Streak Bonus

Reward Hiders who survive many turns across consecutive rounds.

```typescript
// Track consecutive rounds where Hider survived ≥ 10 turns
if (turnsSurvived >= 10 && hiderRole === currentPlayer) {
  survivalStreak++;
} else {
  survivalStreak = 0;
}

const streakBonus = survivalStreak >= 2 ? survivalStreak * 10 : 0;
```

**Example:** 3 consecutive rounds with 10+ turns → 30 bonus points.

---

## Score Display

### Round Over Screen

Update the round over display to show the breakdown:

```
Round 3 Complete

Hider: Alice (Runner)
Seeker: Bob (Chaser)

Base Score:     12 points
Distance Bonus:  8 points
Bumper Combo:    5 points
Power-Up Bonus:  15 points
─────────────────────────
Total:           40 points

[COMBO x3!] [CLOSE!] [QUICK TAG!]
```

### HUD Additions

During gameplay, show small floating text for combos and near-misses:

- "COMBO x2!" — amber text at ball position, fades over 1s
- "CLOSE!" — cyan text at midpoint between balls, fades over 0.5s
- "STREAK x3!" — emerald text at top of screen, fades over 2s

These are non-intrusive and don't block the gameplay area.

---

## New Types

```typescript
// types.ts — extend RoundMeta
export interface RoundMeta {
  turnsSurvived: number;
  powerUpCollected: boolean;
  bumperHits: number;
  tagTurn: number;
  // New fields
  avgDistance?: number;
  maxCombo?: number;
  nearMiss?: boolean;
  quickTag?: boolean;
}

// types.ts — new interface for detailed score
export interface ScoreBreakdown {
  base: number;
  distanceBonus: number;
  quickTagBonus: number;
  comboBonus: number;
  nearMissBonus: number;
  powerUpBonus: number;
  streakBonus: number;
  total: number;
}
```

---

## New Constants

```typescript
// constants.ts
export const DISTANCE_BONUS_MAX = 50;        // max points from distance
export const QUICK_TAG_THRESHOLD = 3;        // turns
export const QUICK_TAG_BONUS = 25;           // points
export const COMBO_BASE_MULTIPLIER = 1.0;
export const COMBO_INCREMENT = 0.5;          // per consecutive hit
export const COMBO_BONUS_PER_STEP = 10;      // points per 0.5x above 1x
export const NEAR_MISS_THRESHOLD = 50;       // pixels
export const NEAR_MISS_BONUS = 10;           // points
export const POWER_UP_BONUS = 15;            // points
export const SURVIVAL_STREAK_THRESHOLD = 10; // turns per round
export const SURVIVAL_STREAK_BONUS = 10;     // points per streak level
```

---

## Implementation in GameCanvas.tsx

### Tracking Variables

```typescript
// Add to game state
let totalDistance = 0;
let distanceSamples = 0;
let minDistance = Infinity;
let currentCombo = 0;
let maxCombo = 0;
let nearMissTriggered = false;
let hiderTurnDistances: number[] = [];
```

### In Game Loop

```typescript
// During Hider's turn — track distance
if (currentTurn === 'hider') {
  const dist = Math.hypot(hider.x - seeker.x, hider.y - seeker.y);
  totalDistance += dist;
  distanceSamples++;
}

// During Seeker's turn — track min distance
if (currentTurn === 'seeker') {
  const dist = Math.hypot(hider.x - seeker.x, hider.y - seeker.y);
  if (dist < minDistance) minDistance = dist;
  if (dist < NEAR_MISS_THRESHOLD && !nearMissTriggered) {
    nearMissTriggered = true;
    showFloatingText('CLOSE!', midpoint(hider, seeker), '#38bdf8');
  }
}

// On bumper hit — track combo
function onBumperHit() {
  currentCombo++;
  if (currentCombo > maxCombo) maxCombo = currentCombo;
  if (currentCombo >= 2) {
    showFloatingText(`COMBO x${currentCombo}!`, ballPos, '#d97706');
  }
}

// On ball stop — reset combo
function onBallStop() {
  currentCombo = 0;
}
```

### Score Calculation

```typescript
function calculateScore(meta: RoundMeta, streak: number): ScoreBreakdown {
  const base = meta.turnsSurvived;
  const distanceBonus = meta.avgDistance
    ? Math.floor((meta.avgDistance / Math.sqrt(MAP_WIDTH ** 2 + MAP_HEIGHT ** 2)) * DISTANCE_BONUS_MAX)
    : 0;
  const quickTagBonus = meta.quickTag ? QUICK_TAG_BONUS : 0;
  const comboBonus = meta.maxCombo
    ? Math.floor((meta.maxCombo - 1) * COMBO_INCREMENT * COMBO_BONUS_PER_STEP)
    : 0;
  const nearMissBonus = meta.nearMiss ? NEAR_MISS_BONUS : 0;
  const powerUpBonus = meta.powerUpCollected ? POWER_UP_BONUS : 0;
  const streakBonus = streak >= 2 ? streak * SURVIVAL_STREAK_BONUS : 0;

  return {
    base,
    distanceBonus,
    quickTagBonus,
    comboBonus,
    nearMissBonus,
    powerUpBonus,
    streakBonus,
    total: base + distanceBonus + quickTagBonus + comboBonus + nearMissBonus + powerUpBonus + streakBonus,
  };
}
```

---

## Meta-Progression Integration

Update `useMetaProgression.ts` to track new stats:

```typescript
export interface MetaState {
  // ...existing fields
  totalBumperCombos: number;      // lifetime combo count
  bestCombo: number;              // highest combo ever
  totalNearMisses: number;        // lifetime near-miss count
  quickTags: number;              // already exists
  totalDistanceBonus: number;     // lifetime distance bonus earned
  bestSurvivalStreak: number;     // best consecutive 10+ turn rounds
}
```

New badges:
- **Bounce Master:** Achieve a 5-hit bumper combo
- **Ghost:** Survive 20 turns in a single round
- **Sharpshooter:** Get 3 quick tags in one match
- **Evasive:** Earn 100+ distance bonus points in one round
- **Streak Runner:** Survive 10+ turns for 5 consecutive rounds

---

## File Summary

| File | Action | Purpose |
|---|---|---|
| `src/types.ts` | Modify | Extend RoundMeta, add ScoreBreakdown |
| `src/constants.ts` | Modify | Add scoring constants |
| `src/components/GameCanvas.tsx` | Modify | Add tracking vars, combo/near-miss logic, floating text |
| `src/components/MatchOverlay.tsx` | Modify | Show score breakdown on round over |
| `src/hooks/useMetaProgression.ts` | Modify | Track new stats, add new badges |
| `src/components/ProfileModal.tsx` | Modify | Display new stats |

---

## Implementation Order

1. Add types and constants
2. Add tracking variables to GameCanvas
3. Implement distance tracking
4. Implement bumper combo tracking
5. Implement near-miss detection
6. Implement `calculateScore()` function
7. Add floating text rendering for combos/near-misses
8. Update MatchOverlay to show score breakdown
9. Update meta-progression with new stats
10. Add new badges
11. Test in browser
12. Build and verify

---

## Testing Checklist

- [ ] Base scoring unchanged (1 point per turn)
- [ ] Distance bonus scales with average distance (0-50 points)
- [ ] Quick Tag bonus awarded when tag occurs in ≤3 turns
- [ ] Bumper combo multiplier increases with consecutive hits
- [ ] "COMBO x2!" text appears on 2+ bumper hits
- [ ] "CLOSE!" text appears when balls pass within 50px
- [ ] Near-miss bonus awarded once per Seeker turn
- [ ] Power-up bonus awarded when orb collected
- [ ] Streak bonus awarded after 2+ consecutive 10-turn rounds
- [ ] Score breakdown shows all components on round over
- [ ] New stats tracked in meta-progression
- [ ] New badges earnable
- [ ] Build passes
