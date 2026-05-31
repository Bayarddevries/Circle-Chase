/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Power-up orb rendering, pulse animation, orbiting labels, and drip particles.
 */

import { PowerUpOrb } from '../types';
import { ORB_PULSE_SPEED, ORB_PULSE_AMP, ORBIT_SPEED, ORBIT_RADIUS } from '../constants';

// ── Pulse animation ──────────────────────────────────

export function updateOrbPulse(orb: PowerUpOrb, time: number): void {
  if (orb.active) {
    orb.pulseScale = 1 + Math.sin(time * ORB_PULSE_SPEED) * ORB_PULSE_AMP;
  }
}

// ── Color lookup ─────────────────────────────────────

const typeColor: Record<string, string> = {
  iron: '#6b7280',
  gravity: '#a855f7',
  magnet: '#3b82f6',
  smoke: '#64748b',
  tracker: '#22d3ee',
};

const typeLabels: Record<string, string> = {
  iron: 'IRON BALL',
  gravity: 'GRAVITY',
  magnet: 'MAGNET',
  smoke: 'SMOKE',
  tracker: 'TRACKER',
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '34, 211, 238';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

// ── Draw ─────────────────────────────────────────────

export function drawOrb(
  ctx: CanvasRenderingContext2D,
  orb: PowerUpOrb,
  isSuddenDeath: boolean,
  time: number,
): void {
  if (!orb.active || isSuddenDeath) return;

  const color = typeColor[orb.type] || '#22d3ee';
  const label = typeLabels[orb.type] || orb.type.toUpperCase();
  const rgb = hexToRgb(color);

  ctx.save();

  // ── Outer pulse ring ──────────────────────────────
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.radius * orb.pulseScale, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${rgb}, 0.45)`;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // ── Secondary outer glow (breathing opposite phase) ──
  const outerPulse = 1 + Math.sin(time * ORB_PULSE_SPEED + Math.PI) * ORB_PULSE_AMP * 0.6;
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.radius * outerPulse * 1.3, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${rgb}, 0.15)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Inner glowing core ────────────────────────────
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(orb.x, orb.y, orb.radius * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // ── Orbiting label ────────────────────────────────
  ctx.shadowBlur = 0;
  const orbitAngle = time * ORBIT_SPEED;
  const labelX = orb.x + Math.cos(orbitAngle) * ORBIT_RADIUS;
  const labelY = orb.y + Math.sin(orbitAngle) * ORBIT_RADIUS;

  ctx.fillStyle = color;
  ctx.font = 'bold 10px "Space Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;
  ctx.fillText(label, labelX, labelY);

  ctx.restore();
}
