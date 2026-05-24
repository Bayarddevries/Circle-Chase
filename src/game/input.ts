/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Input handling for Circle Chase.
 * Coordinate transforms, slingshot drag state, and launch logic.
 */

import { Camera } from './camera';
import { PlayerBall, PlayerRole } from '../types';
import { HIDER_BASE_SPEED, SEEKER_SPEED_MULT, MAX_DRAG, MIN_DRAG_DIST } from '../constants';

// ── Screen-to-map coordinate transform ──────────────

export function screenToMap(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  canvasWidth: number,
  canvasHeight: number,
  camera: Camera,
): { mapX: number; mapY: number } {
  const sx = clientX - canvasRect.left;
  const sy = clientY - canvasRect.top;
  return {
    mapX: (sx - canvasWidth / 2) / camera.zoom + camera.x,
    mapY: (sy - canvasHeight / 2) / camera.zoom + camera.y,
  };
}

// ── Launch calculation ───────────────────────────────

export interface LaunchResult {
  vx: number;
  vy: number;
  speed: number;
  dragPower: number;
}

export function calculateLaunch(
  ballX: number,
  ballY: number,
  dragX: number,
  dragY: number,
  role: PlayerRole,
): LaunchResult | null {
  const dx = ballX - dragX;
  const dy = ballY - dragY;
  const dist = Math.hypot(dx, dy);

  if (dist < MIN_DRAG_DIST) return null;

  const dragPower = Math.min(1.0, dist / MAX_DRAG);
  const baseVMax = HIDER_BASE_SPEED;
  const seekerVMax = HIDER_BASE_SPEED * SEEKER_SPEED_MULT;
  const currentLimit = role === 'seeker' ? seekerVMax : baseVMax;
  const launchSpeed = currentLimit * dragPower;

  return {
    vx: (dx / dist) * launchSpeed,
    vy: (dy / dist) * launchSpeed,
    speed: launchSpeed,
    dragPower,
  };
}
