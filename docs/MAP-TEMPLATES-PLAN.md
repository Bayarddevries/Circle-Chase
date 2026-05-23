# Map Template System Plan

## Goal

Replace the purely random map generator with a template system that produces varied, strategically distinct layouts. This is a v2.0 item that directly impacts replayability.

**Effort:** 4-6 hours
**No new npm packages**

---

## Current State

`GameCanvas.tsx` has a `generateMap()` function that:
- Places bumpers randomly with minimum separation
- Places sand/ice hazards randomly
- Places a power-up orb near center
- Uses constants from `constants.ts` for counts and spacing

The result is serviceable but repetitive. Every map feels the same after a few rounds.

---

## Target System

### Template Data Structure

```typescript
// src/game/map.ts

export type MapTemplateId = 'open_arena' | 'bumper_maze' | 'sandstorm' | 'ice_rink' | 'symmetry' | 'random';

export interface MapTemplate {
  id: MapTemplateId;
  name: string;
  description: string;
  bumperCount: number;
  bumperLayout: 'random' | 'grid' | 'corridors' | 'clusters' | 'symmetric';
  sandCount: number;
  iceCount: number;
  hazardLayout: 'random' | 'corridors' | 'quadrants' | 'dominated';
  orbBias: 'center' | 'hider' | 'seeker' | 'neutral';
  wallPadding: number;  // extra space from walls
}
```

### Template Definitions

```typescript
export const MAP_TEMPLATES: Record<MapTemplateId, MapTemplate> = {
  open_arena: {
    id: 'open_arena',
    name: 'Open Arena',
    description: 'Sparse bumpers, few hazards. Pure skill-based chasing.',
    bumperCount: 3,
    bumperLayout: 'random',
    sandCount: 1,
    iceCount: 1,
    hazardLayout: 'random',
    orbBias: 'center',
    wallPadding: 200,
  },
  bumper_maze: {
    id: 'bumper_maze',
    name: 'Bumper Maze',
    description: 'Dense bumper corridors. Bounce puzzles favor the Hider.',
    bumperCount: 10,
    bumperLayout: 'corridors',
    sandCount: 2,
    iceCount: 2,
    hazardLayout: 'corridors',
    orbBias: 'hider',
    wallPadding: 150,
  },
  sandstorm: {
    id: 'sandstorm',
    name: 'Sandstorm',
    description: 'Sand-dominated with narrow ice corridors. Risk/reward navigation.',
    bumperCount: 5,
    bumperLayout: 'clusters',
    sandCount: 6,
    iceCount: 2,
    hazardLayout: 'quadrants',
    orbBias: 'neutral',
    wallPadding: 180,
  },
  ice_rink: {
    id: 'ice_rink',
    name: 'Ice Rink',
    description: 'Ice-dominated. Balls slide unpredictably. Chaotic and fun.',
    bumperCount: 4,
    bumperLayout: 'symmetric',
    sandCount: 1,
    iceCount: 7,
    hazardLayout: 'dominated',
    orbBias: 'center',
    wallPadding: 180,
  },
  symmetry: {
    id: 'symmetry',
    name: 'Symmetry',
    description: 'Mirrored layout for competitive fairness. Same starting conditions.',
    bumperCount: 6,
    bumperLayout: 'symmetric',
    sandCount: 2,
    iceCount: 2,
    hazardLayout: 'quadrants',
    orbBias: 'center',
    wallPadding: 150,
  },
  random: {
    id: 'random',
    name: 'Chaos',
    description: 'Completely random. Anything goes.',
    bumperCount: 6,
    bumperLayout: 'random',
    sandCount: 4,
    iceCount: 4,
    hazardLayout: 'random',
    orbBias: 'center',
    wallPadding: 150,
  },
};
```

---

## Layout Algorithms

### bumperLayout: 'grid'

Place bumpers in a grid pattern with slight randomness:

```typescript
function layoutGridBumpers(count: number, mapW: number, mapH: number, padding: number): Vector2D[] {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = (mapW - padding * 2) / cols;
  const cellH = (mapH - padding * 2) / rows;
  const positions: Vector2D[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (positions.length >= count) break;
      const jitterX = (Math.random() - 0.5) * cellW * 0.4;
      const jitterY = (Math.random() - 0.5) * cellH * 0.4;
      positions.push({
        x: padding + cellW * (c + 0.5) + jitterX,
        y: padding + cellH * (r + 0.5) + jitterY,
      });
    }
  }
  return positions;
}
```

### bumperLayout: 'corridors'

Create horizontal/vertical corridors by placing bumpers in lines:

```typescript
function layoutCorridorBumpers(count: number, mapW: number, mapH: number, padding: number): Vector2D[] {
  // Create 2-3 horizontal walls of bumpers with gaps
  const corridors = Math.min(3, Math.floor(count / 3));
  const perCorridor = Math.floor(count / corridors);
  const positions: Vector2D[] = [];

  for (let i = 0; i < corridors; i++) {
    const y = padding + ((mapH - padding * 2) / (corridors + 1)) * (i + 1);
    const gapX = padding + Math.random() * (mapW - padding * 2);  // gap in the wall

    for (let j = 0; j < perCorridor; j++) {
      const x = padding + ((mapW - padding * 2) / perCorridor) * (j + 0.5);
      // Skip positions near the gap
      if (Math.abs(x - gapX) < 100) continue;
      positions.push({ x, y: y + (Math.random() - 0.5) * 30 });
    }
  }
  return positions;
}
```

