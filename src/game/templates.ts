/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pre-designed map templates for Circle Chase.
 * Each template defines bumper and hazard positions for a 2000×1500 map.
 * Sudden death uses a separate set of compact templates (1200×900).
 */

export interface MapTemplate {
  name: string;
  bumpers: { x: number; y: number }[];
  hazards: { x: number; y: number; type: 'sand' | 'ice' }[];
}

const MAP_W = 2000;
const MAP_H = 1500;

/* ---------- 6 Normal Templates ---------- */

const arena: MapTemplate = {
  name: 'The Arena',
  bumpers: [
    { x: 120, y: 120 },    // top-left corner
    { x: 1880, y: 120 },   // top-right corner
    { x: 120, y: 1380 },   // bottom-left corner
    { x: 1880, y: 1380 },  // bottom-right corner
    { x: 600, y: 400 },
    { x: 1400, y: 400 },
  ],
  hazards: [
    { x: 600, y: 1100, type: 'sand' },
    { x: 1400, y: 1100, type: 'sand' },
    { x: 1000, y: 200, type: 'ice' },
    { x: 1000, y: 1300, type: 'ice' },
    { x: 400, y: 750, type: 'sand' },
    { x: 1600, y: 750, type: 'sand' },
  ],
};

const corridor: MapTemplate = {
  name: 'The Corridor',
  bumpers: [
    { x: 500, y: 200 },
    { x: 500, y: 550 },
    { x: 500, y: 950 },
    { x: 500, y: 1300 },
    { x: 1500, y: 200 },
    { x: 1500, y: 550 },
  ],
  hazards: [
    { x: 1500, y: 950, type: 'ice' },
    { x: 1500, y: 1300, type: 'ice' },
    { x: 1000, y: 100, type: 'ice' },
    { x: 1000, y: 1400, type: 'sand' },
    { x: 800, y: 750, type: 'sand' },
    { x: 1200, y: 750, type: 'sand' },
  ],
};

const gauntlet: MapTemplate = {
  name: 'The Gauntlet',
  bumpers: [
    { x: 350, y: 350 },
    { x: 700, y: 550 },
    { x: 1000, y: 350 },
    { x: 1300, y: 550 },
    { x: 1650, y: 350 },
    { x: 1400, y: 1000 },
  ],
  hazards: [
    { x: 200, y: 1200, type: 'ice' },
    { x: 600, y: 1200, type: 'ice' },
    { x: 1000, y: 1100, type: 'ice' },
    { x: 1800, y: 1200, type: 'sand' },
    { x: 1000, y: 200, type: 'sand' },
    { x: 400, y: 100, type: 'sand' },
  ],
};

const openField: MapTemplate = {
  name: 'Open Field',
  bumpers: [
    { x: 300, y: 300 },
    { x: 1700, y: 300 },
    { x: 300, y: 1200 },
    { x: 1700, y: 1200 },
    { x: 1000, y: 750 },
    { x: 1000, y: 400 },
  ],
  hazards: [
    { x: 800, y: 1150, type: 'ice' },
    { x: 1200, y: 1150, type: 'sand' },
    { x: 600, y: 550, type: 'sand' },
    { x: 1400, y: 550, type: 'ice' },
    { x: 400, y: 860, type: 'sand' },
    { x: 1600, y: 860, type: 'sand' },
  ],
};

const maze: MapTemplate = {
  name: 'The Maze',
  bumpers: [
    { x: 300, y: 400 },
    { x: 700, y: 300 },
    { x: 700, y: 750 },
    { x: 900, y: 1100 },
    { x: 1300, y: 400 },
    { x: 1700, y: 750 },
  ],
  hazards: [
    { x: 500, y: 600, type: 'sand' },
    { x: 500, y: 1100, type: 'sand' },
    { x: 1300, y: 1100, type: 'ice' },
    { x: 1600, y: 300, type: 'ice' },
    { x: 200, y: 900, type: 'ice' },
    { x: 1500, y: 1300, type: 'sand' },
  ],
};

const doubleTrouble: MapTemplate = {
  name: 'Double Trouble',
  bumpers: [
    { x: 400, y: 300 },
    { x: 600, y: 500 },
    { x: 400, y: 700 },
    { x: 1600, y: 300 },
    { x: 1400, y: 500 },
    { x: 1600, y: 700 },
  ],
  hazards: [
    { x: 400, y: 1050, type: 'sand' },
    { x: 600, y: 1250, type: 'ice' },
    { x: 1400, y: 1050, type: 'sand' },
    { x: 1600, y: 1250, type: 'ice' },
    { x: 1000, y: 100, type: 'ice' },
    { x: 1000, y: 1400, type: 'sand' },
  ],
};

/* ---------- 3 Sudden Death Templates (1200×900) ---------- */

const sdArena: MapTemplate = {
  name: 'SD: Compact',
  bumpers: [
    { x: 120, y: 120 },
    { x: 1080, y: 120 },
    { x: 120, y: 780 },
    { x: 1080, y: 780 },
    { x: 400, y: 450 },
    { x: 800, y: 450 },
    { x: 600, y: 200 },
    { x: 600, y: 700 },
  ],
  hazards: [],
};

const sdCross: MapTemplate = {
  name: 'SD: Cross',
  bumpers: [
    { x: 300, y: 250 },
    { x: 900, y: 250 },
    { x: 300, y: 650 },
    { x: 900, y: 650 },
    { x: 600, y: 120 },
    { x: 600, y: 780 },
    { x: 200, y: 450 },
    { x: 1000, y: 450 },
  ],
  hazards: [],
};

const sdCluster: MapTemplate = {
  name: 'SD: Cluster',
  bumpers: [
    { x: 300, y: 300 },
    { x: 500, y: 200 },
    { x: 400, y: 450 },
    { x: 800, y: 300 },
    { x: 700, y: 500 },
    { x: 900, y: 650 },
    { x: 200, y: 700 },
    { x: 600, y: 750 },
  ],
  hazards: [],
};

const NORMAL_TEMPLATES: MapTemplate[] = [
  arena, corridor, gauntlet, openField, maze, doubleTrouble,
];

const SD_TEMPLATES: MapTemplate[] = [sdArena, sdCross, sdCluster];

/**
 * Pick a random template for the given map mode.
 * For sudden death, uses compact templates with 8 bumpers and no hazards.
 */
export function getRandomTemplate(isSuddenDeath: boolean): MapTemplate {
  const pool = isSuddenDeath ? SD_TEMPLATES : NORMAL_TEMPLATES;
  return pool[Math.floor(Math.random() * pool.length)];
}
