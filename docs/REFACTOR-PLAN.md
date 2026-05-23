# GameCanvas Refactor Plan

## Goal

Split the 2301-line `GameCanvas.tsx` monolith into focused modules. This makes the codebase maintainable, reduces merge conflicts between agents, and is a prerequisite for clean sound/replay integration.

**Effort:** 3-4 hours
**Risk:** Medium — touching the core game file
**Strategy:** Extract modules without changing any game logic or behavior

---

## Current State

`src/components/GameCanvas.tsx` — 2301 lines containing:
- Canvas setup and DPI scaling
- Physics engine (sub-stepping, friction, collisions, bounce)
- Map generation (bumpers, hazards, orb placement)
- Input handling (mouse + touch slingshot)
- Camera system (lerp, zoom, screen shake)
- Rendering (balls, bumpers, hazards, particles, fog, minimap, HUD)
- Particle system (sparks, debris, shockwaves, trails)
- Sonar ping system
- Power-up logic
- AI opponent integration
- Game loop (requestAnimationFrame)

## Target Structure

```
src/game/
├── physics.ts       — Physics engine (movement, friction, collisions)
├── renderer.ts      — All canvas draw calls
├── input.ts         — Mouse/touch input, slingshot state
├── map.ts           — Map generation (bumpers, hazards, orb)
├── particles.ts     — Particle system (spawn, update, draw)
├── camera.ts        — Camera position, zoom, shake
├── fog.ts           — Fog of war rendering
├── minimap.ts       — Minimap rendering
├── sonar.ts         — Sonar ping logic and rendering
├── powerups.ts      — Power-up collision and effects
└── types.ts         — Game-specific types (not in src/types.ts)
```

`GameCanvas.tsx` becomes a thin orchestrator (~200 lines) that:
- Imports from the game modules
- Manages the requestAnimationFrame loop
- Passes refs/callbacks between modules
- Handles React lifecycle (mount, unmount, resize)

---

## Module Boundaries

### physics.ts — Pure Functions

```typescript
// All functions take state, return new state. No side effects.

export interface PhysicsState {
  hider: PlayerBall;
  seeker: PlayerBall;
  bumpers: NeonBumper[];
  hazards: HazardPatch[];
  particles: Particle[];
  slowMotion: number;  // 0-1, tag slow-mo factor
  shakeAmount: number;
}

export function stepPhysics(state: PhysicsState, dt: number): PhysicsState;
export function applyFriction(ball: PlayerBall, hazard: HazardPatch | null): void;
export function checkBumperCollision(ball: PlayerBall, bumper: NeonBumper): boolean;
export function checkWallCollision(ball: PlayerBall): void;
export function checkOrbCollision(ball: PlayerBall, orb: PowerUpOrb): boolean;
export function checkTag(hider: PlayerBall, seeker: PlayerBall): boolean;
export function substep(state: PhysicsState): PhysicsState;  // 5 substeps
```

### renderer.ts — Draw Functions

```typescript
// All functions take CanvasRenderingContext2D + game state. No state mutation.

export function clearScreen(ctx: CanvasRenderingContext2D, w: number, h: number): void;
export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void;
export function drawHazard(ctx: CanvasRenderingContext2D, hazard: HazardPatch): void;
export function drawBumper(ctx: CanvasRenderingContext2D, bumper: NeonBumper, time: number): void;
export function drawBall(ctx: CanvasRenderingContext2D, ball: PlayerBall, colorblind: boolean): void;
export function drawOrb(ctx: CanvasRenderingContext2D, orb: PowerUpOrb, time: number): void;
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void;
export function drawTrail(ctx: CanvasRenderingContext2D, trail: Vector2D[], color: string): void;
export function drawSlingshotLine(ctx: CanvasRenderingContext2D, from: Vector2D, to: Vector2D, power: number): void;
export function drawFog(ctx: CanvasRenderingContext2D, fogCanvas: HTMLCanvasElement): void;
export function drawMinimap(ctx: CanvasRenderingContext2D, state: MinimapState): void;
export function drawSonarPing(ctx: CanvasRenderingContext2D, ping: SonarPing): void;
export function applyScreenShake(ctx: CanvasRenderingContext2D, amount: number): void;
```

