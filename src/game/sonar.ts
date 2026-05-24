/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sonar ping system for Circle Chase.
 * Manages expanding sonar rings that reveal the Hider's position.
 */

import { SonarPing } from '../types';
import {
  SONAR_INTERVAL,
  SONAR_SPEED,
  SONAR_MAX_RADIUS,
  SONAR_START_RADIUS,
  FOG_RADIUS,
} from '../constants';

// ── Update ───────────────────────────────────────────

export function updateSonarPings(pings: SonarPing[]): void {
  for (let i = pings.length - 1; i >= 0; i--) {
    const ping = pings[i];
    ping.radius += ping.speed;
    ping.alpha = Math.max(0, 1 - (ping.radius / ping.maxRadius));
    if (ping.radius >= ping.maxRadius) {
      pings.splice(i, 1);
    }
  }
}

// ── Auto-spawn ───────────────────────────────────────

export function maybeSpawnSonarPing(
  pings: SonarPing[],
  lastPingTime: number,
  now: number,
  hiderX: number,
  hiderY: number,
  seekerX: number,
  seekerY: number,
  activeRole: string,
  isSuddenDeath: boolean,
): number {
  if (now - lastPingTime > SONAR_INTERVAL) {
    const d = Math.hypot(hiderX - seekerX, hiderY - seekerY);
    const inFog = d > FOG_RADIUS;
    if (inFog && activeRole === 'seeker' && !isSuddenDeath) {
      pings.push({
        x: hiderX,
        y: hiderY,
        radius: SONAR_START_RADIUS,
        maxRadius: SONAR_MAX_RADIUS,
        alpha: 1,
        speed: SONAR_SPEED,
      });
    }
    return now;
  }
  return lastPingTime;
}

// ── Draw ─────────────────────────────────────────────

export function drawSonarPings(ctx: CanvasRenderingContext2D, pings: SonarPing[]): void {
  for (const ping of pings) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(34, 211, 238, ${ping.alpha})`;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#22d3ee';
    ctx.stroke();
    ctx.restore();
  }
}
