/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Power-up orb rendering and pulse animation for Circle Chase.
 */

import { PowerUpOrb } from '../types';
import { ORB_PULSE_SPEED, ORB_PULSE_AMP } from '../constants';

// ── Pulse animation ──────────────────────────────────

export function updateOrbPulse(orb: PowerUpOrb, time: number): void {
  if (orb.active) {
    orb.pulseScale = 1 + Math.sin(time * ORB_PULSE_SPEED) * ORB_PULSE_AMP;
  }
}

// ── Draw ─────────────────────────────────────────────

export function drawOrb(
  ctx: CanvasRenderingContext2D,
  orb: PowerUpOrb,
  isSuddenDeath: boolean,
): void {
  if (!orb.active || isSuddenDeath) return;

  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = '#22d3ee';

  // Outer pulse ring
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.radius * orb.pulseScale, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Inner glowing core
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.radius * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Label
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#22d3ee';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(orb.type.toUpperCase(), orb.x, orb.y - orb.radius - 8);

  ctx.restore();
}