### input.ts — Input State Machine

```typescript
export interface InputState {
  isDragging: boolean;
  dragStart: Vector2D | null;
  dragCurrent: Vector2D | null;
  dragPower: number;     // 0-1 normalized
  dragAngle: number;     // radians
  ballStartPos: Vector2D | null;
}

export function createInputState(): InputState;
export function handlePointerDown(state: InputState, pos: Vector2D, ballPos: Vector2D): InputState;
export function handlePointerMove(state: InputState, pos: Vector2D): InputState;
export function handlePointerUp(state: InputState): { launched: boolean; power: number; angle: number };
export function getSlingshotVector(state: InputState): { dx: number; dy: number; power: number };
```

### map.ts — Map Generation

```typescript
export interface MapConfig {
  width: number;
  height: number;
  bumperCount: number;
  sandCount: number;
  iceCount: number;
  isSuddenDeath: boolean;
}

export function generateMap(config: MapConfig, hiderSpawn: Vector2D, seekerSpawn: Vector2D): {
  bumpers: NeonBumper[];
  hazards: HazardPatch[];
  orb: PowerUpOrb;
};
export function generateSuddenDeathMap(hiderSpawn: Vector2D, seekerSpawn: Vector2D): {
  bumpers: NeonBumper[];
  hazards: HazardPatch[];
  orb: PowerUpOrb;
};
export function respawnOrb(existing: PowerUpOrb, hiderSpawn: Vector2D): PowerUpOrb;
```

### particles.ts — Particle System

```typescript
export function spawnLaunchSparks(pos: Vector2D, angle: number, count: number): Particle[];
export function spawnBumperParticles(pos: Vector2D, color: string, count: number): Particle[];
export function spawnTagSparks(pos: Vector2D): Particle[];
export function spawnTagDebris(pos: Vector2D): Particle[];
export function spawnTagShockwave(pos: Vector2D): Particle[];
export function spawnGlassShards(pos: Vector2D): Particle[];
export function spawnOrbCollectParticles(pos: Vector2D, color: string): Particle[];
export function updateParticles(particles: Particle[], dt: number, max: number): Particle[];
export function spawnTrailPoint(ball: PlayerBall, trail: Vector2D[]): Vector2D[];
```

### camera.ts — Camera System

```typescript
export interface Camera {
  x: number;
  y: number;
  zoom: number;
  shake: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
}

export function createCamera(): Camera;
export function updateCamera(cam: Camera, hider: PlayerBall, seeker: PlayerBall, dt: number): Camera;
export function triggerShake(cam: Camera, amount: number): Camera;
export function applyCamera(ctx: CanvasRenderingContext2D, cam: Camera, canvasW: number, canvasH: number): void;
export function screenToWorld(cam: Camera, screenX: number, screenY: number, canvasW: number, canvasH: number): Vector2D;
```

### fog.ts — Fog of War

```typescript
export function createFogCanvas(width: number, height: number): HTMLCanvasElement;
export function updateFog(fogCanvas: HTMLCanvasElement, seeker: PlayerBall, hider: PlayerBall, coneAngle: number): void;
export function drawFog(ctx: CanvasRenderingContext2D, fogCanvas: HTMLCanvasElement): void;
```

### minimap.ts — Minimap

```typescript
export interface MinimapState {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

export function createMinimap(x: number, y: number, mapW: number, mapH: number): MinimapState;
export function drawMinimap(ctx: CanvasRenderingContext2D, state: MinimapState, gameState: any): void;
```

### sonar.ts — Sonar

```typescript
export function createSonarPing(pos: Vector2D): SonarPing;
export function updateSonarPing(ping: SonarPing, dt: number): SonarPing;
export function drawSonarPing(ctx: CanvasRenderingContext2D, ping: SonarPing): void;
export function shouldTriggerSonar(lastTime: number, interval: number): boolean;
```

