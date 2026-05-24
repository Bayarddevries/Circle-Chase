/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Camera system for Circle Chase.
 * Handles viewport tracking, zoom, lerp, shake, and canvas transform.
 */

import {
  CAM_LERP_POS,
  CAM_LERP_ZOOM,
} from '../constants';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function updateCamera(
  camera: Camera,
  targetX: number,
  targetY: number,
  targetZoom: number,
): void {
  camera.x += (targetX - camera.x) * CAM_LERP_POS;
  camera.y += (targetY - camera.y) * CAM_LERP_POS;
  camera.zoom += (targetZoom - camera.zoom) * CAM_LERP_ZOOM;
}

export function applyCameraTransform(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  shakeX: number,
  shakeY: number,
  viewportW: number,
  viewportH: number,
): void {
  ctx.save();
  ctx.translate(viewportW / 2, viewportH / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
}

export function restoreCameraTransform(ctx: CanvasRenderingContext2D): void {
  ctx.restore();
}
