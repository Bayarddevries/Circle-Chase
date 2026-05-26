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

  // Outer amber ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(shockwave.x, shockwave.y, shockwave.r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(217, 119, 6, ${alpha})`;
  ctx.lineWidth = 7 * alpha;
  ctx.shadowBlur = 25;
  ctx.shadowColor = '#d97706';
  ctx.stroke();
  ctx.restore();

  // Inner gold ring — delayed, shorter range
  const innerR = Math.max(0, (shockwave.r - 25) * 0.75);
  if (innerR > 10) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(shockwave.x, shockwave.y, innerR, 0, Math.PI * 2);
    const innerAlpha = alpha * 0.6;
    ctx.strokeStyle = `rgba(251, 191, 36, ${innerAlpha})`;
    ctx.lineWidth = 4 * alpha;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#fbbf24';
    ctx.stroke();
    ctx.restore();
  }
}

// ── Tech-Neon Runner ball ────────────────────────────

export function drawHiderBall(
  ctx: CanvasRenderingContext2D,
  hider: PlayerBall,
  colorblindMode: boolean,
  isHiderTurn: boolean,
  ballsMoving: boolean,
): void {
  const { x, y, radius: r } = hider;
  const t = performance.now() / 1000;
  const breathe = 0.8 + 0.2 * Math.sin(t * 2);

  ctx.save();

  // ── Outer glow bloom ──
  for (let i = 4; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(x, y, r + i * 4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.05 * i})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Rotating dashed outer ring ──
  const rot = -t * 0.5;
  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.45;
  ctx.setLineDash([4, 6]);
  ctx.lineDashOffset = rot;
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#38bdf8';
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // ── Solid gradient body ──
  const bodyGrad = ctx.createRadialGradient(x - 6, y - 8, 2, x, y, r);
  bodyGrad.addColorStop(0, '#ffffff');
  bodyGrad.addColorStop(0.2, '#e0f2fe');
  bodyGrad.addColorStop(0.5, '#7dd3fc');
  bodyGrad.addColorStop(0.8, '#38bdf8');
  bodyGrad.addColorStop(1, '#0c4a6e');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // ── Solid edge boundary (opaque, know where to hit) ──
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#38bdf8';
  ctx.shadowBlur = 0;
  ctx.stroke();
  // Glow pass on top
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#7dd3fc';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#38bdf8';
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Inner pulse glow ──
  const inGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 0.6);
  inGrad.addColorStop(0, `rgba(255,255,255,${0.3 * breathe})`);
  inGrad.addColorStop(0.5, `rgba(56,189,248,${0.08 * breathe})`);
  inGrad.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = inGrad;
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#38bdf8';
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Core dot ──
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#ffffff';
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Scanning arc ──
  const arcAngle = t * 0.7;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.7, arcAngle - 0.3, arcAngle + 0.05);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.3;
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#7dd3fc';
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // ── Colorblind overlay (square) ──
  if (colorblindMode) {
    const s = r * 0.7;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - s, y - s, s * 2, s * 2);
  }

  // ── Turn halo (rotating dashed, only when active) ──
  if (isHiderTurn && !ballsMoving) {
    const haloRot = t * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r + 14, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([3, 5]);
    ctx.lineDashOffset = -haloRot;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#38bdf8';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

// ── Tech-Neon Chaser ball ────────────────────────────

export function drawSeekerBall(
  ctx: CanvasRenderingContext2D,
  seeker: PlayerBall,
  colorblindMode: boolean,
  isSeekerTurn: boolean,
  ballsMoving: boolean,
): void {
  const { x, y, radius: r } = seeker;
  const t = performance.now() / 1000;
  const breathe = 0.7 + 0.3 * Math.sin(t * 3);

  ctx.save();

  // ── Outer glow bloom ──
  for (let i = 4; i >= 1; i--) {
    ctx.beginPath();
    ctx.arc(x, y, r + i * 4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.06 * i})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Rotating dashed outer ring (faster) ──
  const rot = -t * 0.7;
  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([4, 6]);
  ctx.lineDashOffset = rot;
  ctx.shadowBlur = 16;
  ctx.shadowColor = '#f59e0b';
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // ── Solid gradient body ──
  const bodyGrad = ctx.createRadialGradient(x - 6, y - 8, 2, x, y, r);
  bodyGrad.addColorStop(0, '#fef3c7');
  bodyGrad.addColorStop(0.2, '#fde68a');
  bodyGrad.addColorStop(0.5, '#f59e0b');
  bodyGrad.addColorStop(0.8, '#d97706');
  bodyGrad.addColorStop(1, '#7c2d12');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // ── Solid edge boundary (opaque, know where to hit) ──
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#d97706';
  ctx.shadowBlur = 0;
  ctx.stroke();
  // Glow pass on top
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#f59e0b';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#f59e0b';
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Inner pulse glow ──
  const inGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 0.55);
  inGrad.addColorStop(0, `rgba(255,255,255,${0.35 * breathe})`);
  inGrad.addColorStop(0.4, `rgba(251,191,36,${0.12 * breathe})`);
  inGrad.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = inGrad;
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#f59e0b';
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Core dot ──
  const coreSize = 5 * (0.8 + 0.2 * breathe);
  ctx.beginPath();
  ctx.arc(x, y, coreSize, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 22;
  ctx.shadowColor = '#fbbf24';
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Targeting sweep arc ──
  const sweepAngle = t * 1.0;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.7, sweepAngle - 0.4, sweepAngle + 0.05);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.35;
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#fbbf24';
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // ── Colorblind overlay (triangle) ──
  if (colorblindMode) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const sx = x + Math.cos(angle) * (r + 6.5);
      const sy = y + Math.sin(angle) * (r + 6.5);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#d97706';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Turn halo (rotating dashed, only when active) ──
  if (isSeekerTurn && !ballsMoving) {
    const haloRot = t * 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r + 14, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.55;
    ctx.setLineDash([3, 5]);
    ctx.lineDashOffset = -haloRot;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#f59e0b';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}