### powerups.ts — Power-Up Logic

```typescript
export function checkOrbCollection(ball: PlayerBall, orb: PowerUpOrb): boolean;
export function activatePowerUp(type: PowerUpType, hider: PlayerBall, seeker: PlayerBall): PowerUpEffect;
export function applyPowerUpEffects(hider: PlayerBall, seeker: PlayerBall, active: ActivePowerUp[]): void;
export function isPowerUpExpired(powerUp: ActivePowerUp, frameCount: number): boolean;
```

---

## Refactor Strategy

### Phase 1: Create module stubs (no behavior change)

1. Create `src/game/` directory
2. Create each module file with the function signatures above
3. Each function body is a `throw new Error('not implemented')` — this ensures TypeScript catches any missed calls
4. Build passes (modules exist but aren't imported yet)

### Phase 2: Extract one module at a time

For each module:
1. Copy the relevant functions from GameCanvas.tsx into the module
2. Replace the function body in GameCanvas.tsx with an import + call
3. Run `npm run build` — must pass
4. Verify game still works in browser

**Order (safest first):**
1. `particles.ts` — most self-contained, easiest to verify
2. `camera.ts` — clear inputs/outputs
3. `input.ts` — well-defined state machine
4. `map.ts` — generation logic is already somewhat separated
5. `minimap.ts` — rendering only, no game logic
6. `fog.ts` — rendering only
7. `sonar.ts` — logic + rendering
8. `powerups.ts` — collision + effect logic
9. `renderer.ts` — all draw functions (largest module)
10. `physics.ts` — last, since it's the most interconnected

### Phase 3: Thin GameCanvas.tsx

After all extractions, GameCanvas.tsx should contain:
- React component wrapper
- Canvas ref + DPI setup
- requestAnimationFrame loop
- Module initialization
- Event handler wiring (passes input to modules, reads output for rendering)
- ~150-200 lines total

### Phase 4: Verify

- [ ] `npm run build` passes
- [ ] Game plays identically to before (no behavior changes)
- [ ] All power-ups work
- [ ] AI opponent works
- [ ] Fog of war works
- [ ] Minimap works
- [ ] Sonar works
- [ ] Particles render correctly
- [ ] Screen shake works
- [ ] Touch input works
- [ ] No console errors

---

## Rules

1. **No behavior changes.** This is a pure refactor. If a function works, don't "improve" it.
2. **No new features.** Don't add sound hooks, replay recording, etc. That comes after.
3. **Match existing style.** Same variable names, same comments, same patterns.
4. **One module at a time.** Don't extract two modules simultaneously.
5. **Build after each module.** If build fails, fix before moving on.
6. **No `any` types.** The game/types.ts module can define shared internal types.
7. **Keep React out of game modules.** They should be framework-free TypeScript. GameCanvas.tsx is the only file that imports React.

---

## File Summary

| File | Action | Purpose |
|---|---|---|
| `src/game/physics.ts` | Create | Physics engine |
| `src/game/renderer.ts` | Create | All canvas draw calls |
| `src/game/input.ts` | Create | Input state machine |
| `src/game/map.ts` | Create | Map generation |
| `src/game/particles.ts` | Create | Particle system |
| `src/game/camera.ts` | Create | Camera system |
| `src/game/fog.ts` | Create | Fog of war |
| `src/game/minimap.ts` | Create | Minimap |
| `src/game/sonar.ts` | Create | Sonar ping |
| `src/game/powerups.ts` | Create | Power-up logic |
| `src/game/types.ts` | Create | Internal game types |
| `src/components/GameCanvas.tsx` | Modify | Thin orchestrator (~200 lines) |

---

## Why This Order Matters

The refactor unblocks everything else:
- **Sound:** Clean event hooks in modular code
- **Replay:** Physics module can record state snapshots
- **Map templates:** Map module already has generation logic separated
- **Game modes:** Physics + powerups are modular, easy to add variants
- **Multiple agents:** Different agents can work on different modules without merge conflicts
