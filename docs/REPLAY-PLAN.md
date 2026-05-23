# Replay System Plan

## Goal

Record gameplay and allow players to replay matches. This enables sharing highlights, analyzing plays, and creates content potential for marketing.

**Effort:** 4-5 hours
**No new npm packages**

---

## Current State

No recording exists. Game state is ephemeral — once a round ends, the physics state is gone.

---

## Design

### What to Record

Record a compact snapshot of game state at fixed intervals (not every frame — too much data):

```typescript
export interface ReplayFrame {
  timestamp: number;       // ms from round start
  hiderX: number;
  hiderY: number;
  seekerX: number;
  seekerY: number;
  hiderVX: number;
  hiderVY: number;
  seekerVX: number;
  seekerVY: number;
  event?: ReplayEvent;     // optional event at this frame
}

export type ReplayEvent =
  | { type: 'launch'; player: PlayerRole; power: number; angle: number }
  | { type: 'bumper_hit'; bumperId: string; combo: number }
  | { type: 'wall_bounce' }
  | { type: 'tag' }
  | { type: 'power_up_collect'; powerUpType: PowerUpType }
  | { type: 'power_up_activate'; powerUpType: PowerUpType }
  | { type: 'sonar_ping' }
  | { type: 'sand_enter' }
  | { type: 'ice_enter' }
  | { type: 'turn_end'; turnNumber: number };

export interface Replay {
  id: string;              // UUID
  date: string;            // ISO date
  config: MatchConfig;
  rounds: ReplayRound[];
  duration: number;        // total ms
}

export interface ReplayRound {
  roundIndex: number;
  p1Role: PlayerRole;
  p2Role: PlayerRole;
  frames: ReplayFrame[];
  winner: string;
  turnsSurvived: number;
  score: ScoreBreakdown;
}
```

### Recording Strategy

**Frame rate:** Record 10 frames per second (every 6 frames at 60fps). This is enough for smooth playback while keeping data small.

**Estimated data size:**
- Per frame: ~50 bytes (8 numbers + optional event)
- Per round (30 seconds): 300 frames × 50 bytes = 15KB
- Per match (5 rounds): ~75KB
- With JSON overhead: ~100KB per match

**Storage:** localStorage (same as meta-progression). Keep last 10 replays, evict oldest.

### Recording Implementation

```typescript
// In GameCanvas.tsx — add recording state
const [recording, setRecording] = useState(false);
const [currentReplay, setCurrentReplay] = useState<ReplayRound | null>(null);
const frameCounter = useRef(0);
const RECORD_INTERVAL = 6;  // record every 6 frames (10fps at 60fps)

// In game loop
function gameLoop() {
  // ...existing physics and rendering...

  if (recording && frameCounter.current % RECORD_INTERVAL === 0) {
    recordFrame();
  }
  frameCounter.current++;
}

function recordFrame() {
  if (!currentReplay) return;

  const frame: ReplayFrame = {
    timestamp: performance.now() - roundStartTime,
    hiderX: hider.x,
    hiderY: hider.y,
    seekerX: seeker.x,
    seekerY: seeker.y,
    hiderVX: hider.vx,
    hiderVY: hider.vy,
    seekerVX: seeker.vx,
    seekerVY: seeker.vy,
  };

  currentReplay.frames.push(frame);
}

// Event recording — call from existing event handlers
function recordEvent(event: ReplayEvent) {
  if (!currentReplay || currentReplay.frames.length === 0) return;
  // Attach event to the most recent frame
  currentReplay.frames[currentReplay.frames.length - 1].event = event;
}

// Start recording at round start
function startRecording() {
  setCurrentReplay({
    roundIndex: currentRound,
    p1Role: p1Role,
    p2Role: p2Role,
    frames: [],
    winner: '',
    turnsSurvived: 0,
    score: emptyScore(),
  });
  setRecording(true);
}

// Stop recording at round end
function stopRecording(turns: number, winner: string, score: ScoreBreakdown) {
  if (!currentReplay) return;
  currentReplay.turnsSurvived = turns;
  currentReplay.winner = winner;
  currentReplay.score = score;
  setRecording(false);
  return currentReplay;
}
```

