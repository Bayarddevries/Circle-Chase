# Circle Chase — Black Screen Bug Fix (2026-05-24)

## Summary

The Circle Chase game was completely non-functional — black screen after starting a round, no map, no players, no game UI. Three separate bugs were found and fixed across 3 commits, all deployed to GitHub Pages.

## Root Cause Analysis

### Bug 1: CSS Layout — Zero Height Canvas (Commit 7a5337d)

**Symptom:** The game canvas element had 0px height, causing a black screen despite the React app rendering the menu HUD correctly.

**Root Cause:** `GameCanvas.tsx` root `<div>` used `className="... h-screen ..."` which forces `height: 100vh`. This div sits inside `App.tsx`'s container which ALSO uses `h-screen flex flex-col justify-between`. The nested `h-screen` created a new 100vh formatting context, and the inner `flex-1` canvas container resolved to 0px because no space remained after the outer constraints.

**Fix:** Changed `h-screen` to `flex-1` on the GameCanvas root div (line 866):
```tsx
// Before
<div className="relative flex flex-col h-screen select-none overflow-hidden bg-[#020502]">
// After  
<div className="relative flex flex-col flex-1 select-none overflow-hidden bg-[#020502]">
```

**Verification:** Canvas now reports 1280×577px dimensions (previously 0×0).

---

### Bug 2: Bare Variable References in physicsStepLocal (Commit 5dd0749)

**Symptom:** Canvas had correct dimensions but all pixels were pure black (0,0,0,0). The game loop ran one frame then silently stopped.

**Root Cause:** During the Phase 1 refactor (extracting GameCanvas into 11 modules), the `physicsStepLocal()` function inside the game loop's `useEffect` was left with bare variable references that don't exist in its scope:

| Line | Broken Code | Fixed Code |
|------|-------------|------------|
| 392-393 | `hider.x, hider.y, seeker.x, seeker.y` | `hiderBallRef.current.x, hiderBallRef.current.y, seekerBallRef.current.x, seekerBallRef.current.y` |
| 399 | `for (const b of bumpers)` | `for (const b of bumpersRef.current)` |
| 404 | `updateOrbPulse(orb, time)` | `updateOrbPulse(orbRef.current, _time)` |
| 407 | `hider.x, hider.y, hider.vx, hider.vy` | `hiderBallRef.current.x, hiderBallRef.current.y, hiderBallRef.current.vx, hiderBallRef.current.vy` |
| 408 | `seeker.x, seeker.y, seeker.vx, seeker.vy` | `seekerBallRef.current.x, seekerBallRef.current.y, seekerBallRef.current.vx, seekerBallRef.current.vy` |

**Explanation:** The `draw()` function correctly aliases these as `const hider = hiderBallRef.current`, but `physicsStepLocal` never declared such aliases. Only the `Ref.current` objects exist in `physicsStepLocal`'s closure scope.

**Diagnostic Method:** Monkey-patched `window.requestAnimationFrame` with a try/catch wrapper to capture errors from the game loop. First error found: `"hider is not defined"`. After fixing those, second error: `"bumpers is not defined"`.

**Verification:** RAF error count dropped to 0. Canvas pixel analysis showed 156,501 non-background pixels (map walls, grid, bumpers, players all rendering).

---

### Bug 3: `time` Not in Scope (Commit 7b4bf5d)

**Symptom:**RAF error: `"time is not defined"` in physicsStepLocal's `updateOrbPulse` call.

**Root Cause:** The `physicsStepLocal` function receives its time parameter as `_time` (with underscore prefix to avoid shadowing), but line 404 referenced bare `time` which doesn't exist in that scope.

**Fix:** Changed `updateOrbPulse(orbRef.current, time)` to `updateOrbPulse(orbRef.current, _time)`.

---

## Verification Protocol

1. **Navigate** to https://bayarddevries.github.io/Circle-Chase/
2. **Patch RAF** with error-catching wrapper: `window._errs = []; window.requestAnimationFrame = function(cb) { const w = function(t) { try { cb(t); } catch(e) { window._errs.push(e.message); } }; return origRAF.call(this, w); };`
3. **Fill form** and click START CHASE (form submit via `document.querySelector('form').requestSubmit()`)
4. **Click** ENGAGE ROUND 1 (via `browser_click` with snapshot ref — button has no `id`)
5. **Wait** 1500ms for game loop to run several frames
6. **Verify** `window._errs` is empty (no JS errors)
7. **Check canvas pixels** via `ctx.getImageData()` — expect ~150k+ non-background pixels

## Deploy History

| Commit | Description | Workflow Run | Status |
|--------|-------------|--------------|--------|
| 7a5337d | fix: canvas container height - h-screen → flex-1 | #26376652568 | ✅ Success |
| 5dd0749 | fix: use ref.current for bumpers, orb, hider, seeker in physicsStepLocal | #26377141556 | ✅ Success |
| 7b4bf5d | fix: use _time parameter in updateOrbPulse call | #26377341556 | ✅ Success |

## Key Lessons for Future Refactoring

1. **After extracting modules, audit ALL variable references in moved functions.** The `draw()` function has `const hider = hiderBallRef.current` but `physicsStepLocal` doesn't — bare `hider` in physicsStepLocal is a ReferenceError.

2. **Game loop errors are silent.** `requestAnimationFrame` loops that throw on frame 1 stop rendering entirely but produce no visible error in normal browser use. Always instrument RAF with try/catch during development.

3. **Canvas pixel analysis confirms actual rendering.** Don't trust visual inspection alone — use `ctx.getImageData()` to check if pixels are being drawn beyond the background fill.

4. **CSS layout bugs can coexist with JS bugs.** The canvas had correct dimensions (from CSS fix) but was still all-black (from JS bug). Always verify both layers.

5. **browser_click works for buttons with `onClick` but NOT for form submissions.** Use `document.querySelector('form').requestSubmit()` for form buttons, `browser_click` for regular buttons.

6. **The ENGAGE ROUND 1 button has no `id` attribute.** Must use snapshot ref or text-based selector, not `getElementById('btn-overlay-next')` as previously assumed.
