import { PlayerBall, AIDifficulty } from '../types';
import {
  AI_EASY_ERROR,
  AI_THINK_DELAY,
  MAX_DRAG,
  HIDER_BASE_SPEED,
  SEEKER_SPEED_MULT,
} from '../constants';

export interface AimingState {
  active: boolean;
  startTime: number;
  launchDelay: number; // ms before AI fires after aiming starts
  targetVx: number;
  targetVy: number;
}

// Difficulty → aim error mapping
function getAimError(difficulty: AIDifficulty): number {
  switch (difficulty) {
    case 'easy': return AI_EASY_ERROR;       // 0.15
    case 'medium': return 0.08;
    case 'hard': return 0.03;
  }
}

// Thinking delay per difficulty (ms)
function getThinkDelay(difficulty: AIDifficulty): number {
  switch (difficulty) {
    case 'easy': return AI_THINK_DELAY * 1.5;  // 1500ms
    case 'medium': return AI_THINK_DELAY;       // 1000ms
    case 'hard': return AI_THINK_DELAY * 0.6;   // 600ms
  }
}

/**
 * Calculate AI launch velocity toward the hider.
 * Uses direct aim at hider position with difficulty-based error.
 * Returns {vx, vy} or null if not ready to fire.
 */
export function calculateAIFiring(
  hider: PlayerBall,
  seeker: PlayerBall,
  difficulty: AIDifficulty,
): { vx: number; vy: number } {
  const aimError = getAimError(difficulty);

  // Direction from seeker to hider
  const dx = hider.x - seeker.x;
  const dy = hider.y - seeker.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { vx: 0, vy: 0 };

  // Apply aim error: rotate the aim direction by a random offset
  const baseAngle = Math.atan2(dy, dx);
  const errorAngle = baseAngle + (Math.random() - 0.5) * aimError * Math.PI;
  const dirX = Math.cos(errorAngle);
  const dirY = Math.sin(errorAngle);

  // Full power shot
  const vMax = HIDER_BASE_SPEED * SEEKER_SPEED_MULT;
  const launchSpeed = vMax * 0.9; // 90% power — slightly imperfect

  return {
    vx: dirX * launchSpeed,
    vy: dirY * launchSpeed,
  };
}

/**
 * Start the AI aiming sequence. Returns initial aiming state.
 */
export function startAIAiming(
  hider: PlayerBall,
  seeker: PlayerBall,
  difficulty: AIDifficulty,
): AimingState {
  const launchDelay = getThinkDelay(difficulty);
  const target = calculateAIFiring(hider, seeker, difficulty);

  return {
    active: true,
    startTime: performance.now(),
    launchDelay,
    targetVx: target.vx,
    targetVy: target.vy,
  };
}

/**
 * Check if AI is ready to fire (thinking delay elapsed).
 */
export function isAIReadyToFire(state: AimingState, now: number): boolean {
  return state.active && (now - state.startTime >= state.launchDelay);
}

/**
 * Get the launch vector when AI is ready to fire.
 */
export function getAIFiringVector(state: AimingState): { vx: number; vy: number } {
  return { vx: state.targetVx, vy: state.targetVy };
}

/**
 * Reset AI aiming state (call after AI fires or on turn change).
 */
export function resetAIAiming(): AimingState {
  return {
    active: false,
    startTime: 0,
    launchDelay: 0,
    targetVx: 0,
    targetVy: 0,
  };
}
