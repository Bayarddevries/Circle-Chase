/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Procedural map generation for Circle Chase.
 * Generates bumpers, hazards, power-up orb, and resets player positions.
 */

import {
  MAP_WIDTH,
  MAP_HEIGHT,
  SD_MAP_WIDTH,
  SD_MAP_HEIGHT,
  HIDER_RADIUS,
  SEEKER_RADIUS,
  BUMPER_COUNT_NORMAL,
  BUMPER_COUNT_SD,
  BUMPER_MIN_RADIUS,
  BUMPER_RADIUS_VAR,
  BUMPER_SPAWN_CLEAR,
  BUMPER_MIN_SEP,
  SAND_COUNT,
  ICE_COUNT,
  SAND_MIN_RADIUS,
  SAND_RADIUS_VAR,
  ICE_MIN_RADIUS,
  ICE_RADIUS_VAR,
  HAZARD_SPAWN_CLEAR,
  HAZARD_MIN_SEP,
  HAZARD_BUMPER_CLEAR,
  ORB_RADIUS,
  ORB_SPAWN_RANGE,
} from '../constants';
import { NeonBumper, HazardPatch, PowerUpOrb, PowerUpType, PlayerBall, PlayerRole } from '../types';

export interface GeneratedMap {
  hider: PlayerBall;
  seeker: PlayerBall;
  bumpers: NeonBumper[];
  hazards: HazardPatch[];
  orb: PowerUpOrb;
}

const BUMPER_COLORS = ['#ff0055', '#ff00aa', '#00f0ff', '#e0ffff'];

