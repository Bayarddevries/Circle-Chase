/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Minimap HUD rendering for Circle Chase.
 * Draws a tactical radar overlay in the top-right corner of the canvas.
 */

import { PowerUpOrb } from '../types';

export interface MinimapConfig {
  viewportW: number;
  viewportH: number;
  mapWidth: number;
  mapHeight: number;
  miniW: number;
  miniH: number;
  padding: number;
}

export function getDefaultConfig(viewportW: number, viewportH: number, mapWidth: number, mapHeight: number): MinimapConfig {
  return {
    viewportW,
    viewportH,
    mapWidth,
    mapHeight,
    miniW: 190,
    miniH: 142,
    padding: 16,
  };
}

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  config: MinimapConfig,
  hiderX: number,
  hiderY: number,
  seekerX: number,
  seekerY: number,
  hazards: { x: number; y: number; radius: number; type: string }[],
  bumpers: { x: number; y: number; radius: number }[],
  orbs: PowerUpOrb[],
  isSuddenDeath: boolean,
  shroudEnabled: boolean,
  hiderExploded: boolean,
  activeRole: string,
): void {
  const { miniW, miniH, padding, mapWidth: mW, mapHeight: mH, viewportW: vw } = config;
  const miniX = vw - miniW - padding;
  const miniY = padding;
  const scaleX = miniW / mW;
  const scaleY = miniH / mH;
  const toMiniX = (mx: number) => miniX + mx * scaleX;
  const toMiniY = (my: number) => miniY + my * scaleY;

  ctx.save();

  // 1. Semi-translucent cyber background card
  ctx.fillStyle = 'rgba(7, 10, 15, 0.78)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(miniX, miniY, miniW, miniH, 12);
  } else {
    ctx.rect(miniX, miniY, miniW, miniH);
  }
  ctx.fill();
  ctx.stroke();

  // 2. Grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
  ctx.lineWidth = 0.8;
  const gridStep = 200 * scaleX;
  for (let gx = miniX; gx < miniX + miniW; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, miniY);
    ctx.lineTo(gx, miniY + miniH);
    ctx.stroke();
  }
  for (let gy = miniY; gy < miniY + miniH; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(miniX, gy);
    ctx.lineTo(miniX + miniW, gy);
    ctx.stroke();
  }

  // 3. Hazards
  for (const haz of hazards) {
    const hx = toMiniX(haz.x);
    const hy = toMiniY(haz.y);
    const hr = haz.radius * scaleX;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fillStyle = haz.type === 'sand' ? 'rgba(217, 119, 6, 0.16)' : 'rgba(56, 189, 248, 0.14)';
    ctx.fill();
  }

  // 4. Bumpers
  for (const bump of bumpers) {
    const bx = toMiniX(bump.x);
    const by = toMiniY(bump.y);
    const br = bump.radius * scaleX;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
    ctx.fill();
  }

  // 5. Power-up orbs
  if (!isSuddenDeath) {
    for (const orb of orbs) {
      if (orb.active) {
        const ox = toMiniX(orb.x);
        const oy = toMiniY(orb.y);
        ctx.beginPath();
        ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#22d3ee';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  // 6. Seeker (orange triangle)
  const sx = toMiniX(seekerX);
  const sy = toMiniY(seekerY);
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
    const tx = sx + Math.cos(angle) * 5.5;
    const ty = sy + Math.sin(angle) * 5.5;
    if (i === 0) ctx.moveTo(tx, ty);
    else ctx.lineTo(tx, ty);
  }
  ctx.closePath();
  ctx.fillStyle = '#f97316';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 7. Hider (blue circle - hidden if shroud active)
  if (!shroudEnabled && !hiderExploded) {
    const hx = toMiniX(hiderX);
    const hy = toMiniY(hiderY);
    ctx.beginPath();
    ctx.arc(hx, hy, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // 8. Label
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('TACTICAL RADAR', miniX + 10, miniY + 10);

  // 9. Turn indicator light
  ctx.beginPath();
  ctx.arc(miniX + miniW - 12, miniY + 14, 3, 0, Math.PI * 2);
  ctx.fillStyle = activeRole === 'hider' ? '#38bdf8' : '#f97316';
  ctx.fill();

  ctx.restore();
}
