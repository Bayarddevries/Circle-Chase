# Known Issues

## 🔴 Active

### Gravity Well — Continuous Pull (UNSOLVED)
**File:** `src/components/GameCanvas.tsx` (orb collect handler), `src/game/physics.ts`
**Status:** Investigating — another agent to pick this up

**Symptoms:** After the Seeker collects the gravity orb, the Hider is continuously pulled toward the Seeker until the tag is made. Makes the power-up unfair/guaranteed tag.

**What was tried:**
1. Removed continuous gravity pull from `physics.ts` ✓
2. Replaced with single burst impulse (velocity-based) → still too strong
3. Scaled impulse to match player launch speeds (5-15) → persistent drift due to low friction (`FRICTION_BASE = 0.982`, effectively 0.91/frame with 5 sub-steps)
4. Replaced with teleport (60-150px position offset) → **still reports continuous pull**

**Likely root cause:** Something is re-triggering the gravity effect every frame or physics step. The teleport code only fires inside `onOrbCollect`, but there may be:
- A stale `activePowerUp === 'gravity'` check somewhere still applying force
- The orb collect callback firing multiple times
- A duplicate code path not yet found

**Debug steps needed:**
1. Add `console.log('GRAVITY TELEPORT', h.x, h.y)` inside the teleport block (~line 490 GameCanvas.tsx)
2. Add `console.log('ORB COLLECT', orbType)` inside the `onOrbCollect` callback
3. Check browser console for repeated firings
4. Search for ALL occurrences of `'gravity'` across the codebase and verify none apply continuous force
