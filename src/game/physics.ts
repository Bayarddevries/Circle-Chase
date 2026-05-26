/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Physics engine for Circle Chase.
 * Handles sub-stepping, boundary collisions, bumper collisions, friction, and tag detection.
 */

import {
  SUBSTEPS,
  FRICTION_BASE,
  FRICTION_SEEKER,
  FRICTION_SLOWMO,
  FRICTION_SAND_MULT,
  FRICTION_ICE,
  STOP_THRESHOLD,
  BOUNCE_REST_NORMAL,
  BOUNCE_REST_SLOWMO,
  BOUNCE_REST_SUPERBALL,
  BUMPER_REST,
  BUMPER_REST_SUPERBALL,
  BUMPER_BOOST_NORMAL,
  BUMPER_BOOST_SUPERBALL,
  BUMPER_MIN_SPEED,
  BUMPER_KICK_SPEED,
  BUMPER_PULSE_DURATION,
  SHAKE_BUMPER_ADD,
  SHAKE_MAX,
  ORB_RADIUS,
} from '../constants';
import { PlayerBall, NeonBumper, HazardPatch, PowerUpOrb, PowerUpType } from '../types';
import { spawnBumperParticles, spawnOrbParticles } from './particles';

export interface PhysicsState {
  hider: PlayerBall;
  seeker: PlayerBall;
  bumpers: NeonBumper[];
  hazards: HazardPatch[];
  orbs: PowerUpOrb[];
  slowMotionRef: { current: number };
  activePowerUp: PowerUpType | null;
  shakeAmtRef: { current: number };
  particlesRef: { current: any[] };
  mapWidth: number;
  mapHeight: number;
}

export interface PhysicsCallbacks {
  onTag: () => void;
  onOrbCollect: (orbType: PowerUpType) => void;
  onBumperHit: () => void;
}

