/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Trail rendering for Circle Chase.
 * Handles ball trail accumulation and drawing.
 */

import { TRAIL_MAX_POINTS, TRAIL_MIN_SPEED } from '../constants';

export interface TrailPoint {
  x: number;
  y: number;
}

// ── Accumulate ───────────────────────────────────────

export function updateTrail(
  trail: TrailPoint[],
  ballX: number,
  ballY: number,
  ballVx: number,
  ballVy: number,
): void {
  const speed = Math.hypot(ballVx, ballVy);
  if (speed > TRAIL_MIN_SPEED) {
    trail.push({ x: ballX, y: ballY });
    if (trail.length > TRAIL_MAX_POINTS) trail.shift();
  } else {
    if (trail.length > 0) trail.shift();
  }
}

// ── Draw ─────────────────────────────────────────────

export function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: TrailPoint[],
  color: string,
  ballRadius: number,
  alphaMult: number,
  widthMult: number,
): void {
  if (trail.length < 3) return;
  ctx.save();
  for (let i = 1; i < trail.length; i++) {
    const ratio = i / trail.length;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.strokeStyle = color.replace('ALPHA', String(ratio * alphaMult));
    ctx.lineWidth = ballRadius * widthMult * ratio;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

// Color templates (use .replace('ALPHA', ...))
export const HIDER_TRAIL_COLOR = 'rgba(186, 230, 253, ALPHA)';  // ice stardust
export const SEEKER_TRAIL_COLOR = 'rgba(217, 119, 6, ALPHA)';    // sand-gold comet
