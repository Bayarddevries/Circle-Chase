# Power-up Redesign Plan

## Goal
Make power-ups worth detouring for: more on the map, game-changing effects, visible from across the map.

---

## 1. Constants (`src/constants.ts`)

### Changes:
- `ORB_COUNT_MIN = 3` → `6`
- `ORB_COUNT_MAX = 4` → `8`
- **Remove:** `CLOAK_DURATION`, `MAGNET_DURATION`, `MAGNET_PULL_STRENGTH`, `LASER_SPEED_MULT`
- **Add:**
  - `ROCKET_SPEED_MULT = 3.0` — 3x launch velocity
  - `GRAVITY_PULL = 0.08` — pull force per substep on hider toward seeker
  - `EMP_FREEZE_MS = 1500` — freeze duration in ms
  - `VAMPIRE_BONUS = 1` — extra scoring point stolen from hider

---

## 2. Types (`src/types.ts`)

**Change power-up type union:**
```ts
'iron' | 'rocket' | 'gravity' | 'vampire' | 'superball' | 'emp'
```

---

## 3. Map Generation (`src/game/map.ts`)

- Replace `allTypes` array with new types
- Orbs already distribute horizontally across map (`regionX = (i / orbCount) * mapWidth`), this is good
- No further changes needed — distribution logic is already in place

---

## 4. Visual Effects (`src/game/powerups.ts`) — Big Update

### Current:
- Outer pulse ring
- Glowing inner core
- Static text label above orb

### New visual options (pick which to implement):

**Option A: Orbiting Name Ring**
- The power-up name rotates in a circle around the orb (like a label on a tether)
- Radius: orb.radius + 28px
- Speed: one full rotation per 3 seconds
- This makes the label visible from all angles and looks dynamic

**Option B: Enhanced Pulse + Glow**
- Pulse ring oscillates faster and wider (current pulse is subtle, make it 2x amplitude)
- Add a secondary outer glow ring that pulses opposite to the main ring (breathes)

**Option C: Particle Drip**
- 2-3 small particles spawn per second, drifting upward/sideways from the orb
- Each particle has the orb's color, fades out over 1.5s
- Subtle but catches peripheral vision

**Option D: Vertical Beacon Beam**
- A faint vertical light beam (line from orb down to map surface + up into sky)
- Think item pickup glow in fighting games
- Thin, translucent, pulses with the orb

**Option E: Color Wave**
- The orb's glow cycles slowly through analogous colors (e.g., iron stays gray, but rocket shifts red→orange→yellow)
- Combined with orbital label for maximum visibility

**My recommendation: A + C** — orbiting name + subtle particle drip. Readable, recognizable, cheap to render.

### Color updates for new types:
```
iron:      '#6b7280'  (gray)
rocket:    '#ef4444'  (red)
gravity:   '#a855f7'  (purple)
vampire:   '#e11d48'  (crimson)
superball: '#22c55e'  (green)
emp:       '#f59e0b'  (amber)
```

---

## 5. Physics (`src/game/physics.ts`)

### Gravity Well (new):
During seeker's turn, if `activePowerUp === 'gravity'`:
- Each substep, apply a small pull force on the hider ball toward the seeker
- `hider.vx += (seeker.x - hider.x) * GRAVITY_PULL`
- `hider.vy += (seeker.y - hider.y) * GRAVITY_PULL`
- This gently curves the hider's trajectory toward the seeker over the course of a fling
- Single-use, consumed after seeker flings (the current turn)

Implementation location: inside `physicsStep()`, after friction but before stop threshold. Check `state.activePowerUp === 'gravity'`.

### EMP Freeze (new):
When seeker with `activePowerUp === 'emp'` hits a bumper:
- Set `state.hiderFrozenTimer = EMP_FREEZE_FRAMES` (90 frames @ 60fps)
- While timer > 0, hider's velocity is forced to 0 on every substep
- Consume the power-up

Implementation: Add `hiderFrozenTimer` to `PhysicsState`. In the bumper collision handler, if `isSeeker && activePowerUp === 'emp'`, set the timer. In the physics loop, if `hiderFrozenTimer > 0`, zero out hider velocity and decrement timer.

### Superball (keep, no change):
Already works. `BOUNCE_REST_SUPERBALL = 1.0`, `BUMPER_REST_SUPERBALL = 3.0`, `BUMPER_BOOST_SUPERBALL = 1.6`.

### Iron (keep, no change):
Already works. Ignores sand friction.

---

## 6. GameCanvas (`src/components/GameCanvas.tsx`)

### Rocket Burst:
Location: where seeker's launch velocity is applied.
- After `calculateLaunch()` returns for seeker, check `if (activePowerUp === 'rocket')`
- Multiply `vx`, `vy` by `ROCKET_SPEED_MULT` (3x)
- Clear `activePowerUp` immediately (single-use per fling)

### Vampire:
Location: inside `triggerTagEvent()`, before scoring.
- Check `if (activePowerUp === 'vampire')`
- Add `VAMPIRE_BONUS` to seeker score breakdown
- Clear `activePowerUp`
- Display "+1 VAMPIRE" score message

### EMP Freeze (GameCanvas side):
- Add `hiderFrozenRef = useRef(0)` — tracks remaining freeze frames
- Pass `hiderFrozenRef` to physics state
- In the bumper hit callback, if `activePowerUp === 'emp'`, set `hiderFrozenRef.current = 90`, clear `activePowerUp`, show "EMP FREEZE!" message
- Reset `hiderFrozenRef.current = 0` in `generateMap()` on new round

---

## 7. Physics State (`src/game/physics.ts`)

Add to `PhysicsState`:
```
hiderFrozenRef: { current: number };
```

In `physicsStep`, right after the movement substep:
```
if (state.hiderFrozenRef.current > 0) {
  hider.vx = 0;
  hider.vy = 0;
  state.hiderFrozenRef.current--;
}
```

---

## 8. Help Manual (`src/components/HelpManual.tsx`)

Rewrite the power-up section:

**Title:** "Chaser Power-ups"
**Description:** Rewrite to match new types.

New grid (2 columns, single-use per pickup):
```
1. Iron Ball     — Plow through sand unaffected
2. Rocket Burst  — Next launch at 3x speed (instant gap-closer)
3. Gravity Well  — Pulls the Runner toward you mid-flight
4. Vampire       — Steal 1 point from Runner on tag
5. Superball     — Ultra-bounce off walls and bumpers
6. EMP Freeze    — Bumper hit freezes Runner in place for 1.5s
```

Also update the modal border colors from `amber-500/30` to `emerald-500/30` to match the new theme.

---

## 9. Implementation Order

1. `types.ts` — PowerUpType union (done)
2. `constants.ts` — orb count, new constants, remove dead ones
3. `map.ts` — allTypes array
4. `powerups.ts` — colors + orbiting name + particle drip
5. `physics.ts` — gravity well + EMP freeze
6. `GameCanvas.tsx` — rocket burst + vampire + EMP ref + pass to physics state
7. `HelpManual.tsx` — new docs + theme update
8. Build + test