export function physicsStep(
  state: PhysicsState,
  callbacks: PhysicsCallbacks,
): void {
  const {
    hider, seeker, bumpers, hazards, orbs,
    slowMotionRef, activePowerUp, shakeAmtRef, particlesRef,
    mapWidth, mapHeight,
  } = state;

  const subStepsCount = SUBSTEPS;
  const speedScale = slowMotionRef.current;

  for (let s = 0; s < subStepsCount; s++) {
    // Move players
    hider.x += (hider.vx / subStepsCount) * speedScale;
    hider.y += (hider.vy / subStepsCount) * speedScale;
    seeker.x += (seeker.vx / subStepsCount) * speedScale;
    seeker.y += (seeker.vy / subStepsCount) * speedScale;

    // --- Boundary collisions ---
    const isExploding = slowMotionRef.current < 1.0;
    const hiderRest = isExploding ? BOUNCE_REST_SLOWMO : BOUNCE_REST_NORMAL;
    const seekerRest = isExploding ? BOUNCE_REST_SLOWMO : ((activePowerUp === 'superball') ? BOUNCE_REST_SUPERBALL : BOUNCE_REST_NORMAL);

    // Hider borders
    if (hider.x - hider.radius < 0) {
      hider.x = hider.radius;
      hider.vx = -hider.vx * hiderRest;
    } else if (hider.x + hider.radius > mapWidth) {
      hider.x = mapWidth - hider.radius;
      hider.vx = -hider.vx * hiderRest;
    }
    if (hider.y - hider.radius < 0) {
      hider.y = hider.radius;
      hider.vy = -hider.vy * hiderRest;
    } else if (hider.y + hider.radius > mapHeight) {
      hider.y = mapHeight - hider.radius;
      hider.vy = -hider.vy * hiderRest;
    }

    // Seeker borders
    if (seeker.x - seeker.radius < 0) {
      seeker.x = seeker.radius;
      seeker.vx = -seeker.vx * seekerRest;
    } else if (seeker.x + seeker.radius > mapWidth) {
      seeker.x = mapWidth - seeker.radius;
      seeker.vx = -seeker.vx * seekerRest;
    }
    if (seeker.y - seeker.radius < 0) {
      seeker.y = seeker.radius;
      seeker.vy = -seeker.vy * seekerRest;
    } else if (seeker.y + seeker.radius > mapHeight) {
      seeker.y = mapHeight - seeker.radius;
      seeker.vy = -seeker.vy * seekerRest;
    }

    // --- Bumper collisions ---
    const handleBumperCollision = (ball: PlayerBall, isSeeker: boolean) => {
      for (const b of bumpers) {
        const dist = Math.hypot(ball.x - b.x, ball.y - b.y);
        const rSum = ball.radius + b.radius;
        if (dist < rSum) {
          const nx = (ball.x - b.x) / dist;
          const ny = (ball.y - b.y) / dist;
          ball.x = b.x + nx * rSum;
          ball.y = b.y + ny * rSum;

          const vn = ball.vx * nx + ball.vy * ny;
          if (vn < 0) {
            let e = BUMPER_REST;
            if (isSeeker && activePowerUp === 'superball') {
              e = BUMPER_REST_SUPERBALL;
            }
            ball.vx = ball.vx - (1 + e) * vn * nx;
            ball.vy = ball.vy - (1 + e) * vn * ny;

            const currentSpeed = Math.hypot(ball.vx, ball.vy);
            const boostFactor = (isSeeker && activePowerUp === 'superball') ? BUMPER_BOOST_SUPERBALL : BUMPER_BOOST_NORMAL;
            if (currentSpeed < BUMPER_MIN_SPEED) {
              ball.vx = nx * BUMPER_KICK_SPEED * boostFactor;
              ball.vy = ny * BUMPER_KICK_SPEED * boostFactor;
            } else {
              ball.vx *= boostFactor;
              ball.vy *= boostFactor;
            }

            b.pulseTimer = BUMPER_PULSE_DURATION;
            shakeAmtRef.current = Math.min(shakeAmtRef.current + SHAKE_BUMPER_ADD, SHAKE_MAX);
            particlesRef.current.push(...spawnBumperParticles(b.x, b.y, b.radius, nx, ny, b.color));
            callbacks.onBumperHit();
          }
        }
      }
    };

    handleBumperCollision(hider, false);
    handleBumperCollision(seeker, true);

    // --- Tag detection ---
    const distToTag = Math.hypot(seeker.x - hider.x, seeker.y - hider.y);
    if (distToTag < hider.radius + seeker.radius) {
      callbacks.onTag();
      return;
    }

    // --- Orb pickup ---
    for (const orb of orbs) {
      if (orb.active) {
        const distToOrb = Math.hypot(seeker.x - orb.x, seeker.y - orb.y);
        if (distToOrb < seeker.radius + orb.radius) {
          orb.active = false;
          callbacks.onOrbCollect(orb.type);
          particlesRef.current.push(...spawnOrbParticles(orb.x, orb.y));
        }
      }
    }
  }

  // --- Friction ---
  const applyFriction = (ball: PlayerBall, isSeeker: boolean) => {
    let baseFriction = isSeeker ? FRICTION_SEEKER : FRICTION_BASE;
    if (slowMotionRef.current < 1.0) baseFriction = FRICTION_SLOWMO;

    let enteredSand = false;
    let enteredIce = false;
    for (const hp of hazards) {
      const d = Math.hypot(ball.x - hp.x, ball.y - hp.y);
      if (d < hp.radius + ball.radius) {
        if (hp.type === 'sand') enteredSand = true;
        else if (hp.type === 'ice') enteredIce = true;
      }
    }

    if (enteredSand) {
      if (slowMotionRef.current < 1.0) {
        ball.vx *= baseFriction;
        ball.vy *= baseFriction;
      } else if (isSeeker && activePowerUp === 'iron') {
        ball.vx *= baseFriction;
        ball.vy *= baseFriction;
        if (Math.hypot(ball.vx, ball.vy) > 1 && Math.random() < 0.3) {
          particlesRef.current.push({
            x: ball.x, y: ball.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: 2, color: '#ca8a04', alpha: 0.6, decay: 0.05,
          });
        }
      } else {
        ball.vx *= baseFriction * FRICTION_SAND_MULT;
        ball.vy *= baseFriction * FRICTION_SAND_MULT;
      }
    } else if (enteredIce) {
      ball.vx *= FRICTION_ICE;
      ball.vy *= FRICTION_ICE;
    } else {
      ball.vx *= baseFriction;
      ball.vy *= baseFriction;
    }

    if (Math.hypot(ball.vx, ball.vy) < STOP_THRESHOLD && slowMotionRef.current >= 1.0) {
      ball.vx = 0;
      ball.vy = 0;
    }
  };

  applyFriction(hider, false);
  applyFriction(seeker, true);
}