### bumperLayout: 'clusters'

Group bumpers in 2-3 tight clusters:

```typescript
function layoutClusterBumpers(count: number, mapW: number, mapH: number, padding: number): Vector2D[] {
  const clusterCount = 2 + Math.floor(Math.random() * 2);  // 2-3 clusters
  const clusterCenters: Vector2D[] = [];
  const positions: Vector2D[] = [];

  // Place cluster centers
  for (let i = 0; i < clusterCount; i++) {
    clusterCenters.push({
      x: padding + Math.random() * (mapW - padding * 2),
      y: padding + Math.random() * (mapH - padding * 2),
    });
  }

  // Distribute bumpers around centers
  let remaining = count;
  for (let i = 0; i < clusterCount; i++) {
    const n = i === clusterCount - 1 ? remaining : Math.floor(count / clusterCount);
    remaining -= n;
    for (let j = 0; j < n; j++) {
      const angle = (Math.PI * 2 * j) / n + (Math.random() - 0.5) * 0.5;
      const dist = 60 + Math.random() * 80;
      positions.push({
        x: clusterCenters[i].x + Math.cos(angle) * dist,
        y: clusterCenters[i].y + Math.sin(angle) * dist,
      });
    }
  }
  return positions;
}
```

### bumperLayout: 'symmetric'

Mirror bumpers across the map center:

```typescript
function layoutSymmetricBumpers(count: number, mapW: number, mapH: number, padding: number): Vector2D[] {
  const half = Math.floor(count / 2);
  const positions: Vector2D[] = [];
  const centerX = mapW / 2;
  const centerY = mapH / 2;

  for (let i = 0; i < half; i++) {
    const x = padding + Math.random() * (mapW / 2 - padding * 1.5);
    const y = padding + Math.random() * (mapH - padding * 2);
    positions.push({ x, y });
    // Mirror
    positions.push({ x: mapW - x, y: mapH - y });
  }

  // If odd count, place one in the center
  if (count % 2 === 1) {
    positions.push({ x: centerX, y: centerY });
  }
  return positions;
}
```

### hazardLayout: 'quadrants'

Divide the map into quadrants and place hazards strategically:

```typescript
function layoutQuadrantHazards(
  sandCount: number, iceCount: number,
  mapW: number, mapH: number, padding: number
): { sand: Vector2D[]; ice: Vector2D[] } {
  const quadrants = [
    { x: 0, y: 0 },           // top-left
    { x: mapW / 2, y: 0 },    // top-right
    { x: 0, y: mapH / 2 },    // bottom-left
    { x: mapW / 2, y: mapH / 2 }, // bottom-right
  ];

  // Assign sand to 2 quadrants, ice to 2 quadrants
  const shuffled = quadrants.sort(() => Math.random() - 0.5);
  const sand: Vector2D[] = [];
  const ice: Vector2D[] = [];

  for (let i = 0; i < sandCount; i++) {
    const q = shuffled[i % 2];
    sand.push({
      x: q.x + padding + Math.random() * (mapW / 2 - padding * 2),
      y: q.y + padding + Math.random() * (mapH / 2 - padding * 2),
    });
  }
  for (let i = 0; i < iceCount; i++) {
    const q = shuffled[2 + (i % 2)];
    ice.push({
      x: q.x + padding + Math.random() * (mapW / 2 - padding * 2),
      y: q.y + padding + Math.random() * (mapH / 2 - padding * 2),
    });
  }
  return { sand, ice };
}
```

### hazardLayout: 'dominated'

One hazard type fills most of the map:

```typescript
function layoutDominatedHazards(
  dominantType: 'sand' | 'ice', dominantCount: number,
  recessiveCount: number, mapW: number, mapH: number, padding: number
): { sand: Vector2D[]; ice: Vector2D[] } {
  const dominant: Vector2D[] = [];
  const recessive: Vector2D[] = [];

  for (let i = 0; i < dominantCount; i++) {
    dominant.push({
      x: padding + Math.random() * (mapW - padding * 2),
      y: padding + Math.random() * (mapH - padding * 2),
    });
  }
  for (let i = 0; i < recessiveCount; i++) {
    recessive.push({
      x: padding + Math.random() * (mapW - padding * 2),
      y: padding + Math.random() * (mapH - padding * 2),
    });
  }

  return dominantType === 'sand'
    ? { sand: dominant, ice: recessive }
    : { sand: recessive, ice: dominant };
}
```

---

## Map Selection UI

### Option A: Random (Default)

No UI change. Each round picks a random template. Simple, zero friction.

### Option B: Player Choice

Add a map selector to MainMenu.tsx:

```
Map: [Random ▼]
     Open Arena
     Bumper Maze
     Sandstorm
     Ice Rink
     Symmetry
     Chaos
```

Store selection in MatchConfig:

```typescript
// types.ts — add to MatchConfig
export interface MatchConfig {
  // ...existing fields
  mapTemplate?: MapTemplateId;  // undefined = random
}
```

### Option C: Round Rotation

Cycle through templates in order. Round 1 = Open Arena, Round 2 = Bumper Maze, etc. After all 5, go back to random.

**Recommendation:** Start with Option A (random). Add Option B in a later sprint if players want control.

---

## Integration with Existing Code

### Changes to map.ts (or GameCanvas.tsx if not yet refactored)

```typescript
// New signature
export function generateMapFromTemplate(
  template: MapTemplate,
  mapW: number,
  mapH: number,
  hiderSpawn: Vector2D,
  seekerSpawn: Vector2D
): { bumpers: NeonBumper[]; hazards: HazardPatch[]; orb: PowerUpOrb } {
  // 1. Get bumper positions from layout algorithm
  const bumperPositions = layoutBumpers(template.bumperLayout, template.bumperCount, mapW, mapH, template.wallPadding);

  // 2. Get hazard positions from layout algorithm
  const hazardPositions = layoutHazards(template.hazardLayout, template.sandCount, template.iceCount, mapW, mapH, template.wallPadding);

  // 3. Validate: ensure no overlap with player spawns
  validateSpawnClearance(bumperPositions, hazardPositions, hiderSpawn, seekerSpawn);

  // 4. Build NeonBumper[] and HazardPatch[] from positions
  // 5. Place orb based on template.orbBias
  // 6. Return
}
```

### Orb Bias Placement

```typescript
function placeOrb(bias: MapTemplate['orbBias'], mapW: number, mapH: number, hiderSpawn: Vector2D, seekerSpawn: Vector2D): Vector2D {
  switch (bias) {
    case 'center':
      return { x: mapW / 2 + (Math.random() - 0.5) * 200, y: mapH / 2 + (Math.random() - 0.5) * 200 };
    case 'hider':
      return { x: hiderSpawn.x + (Math.random() - 0.5) * 300, y: hiderSpawn.y + (Math.random() - 0.5) * 300 };
    case 'seeker':
      return { x: seekerSpawn.x + (Math.random() - 0.5) * 300, y: seekerSpawn.y + (Math.random() - 0.5) * 300 };
    case 'neutral':
    default:
      return {
        x: Math.min(mapW, Math.max(0, (hiderSpawn.x + seekerSpawn.x) / 2 + (Math.random() - 0.5) * 400)),
        y: Math.min(mapH, Math.max(0, (hiderSpawn.y + seekerSpawn.y) / 2 + (Math.random() - 0.5) * 400)),
      };
  }
}
```

---

## Validation

After placing bumpers and hazards, validate:

1. **Spawn clearance:** No bumper/hazard within `BUMPER_SPAWN_CLEAR` of either player spawn
2. **Bumper separation:** No two bumpers closer than `BUMPER_MIN_SEP`
3. **Hazard separation:** No two hazards closer than `HAZARD_MIN_SEP`
4. **Bumper-hazard clearance:** No bumper closer than `HAZARD_BUMPER_CLEAR` to a hazard
5. **In-bounds:** All elements within map bounds (with wall padding)

If validation fails, retry that element's placement (max 10 retries, then skip).

---

## File Summary

| File | Action | Purpose |
|---|---|---|
| `src/game/map.ts` | Modify (or create if refactored) | Add template definitions, layout algorithms, `generateMapFromTemplate()` |
| `src/types.ts` | Modify | Add `MapTemplateId` type, add `mapTemplate` to `MatchConfig` |
| `src/components/MainMenu.tsx` | Modify (optional) | Add map selector dropdown |
| `src/constants.ts` | Modify | Add any new template-related constants |

---

## Implementation Order

1. Add `MapTemplate` types and `MAP_TEMPLATES` definitions to `map.ts`
2. Implement layout algorithms (grid, corridors, clusters, symmetric)
3. Implement hazard layout algorithms (quadrants, dominated)
4. Implement `generateMapFromTemplate()` with validation
5. Replace existing `generateMap()` calls with `generateMapFromTemplate()` using random template
6. Test each template visually in browser
7. (Optional) Add map selector to MainMenu
8. Build and verify

---

## Testing Checklist

- [ ] All 6 templates generate without errors
- [ ] Open Arena has sparse, spread-out bumpers
- [ ] Bumper Maze has corridor-like bumper walls with gaps
- [ ] Sandstorm has mostly sand with narrow ice paths
- [ ] Ice Rink has mostly ice with little sand
- [ ] Symmetry has mirrored bumper positions
- [ ] Chaos is fully random
- [ ] No bumpers overlap player spawns
- [ ] No bumpers overlap each other
- [ ] Orb placement respects bias setting
- [ ] Sudden Death still uses its own compact map (not affected by templates)
- [ ] Build passes
- [ ] Game plays normally with each template