### Event Hook Points

Add `recordEvent()` calls to existing event handlers in GameCanvas:

| Event | Location | Call |
|---|---|---|
| Launch | Slingshot release | `recordEvent({ type: 'launch', player, power, angle })` |
| Bumper hit | Bumper collision | `recordEvent({ type: 'bumper_hit', bumperId, combo })` |
| Wall bounce | Wall collision | `recordEvent({ type: 'wall_bounce' })` |
| Tag | Tag detection | `recordEvent({ type: 'tag' })` |
| Power-up collect | Orb collision | `recordEvent({ type: 'power_up_collect', powerUpType })` |
| Power-up activate | Power-up handler | `recordEvent({ type: 'power_up_activate', powerUpType })` |
| Sonar ping | Sonar timer | `recordEvent({ type: 'sonar_ping' })` |
| Sand enter | Sand friction | `recordEvent({ type: 'sand_enter' })` |
| Ice enter | Ice friction | `recordEvent({ type: 'ice_enter' })` |
| Turn end | Turn transition | `recordEvent({ type: 'turn_end', turnNumber })` |

---

## Playback System

### Playback Component

Create a new component `ReplayViewer.tsx`:

```typescript
interface ReplayViewerProps {
  replay: Replay;
  onClose: () => void;
}

export function ReplayViewer({ replay, onClose }: ReplayViewerProps) {
  // Canvas-based playback
  // Controls: play/pause, speed (0.5x, 1x, 2x), scrubber
  // Renders the game state from recorded frames
}
```

### Playback Controls

```
[▶ Play] [⏸ Pause] [⏮ -10s] [⏭ +10s]
Speed: [0.5x] [1x] [2x]
Scrubber: |═══════●════════════════| 0:45 / 2:30
Round: [1] [2] [3] [4] [5]
[✕ Close]
```

### Playback Rendering

The playback renderer is a simplified version of the game renderer:

```typescript
function renderReplayFrame(ctx: CanvasRenderingContext2D, frame: ReplayFrame, round: ReplayRound) {
  // Draw background
  drawBackground(ctx, MAP_WIDTH, MAP_HEIGHT);

  // Draw map elements (bumpers, hazards) — these are static per round
  // Note: map layout needs to be stored in the replay too, or regenerated from seed

  // Draw balls at recorded positions
  const isP1Hider = round.p1Role === 'hider';
  const hiderBall = { x: frame.hiderX, y: frame.hiderY, radius: HIDER_RADIUS };
  const seekerBall = { x: frame.seekerX, y: frame.seekerY, radius: SEEKER_RADIUS };

  drawBall(ctx, hiderBall, '#38bdf8');
  drawBall(ctx, seekerBall, '#d97706');

  // Draw event indicators
  if (frame.event) {
    drawEventIndicator(ctx, frame.event, frame);
  }

  // Draw timestamp
  drawTimestamp(ctx, frame.timestamp);
}
```

### Interpolation

For smooth playback, interpolate between recorded frames:

```typescript
function interpolateFrames(a: ReplayFrame, b: ReplayFrame, t: number): ReplayFrame {
  return {
    timestamp: a.timestamp + (b.timestamp - a.timestamp) * t,
    hiderX: a.hiderX + (b.hiderX - a.hiderX) * t,
    hiderY: a.hiderY + (b.hiderY - a.hiderY) * t,
    seekerX: a.seekerX + (b.seekerX - a.seekerX) * t,
    seekerY: a.seekerY + (b.seekerY - a.seekerY) * t,
    // Velocities not needed for visual playback
  };
}
```

---

## Map Seed Problem

The map is randomly generated. To replay accurately, we need to either:

