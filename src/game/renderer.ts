/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Game entity rendering for Circle Chase.
 * Handles drawing hazards, bumpers, and player balls.
 */

import { NeonBumper, HazardPatch, PlayerBall } from '../types';

// ── Hazards ──────────────────────────────────────────

export function drawHazards(
  ctx: CanvasRenderingContext2D,
  hazards: HazardPatch[],
): void {
  for (const haz of hazards) {
    ctx.beginPath();
    ctx.arc(haz.x, haz.y, haz.radius, 0, Math.PI * 2);

    if (haz.type === 'sand') {
      ctx.fillStyle = 'rgba(63, 29, 11, 0.32)';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SAND SLOWDOWN', haz.x, haz.y);
    } else if (haz.type === 'ice') {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ICE GLIDE', haz.x, haz.y);
    }
  }
}

// ── Bumpers ──────────────────────────────────────────

export function drawBumpers(
  ctx: CanvasRenderingContext2D,
  bumpers: NeonBumper[],
): void {
  for (const b of bumpers) {
    ctx.save();
    const currentRadius = b.radius + (b.pulseTimer > 0 ? b.pulseTimer * 0.5 : 0);

    // Warm amber base
    ctx.beginPath();
    ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
    ctx.fill();

    // Pulse glow
    ctx.lineWidth = b.pulseTimer > 0 ? 5.5 : 3.5;
    const bumperColor = b.color === '#ff0055' || b.color === '#ff00aa' ? '#ea580c' : '#f59e0b';
    ctx.strokeStyle = bumperColor;
    ctx.shadowBlur = b.pulseTimer > 0 ? 25 : 12;
    ctx.shadowColor = bumperColor;
    ctx.stroke();

    // Core details
    ctx.beginPath();
    ctx.arc(b.x, b.y, currentRadius * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cross indicator
    ctx.beginPath();
    ctx.moveTo(b.x - 8, b.y); ctx.lineTo(b.x + 8, b.y);
    ctx.moveTo(b.x, b.y - 8); ctx.lineTo(b.x, b.y + 8);
    ctx.strokeStyle = bumperColor;
    ctx.stroke();

    ctx.restore();
  }
}

// ── Shockwave ────────────────────────────────────────

export function drawShockwave(
  ctx: CanvasRenderingContext2D,
  shockwave: { x: number; y: number; r: number; maxR: number; active: boolean } | null,
): void {
  if (!shockwave || !shockwave.active) return;
  const alpha = Math.max(0, 1 - (shockwave.r / shockwave.maxR));
  ctx.save();
  ctx.beginPath();
  ctx.arc(shockwave.x, shockwave.y, shockwave.r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(217, 119, 6, ${alpha})`;
  ctx.lineWidth = 8 * alpha;
  ctx.shadowBlur = 25;
  ctx.shadowColor = '#d97706';
  ctx.stroke();
  ctx.restore();
}

// ── Hider ball ───────────────────────────────────────

export function drawHiderBall(
  ctx: CanvasRenderingContext2D,
  hider: PlayerBall,
  colorblindMode: boolean,
  isHiderTurn: boolean,
  ballsMoving: boolean,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(hider.x, hider.y, hider.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = '#38bdf8';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#38bdf8';
  ctx.stroke();

  // Letter
  ctx.shadowBlur = 0;
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', hider.x, hider.y);

  // Colorblind overlay
  if (colorblindMode) {
    const s = hider.radius * 0.7;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(hider.x - s, hider.y - s, s * 2, s * 2);
  }

  // Turn halo
  if (isHiderTurn && !ballsMoving) {
    ctx.beginPath();
    ctx.arc(hider.x, hider.y, hider.radius + 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Seeker ball ──────────────────────────────────────

export function drawSeekerBall(
  ctx: CanvasRenderingContext2D,
  seeker: PlayerBall,
  colorblindMode: boolean,
  isSeekerTurn: boolean,
  ballsMoving: boolean,
): void {
  ctx.save();

  // Colorblind triangle
  if (colorblindMode) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const sx = seeker.x + Math.cos(angle) * (seeker.radius + 6.5);
      const sy = seeker.y + Math.sin(angle) * (seeker.radius + 6.5);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#d97706';
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(seeker.x, seeker.y, seeker.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#d97706';
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = '#ea580c';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#d97706';
  ctx.stroke();

  // Letter
  ctx.shadowBlur = 0;
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', seeker.x, seeker.y);

  // Turn halo
  if (isSeekerTurn && !ballsMoving) {
    ctx.beginPath();
    ctx.arc(seeker.x, seeker.y, seeker.radius + 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
  }
  ctx.restore();
}
