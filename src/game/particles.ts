/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Particle system for Circle Chase.
 * Handles spawning, updating, and drawing all particle effects.
 */

import { Particle } from '../types';
import {
  TAG_SPARKS,
  TAG_DEBRIS,
  TAG_GLASS,
  TAG_SHOCKWAVE_SPEED,
  PARTICLE_BOUNCE_REST,
  PARTICLE_GRAVITY,
  BUMPER_PARTICLES,
  ORB_COLLECT_PARTICLES,
  LAUNCH_SPARKS,
} from '../constants';

// ── Update ───────────────────────────────────────────

export function updateParticles(
  particles: Particle[],
  slowMotion: number,
  mapWidth: number,
  mapHeight: number,
): void {
  const pSpeedScale = Math.max(0.2, slowMotion);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx * pSpeedScale;
    p.y += p.vy * pSpeedScale;

    if (p.heavy) {
      p.vy += PARTICLE_GRAVITY * pSpeedScale;
    }

    if (p.spin !== undefined && p.angle !== undefined) {
      p.angle += p.spin * pSpeedScale;
    }

    // Elastic boundary wall reflections for debris/glass
    if (p.type === 'debris' || p.type === 'glass') {
      const bounceRest = PARTICLE_BOUNCE_REST;

      if (p.x - p.radius < 0) {
        p.x = p.radius;
        p.vx = -p.vx * bounceRest;
        if (p.spin !== undefined) p.spin = -p.spin * 0.8;
      } else if (p.x + p.radius > mapWidth) {
        p.x = mapWidth - p.radius;
        p.vx = -p.vx * bounceRest;
        if (p.spin !== undefined) p.spin = -p.spin * 0.8;
      }

      if (p.y - p.radius < 0) {
        p.y = p.radius;
        p.vy = -p.vy * bounceRest;
        if (p.spin !== undefined) p.spin = -p.spin * 0.8;
      } else if (p.y + p.radius > mapHeight) {
        p.y = mapHeight - p.radius;
        p.vy = -p.vy * bounceRest;
        if (p.spin !== undefined) p.spin = -p.spin * 0.8;
      }
    }

    const decayMultiplier = slowMotion < 1.0 ? 0.55 : 1.0;
    p.alpha -= p.decay * decayMultiplier;

    if (p.alpha <= 0 || p.radius <= 0) {
      particles.splice(i, 1);
    }
  }
}

// ── Update shockwave ─────────────────────────────────

export function updateShockwave(
  shockwave: { x: number; y: number; r: number; maxR: number; active: boolean } | null,
): void {
  if (shockwave && shockwave.active) {
    shockwave.r += TAG_SHOCKWAVE_SPEED;
    if (shockwave.r >= shockwave.maxR) {
      shockwave.active = false;
    }
  }
}

// ── Draw ─────────────────────────────────────────────

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.shadowBlur = p.type === 'debris' || p.type === 'glass' ? 14 : 8;
    ctx.shadowColor = p.color;

    if ((p.type === 'debris' || p.type === 'glass') && p.angle !== undefined) {
      // Rotating shard
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;

      ctx.beginPath();
      if (p.type === 'glass') {
        ctx.moveTo(-p.radius, 0);
        ctx.lineTo(0, -p.radius * 1.6);
        ctx.lineTo(p.radius, 0);
        ctx.lineTo(0, p.radius * 0.9);
      } else {
        ctx.moveTo(-p.radius, -p.radius * 0.6);
        ctx.lineTo(p.radius * 0.8, -p.radius * 1.3);
        ctx.lineTo(p.radius, p.radius);
        ctx.lineTo(-p.radius * 0.6, p.radius * 0.8);
      }
      ctx.closePath();
      ctx.fill();

      // Highlight strip
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-p.radius * 0.4, 0);
      ctx.lineTo(p.radius * 0.4, 0);
      ctx.stroke();
    } else {
      // Circular spark
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── Spawn: Tag event (full explosion) ────────────────

export function spawnTagParticles(
  hiderX: number,
  hiderY: number,
  seekerX: number,
  seekerY: number,
): Particle[] {
  const centerTagX = (hiderX + seekerX) / 2;
  const centerTagY = (hiderY + seekerY) / 2;
  const parts: Particle[] = [];

  // Core combustion sparks
  for (let i = 0; i < TAG_SPARKS; i++) {
    const angle = (i / TAG_SPARKS) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const speed = 8 + Math.random() * 26;
    parts.push({
      x: centerTagX,
      y: centerTagY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 5,
      color: i % 3 === 0 ? '#ea580c' : (i % 3 === 1 ? '#d97706' : '#ffffff'),
      alpha: 1.0,
      decay: 0.012 + Math.random() * 0.01,
      type: 'spark',
    });
  }

  // Heavy bouncing debris shards
  for (let i = 0; i < TAG_DEBRIS; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 7 + Math.random() * 24;
    parts.push({
      x: hiderX,
      y: hiderY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4.5 + Math.random() * 8.5,
      color: i % 2 === 0 ? '#38bdf8' : '#ffffff',
      alpha: 1.0,
      decay: 0.0035 + Math.random() * 0.004,
      type: 'debris',
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.45,
      heavy: true,
    });
  }

  // Glass fragments
  for (let i = 0; i < TAG_GLASS; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 12 + Math.random() * 30;
    parts.push({
      x: centerTagX,
      y: centerTagY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 3 + Math.random() * 5.5,
      color: '#e0f2fe',
      alpha: 1.0,
      decay: 0.005 + Math.random() * 0.006,
      type: 'glass',
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.65,
    });
  }

  return parts;
}

// ── Spawn: Bumper hit ───────────────────────────────

export function spawnBumperParticles(
  bumperX: number,
  bumperY: number,
  bumperRadius: number,
  nx: number,
  ny: number,
  color: string,
): Particle[] {
  const parts: Particle[] = [];
  for (let i = 0; i < BUMPER_PARTICLES; i++) {
    parts.push({
      x: bumperX + nx * bumperRadius,
      y: bumperY + ny * bumperRadius,
      vx: nx * 3 + (Math.random() - 0.5) * 4,
      vy: ny * 3 + (Math.random() - 0.5) * 4,
      radius: 3 + Math.random() * 3,
      color,
      alpha: 1,
      decay: 0.03 + Math.random() * 0.03,
    });
  }
  return parts;
}

// ── Spawn: Orb collection ────────────────────────────

export function spawnOrbParticles(orbX: number, orbY: number): Particle[] {
  const parts: Particle[] = [];
  for (let i = 0; i < ORB_COLLECT_PARTICLES; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 6;
    parts.push({
      x: orbX,
      y: orbY,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      radius: 3 + Math.random() * 3,
      color: '#00ffff',
      alpha: 1,
      decay: 0.02 + Math.random() * 0.02,
    });
  }
  return parts;
}

// ── Spawn: Launch sparks ─────────────────────────────

export function spawnLaunchParticles(
  ballX: number,
  ballY: number,
  ballVx: number,
  ballVy: number,
  isSeeker: boolean,
): Particle[] {
  const parts: Particle[] = [];
  for (let i = 0; i < LAUNCH_SPARKS; i++) {
    parts.push({
      x: ballX,
      y: ballY,
      vx: -ballVx * 0.35 + (Math.random() - 0.5) * 5,
      vy: -ballVy * 0.35 + (Math.random() - 0.5) * 5,
      radius: 2.5 + Math.random() * 3.5,
      color: isSeeker ? '#ffaa00' : '#ffffff',
      alpha: 0.9,
      decay: 0.02 + Math.random() * 0.03,
    });
  }
  return parts;
}
