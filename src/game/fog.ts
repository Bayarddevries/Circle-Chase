/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Fog of war rendering for Circle Chase.
 * Draws a dark shroud everywhere except around the Seeker.
 */

import { FOG_RADIUS, FOG_ALPHA, FOG_EDGE_ALPHA } from '../constants';

export function drawFogOfWar(
  ctx: CanvasRenderingContext2D,
  seekerX: number,
  seekerY: number,
  mapWidth: number,
  mapHeight: number,
): void {
  ctx.save();

  // Solid dark overlay everywhere except inside Seeker visual radius
  ctx.fillStyle = `rgba(6, 8, 12, ${FOG_ALPHA})`;
  ctx.beginPath();
  ctx.rect(0, 0, mapWidth, mapHeight);
  // Inner circle (opposite direction to subtract)
  ctx.arc(seekerX, seekerY, FOG_RADIUS, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();

  // Faint boundary line around fog edge
  ctx.beginPath();
  ctx.arc(seekerX, seekerY, FOG_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(217, 119, 6, ${FOG_EDGE_ALPHA})`;
  ctx.lineWidth = 4;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}
