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
  ORB_COUNT_MIN,
  ORB_COUNT_MAX,
} from '../constants';
import { NeonBumper, HazardPatch, PowerUpOrb, PowerUpType, PlayerBall, PlayerRole } from '../types';
import { getRandomTemplate } from './templates';

export interface GeneratedMap {
  hider: PlayerBall;
  seeker: PlayerBall;
  bumpers: NeonBumper[];
  hazards: HazardPatch[];
  orbs: PowerUpOrb[];
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

  // Pick a map template
  const template = getRandomTemplate(isSuddenDeath);

  // --- Bumpers (from template) ---
  const bumpers: NeonBumper[] = [];
  for (let i = 0; i < template.bumpers.length; i++) {
    const bp = template.bumpers[i];
    bumpers.push({
      id: `bumper-${i}`,
      x: bp.x,
      y: bp.y,
      radius: BUMPER_MIN_RADIUS + Math.random() * BUMPER_RADIUS_VAR,
      color: i < BUMPER_COLORS.length ? BUMPER_COLORS[i] : BUMPER_COLORS[i % BUMPER_COLORS.length],
      pulseTimer: 0,
    });
  }

  // --- Hazards (from template) ---
  const hazards: HazardPatch[] = [];
  if (!isSuddenDeath) {
    let sandCount = 0;
    let iceCount = 0;
    for (const hz of template.hazards) {
      if (hz.type === 'sand') {
        hazards.push({
          id: `sand-${sandCount}`,
          x: hz.x,
          y: hz.y,
          radius: SAND_MIN_RADIUS + Math.random() * SAND_RADIUS_VAR,
          type: 'sand',
        });
        sandCount++;
      } else {
        hazards.push({
          id: `ice-${iceCount}`,
          x: hz.x,
          y: hz.y,
          radius: ICE_MIN_RADIUS + Math.random() * ICE_RADIUS_VAR,
          type: 'ice',
        });
        iceCount++;
      }
    }
  }

  // --- Power-Up Orbs ---
  const orbCount = isSuddenDeath ? 0 : ORB_COUNT_MIN + Math.floor(Math.random() * (ORB_COUNT_MAX - ORB_COUNT_MIN + 1));
  const allTypes: PowerUpType[] = ['iron', 'rocket', 'gravity', 'vampire', 'superball', 'emp'];
  const orbs: PowerUpOrb[] = [];

  for (let i = 0; i < orbCount; i++) {
    const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];
    const orbRange = isSuddenDeath ? 0 : ORB_SPAWN_RANGE;
    
    // Distribute orbs across the map, not all at center
    const regionX = (i / orbCount) * mapWidth;
    const regionY = (i % 2 === 0) ? mapHeight * 0.3 : mapHeight * 0.7;
    const ox = regionX + (Math.random() - 0.5) * orbRange * 1.5;
    const oy = regionY + (Math.random() - 0.5) * orbRange * 1.5;
    
    orbs.push({
      x: isSuddenDeath ? -1000 : Math.max(ORB_RADIUS + 10, Math.min(mapWidth - ORB_RADIUS - 10, ox)),
      y: isSuddenDeath ? -1000 : Math.max(ORB_RADIUS + 10, Math.min(mapHeight - ORB_RADIUS - 10, oy)),
      radius: ORB_RADIUS,
      type: randomType,
      active: !isSuddenDeath,
      pulseScale: 1,
    });
  }

  return { hider, seeker, bumpers, hazards, orbs };
}