export function generateMap(
  isSuddenDeath: boolean,
  hiderName: string,
  seekerName: string,
): GeneratedMap {
  const mapWidth = isSuddenDeath ? SD_MAP_WIDTH : MAP_WIDTH;
  const mapHeight = isSuddenDeath ? SD_MAP_HEIGHT : MAP_HEIGHT;

  // Player starting positions
  const hider: PlayerBall = {
    x: isSuddenDeath ? 300 : 450,
    y: isSuddenDeath ? 450 : 750,
    vx: 0,
    vy: 0,
    radius: HIDER_RADIUS,
    role: 'hider',
    name: hiderName,
  };

  const seeker: PlayerBall = {
    x: isSuddenDeath ? 900 : 1550,
    y: isSuddenDeath ? 450 : 750,
    vx: 0,
    vy: 0,
    radius: SEEKER_RADIUS,
    role: 'seeker',
    name: seekerName,
  };

  // --- Bumpers ---
  const bumpers: NeonBumper[] = [];
  const numBumpers = isSuddenDeath ? BUMPER_COUNT_SD : BUMPER_COUNT_NORMAL;
  let tries = 0;

  while (bumpers.length < numBumpers && tries < 100) {
    tries++;
    let bx = BUMPER_SPAWN_CLEAR / 2 + Math.random() * (mapWidth - BUMPER_SPAWN_CLEAR);
    let by = BUMPER_SPAWN_CLEAR / 2 + Math.random() * (mapHeight - BUMPER_SPAWN_CLEAR);

    // Bias early bumpers near center-corridor
    if (tries < 40 && bumpers.length < 3) {
      bx = (mapWidth / 2) + (Math.random() - 0.5) * (mapWidth * 0.42);
      by = (mapHeight / 2) + (Math.random() - 0.5) * (mapHeight * 0.42);
    }

    // Clear from player spawns
    const distH = Math.hypot(bx - hider.x, by - hider.y);
    const distS = Math.hypot(bx - seeker.x, by - seeker.y);
    if (distH < BUMPER_SPAWN_CLEAR || distS < BUMPER_SPAWN_CLEAR) continue;

    // Avoid bunching
    let tooClose = false;
    for (const b of bumpers) {
      if (Math.hypot(bx - b.x, by - b.y) < BUMPER_MIN_SEP) tooClose = true;
    }
    if (tooClose) continue;

    bumpers.push({
      id: `bumper-${bumpers.length}`,
      x: bx,
      y: by,
      radius: BUMPER_MIN_RADIUS + Math.random() * BUMPER_RADIUS_VAR,
      color: bumpers.length < BUMPER_COLORS.length ? BUMPER_COLORS[bumpers.length] : BUMPER_COLORS[bumpers.length % BUMPER_COLORS.length],
      pulseTimer: 0,
    });
  }

  // --- Hazards (sand + ice) ---
  const hazards: HazardPatch[] = [];
  if (!isSuddenDeath) {
    // Sand
    let sandCount = 0;
    tries = 0;
    while (sandCount < SAND_COUNT && tries < 150) {
      tries++;
      const sx = HAZARD_SPAWN_CLEAR / 2 + Math.random() * (mapWidth - HAZARD_SPAWN_CLEAR);
      const sy = HAZARD_SPAWN_CLEAR / 2 + Math.random() * (mapHeight - HAZARD_SPAWN_CLEAR);

      const distH = Math.hypot(sx - hider.x, sy - hider.y);
      const distS = Math.hypot(sx - seeker.x, sy - seeker.y);
      if (distH < HAZARD_SPAWN_CLEAR || distS < HAZARD_SPAWN_CLEAR) continue;

      let overlap = false;
      for (const b of bumpers) {
        if (Math.hypot(sx - b.x, sy - b.y) < b.radius + HAZARD_BUMPER_CLEAR) overlap = true;
      }
      for (const h of hazards) {
        if (Math.hypot(sx - h.x, sy - h.y) < HAZARD_MIN_SEP) overlap = true;
      }
      if (overlap) continue;

      hazards.push({
        id: `sand-${sandCount}`,
        x: sx,
        y: sy,
        radius: SAND_MIN_RADIUS + Math.random() * SAND_RADIUS_VAR,
        type: 'sand',
      });
      sandCount++;
    }

    // Ice — matches original spawn logic exactly
    let iceCount = 0;
    tries = 0;
    while (iceCount < ICE_COUNT && tries < 150) {
      tries++;
      const ix = 200 + Math.random() * (mapWidth - 400);
      const iy = 200 + Math.random() * (mapHeight - 400);

      const distH = Math.hypot(ix - hider.x, iy - hider.y);
      const distS = Math.hypot(ix - seeker.x, iy - seeker.y);
      if (distH < HAZARD_SPAWN_CLEAR || distS < HAZARD_SPAWN_CLEAR) continue;

      let overlap = false;
      for (const b of bumpers) {
        if (Math.hypot(ix - b.x, iy - b.y) < b.radius + 100) overlap = true;
      }
      for (const h of hazards) {
        if (Math.hypot(ix - h.x, iy - h.y) < 200) overlap = true;
      }
      if (overlap) continue;

      hazards.push({
        id: `ice-${iceCount}`,
        x: ix,
        y: iy,
        radius: ICE_MIN_RADIUS + Math.random() * ICE_RADIUS_VAR,
        type: 'ice',
      });
      iceCount++;
    }
  }

  // --- Power-Up Orb ---
  const pTypes: PowerUpType[] = ['laser', 'superball', 'iron', 'sonar'];
  const randomType = pTypes[Math.floor(Math.random() * pTypes.length)];
  const orbRange = ORB_SPAWN_RANGE;

  const orb: PowerUpOrb = {
    x: isSuddenDeath ? -1000 : (mapWidth / 2) - orbRange + Math.random() * (orbRange * 2),
    y: isSuddenDeath ? -1000 : (mapHeight / 2) - orbRange + Math.random() * (orbRange * 2),
    radius: ORB_RADIUS,
    type: randomType,
    active: !isSuddenDeath,
    pulseScale: 1,
  };

  return { hider, seeker, bumpers, hazards, orb };
}