**Option A: Store the map seed (recommended)**
- Add a `seed` field to `ReplayRound`
- Use a seeded random number generator for map generation
- On playback, regenerate the map from the seed

**Option B: Store the entire map**
- Add `bumpers` and `hazard` arrays to `ReplayRound`
- More data but simpler playback

**Recommendation:** Option A. A seed is just one number. Map generation is deterministic from the seed.

```typescript
// Simple seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// In map generation, use seeded RNG instead of Math.random()
const rng = mulberry32(seed);
const x = padding + rng() * (mapW - padding * 2);
```

---

## Storage

```typescript
// src/hooks/useReplays.ts
const STORAGE_KEY = 'chase-tag-replays';
const MAX_REPLAYS = 10;

export function useReplays() {
  const [replays, setReplays] = useState<Replay[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setReplays(JSON.parse(stored));
  }, []);

  const saveReplay = (replay: Replay) => {
    const updated = [replay, ...replays].slice(0, MAX_REPLAYS);
    setReplays(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteReplay = (id: string) => {
    const updated = replays.filter(r => r.id !== id);
    setReplays(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { replays, saveReplay, deleteReplay };
}
```

---

## UI Integration

### Match Overlay

Add a "Watch Replay" button to the match over screen:

```
[🏆 Match Complete]
Alice wins 3-2!

[▶ Watch Replay] [📋 View Rounds] [🏠 Main Menu]
```

### Replay List

Add a "Replays" button to MainMenu (next to Shop/Leaderboard/Profile):

```
[🎬 Replays]
```

Show a modal with the last 10 replays:

```
Recent Replays
──────────────────────────────
▶ Alice vs Bob — 5 rounds — 2:34 — Today 14:32
▶ Alice vs CPU — 3 rounds — 1:15 — Today 14:20
▶ Bob vs Alice — 7 rounds — 4:12 — Yesterday
──────────────────────────────
[Clear All]
```

---

## File Summary

| File | Action | Purpose |
|---|---|---|
| `src/types.ts` | Modify | Add Replay, ReplayRound, ReplayFrame, ReplayEvent types |
| `src/components/GameCanvas.tsx` | Modify | Add recording logic, event hooks |
| `src/components/ReplayViewer.tsx` | Create | Playback component with controls |
| `src/components/ReplayList.tsx` | Create | Replay browser modal |
| `src/hooks/useReplays.ts` | Create | Replay storage and management |
| `src/game/map.ts` | Modify | Add seeded RNG for deterministic map generation |
| `src/components/MatchOverlay.tsx` | Modify | Add "Watch Replay" button |
| `src/components/MainMenu.tsx` | Modify | Add "Replays" button |

---

## Implementation Order

1. Add replay types to `types.ts`
2. Add seeded RNG to `map.ts`
3. Add recording logic to `GameCanvas.tsx` (frame recording + event hooks)
4. Create `useReplays.ts` hook
5. Create `ReplayViewer.tsx` component
6. Create `ReplayList.tsx` modal
7. Add "Watch Replay" to MatchOverlay
8. Add "Replays" button to MainMenu
9. Test: record a match, play it back, verify accuracy
10. Test: storage persistence across page reloads
11. Test: replay eviction (max 10)
12. Build and verify

---

## Testing Checklist

- [ ] Recording starts at round start
- [ ] Recording stops at round end
- [ ] Frames recorded at ~10fps
- [ ] All event types recorded correctly
- [ ] Replay plays back smoothly
- [ ] Playback controls work (play/pause, speed, scrubber)
- [ ] Round switching works
- [ ] Map regenerates identically from seed
- [ ] Ball positions match original gameplay
- [ ] Event indicators appear at correct times
- [ ] Replays persist in localStorage
- [ ] Max 10 replays enforced (oldest evicted)
- [ ] Delete replay works
- [ ] "Watch Replay" button appears on match over
- [ ] Replay list shows all recorded matches
- [ ] Build passes
