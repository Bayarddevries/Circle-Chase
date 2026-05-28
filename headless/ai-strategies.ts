/**
 * AI strategies for headless playtesting.
 * Each strategy decides where to aim and how much power to use.
 */

import { GameState, RoundMeta } from './game-state';
import { calculateLaunch } from '../src/game/input';
import { MAP_WIDTH, MAP_HEIGHT, SD_MAP_WIDTH, SD_MAP_HEIGHT, MAX_DRAG, HIDER_BASE_SPEED, SEEKER_SPEED_MULT } from '../src/constants';

export interface Shot {
  angleRad: number;  // direction to aim (in map space)
  power: number;     // 0..1 fraction of MAX_DRAG
}

export interface AIStrategy {
  name: string;
  description: string;
  /** Returns a shot for the current active role, or null to skip */
  decideShot(state: GameState, accuracy?: number): Shot | null;
}

// ── Helpers ──

function activeBall(state: GameState) {
  return state.activeRole === 'hider' ? state.hider : state.seeker;
}

function opponentBall(state: GameState) {
  return state.activeRole === 'hider' ? state.seeker : state.hider;
}

function getMaxSpeed(role: 'hider' | 'seeker'): number {
  return role === 'seeker' ? HIDER_BASE_SPEED * SEEKER_SPEED_MULT : HIDER_BASE_SPEED;
}

/** Convert angle + power to velocity via the same launch calc the game uses */
export function shotToVelocity(state: GameState, shot: Shot): { vx: number; vy: number } | null {
  const ball = activeBall(state);
  const dragDist = Math.max(10, shot.power * MAX_DRAG);
  const dragX = ball.x - dragDist * Math.cos(shot.angleRad);
  const dragY = ball.y - dragDist * Math.sin(shot.angleRad);
  return calculateLaunch(ball.x, ball.y, dragX, dragY, state.activeRole, state.overrides);
}

// ── Random Strategy ──

export class RandomStrategy implements AIStrategy {
  name = 'random';
  description = 'Fires in a random direction at random power. Finds edge cases.';

  decideShot(state: GameState, _accuracy?: number): Shot | null {
    return {
      angleRad: Math.random() * Math.PI * 2,
      power: 0.2 + Math.random() * 0.8,
    };
  }
}

// ── Heuristic Strategy ──

export class HeuristicStrategy implements AIStrategy {
  name = 'heuristic';
  description = 'Aims at opponent with angular noise. accuracy=1.0 is perfect aim, 0.0 is pure noise.';

  decideShot(state: GameState, accuracy?: number): Shot | null {
    const me = activeBall(state);
    const opp = opponentBall(state);
    const dx = opp.x - me.x;
    const dy = opp.y - me.y;
    const baseAngle = Math.atan2(dy, dx);
    // accuracy: 1.0 = perfect aim, 0.0 = ±90° noise, 0.5 = ±45° noise
    const acc = accuracy ?? 0.85;
    const maxNoise = (1 - acc) * Math.PI * 0.5; // at acc=0, noise=±90°
    const noise = (Math.random() - 0.5) * 2 * maxNoise;
    return {
      angleRad: baseAngle + noise,
      power: 0.5 + Math.random() * 0.5,
    };
  }
}

// ── Aggressive Strategy ──

export class AggressiveStrategy implements AIStrategy {
  name = 'aggressive';
  description = 'Full power, direct aim at opponent. Tests seeker dominance.';

  decideShot(state: GameState, _accuracy?: number): Shot | null {
    const me = activeBall(state);
    const opp = opponentBall(state);
    const dx = opp.x - me.x;
    const dy = opp.y - me.y;
    return {
      angleRad: Math.atan2(dy, dx),
      power: 1.0,
    };
  }
}

// ── Evasive Strategy ──

export class EvasiveStrategy implements AIStrategy {
  name = 'evasive';
  description = 'Hider runs away, seeker chases. Tests if hider can survive forever.';

  decideShot(state: GameState, _accuracy?: number): Shot | null {
    const me = activeBall(state);
    const opp = opponentBall(state);
    const dx = opp.x - me.x;
    const dy = opp.y - me.y;
    const awayAngle = Math.atan2(-dy, -dx); // opposite direction

    if (state.activeRole === 'hider') {
      // Run away from seeker at full power
      return { angleRad: awayAngle, power: 0.9 };
    } else {
      // Seeker chases directly
      return { angleRad: Math.atan2(dy, dx), power: 0.8 };
    }
  }
}

// ── Survive Strategy ──

export class SurviveStrategy implements AIStrategy {
  name = 'survive';
  description = 'Hider actively evades: aims away from seeker, uses bumpers as shields. Seeker chases directly.';

  decideShot(state: GameState, _accuracy?: number): Shot | null {
    const me = activeBall(state);
    const opp = opponentBall(state);

    if (state.activeRole === 'hider') {
      // Hider: try to survive

      // 1. Find a bumper that's between us and the seeker (shield)
      let shieldBumper: { x: number; y: number; radius: number } | null = null;
      let bestShieldScore = -Infinity;

      for (const b of state.bumpers) {
        // Check if this bumper is roughly between me and the seeker
        const distToBumper = Math.hypot(b.x - me.x, b.y - me.y);
        const distBumperToOpp = Math.hypot(b.x - opp.x, b.y - opp.y);
        const distMeToOpp = Math.hypot(opp.x - me.x, opp.y - me.y);

        // Shield score: bumper is good if it's between us (closer to midpoint)
        // and not too far away
        if (distToBumper < 400 && distBumperToOpp < distMeToOpp) {
          // Check if bumper is roughly in the line between us
          const midX = (me.x + opp.x) / 2;
          const midY = (me.y + opp.y) / 2;
          const distToMid = Math.hypot(b.x - midX, b.y - midY);
          const shieldScore = 1000 - distToMid - distToBumper * 0.5;
          if (shieldScore > bestShieldScore) {
            bestShieldScore = shieldScore;
            shieldBumper = b;
          }
        }
      }

      // 2. If we found a good shield bumper, aim behind it (away from seeker, through bumper)
      if (shieldBumper) {
        // Aim to put the bumper between us and the seeker
        const awayFromSeeker = Math.atan2(me.y - opp.y, me.x - opp.x);
        // Bias towards the bumper
        const towardsBumper = Math.atan2(shieldBumper.y - me.y, shieldBumper.x - me.x);
        // Blend: 60% away from seeker, 40% towards bumper
        const blendedAngle = awayFromSeeker * 0.6 + towardsBumper * 0.4;
        return { angleRad: blendedAngle, power: 0.8 };
      }

      // 3. No good shield: just run directly away from seeker
      const awayAngle = Math.atan2(me.y - opp.y, me.x - opp.x);

      // Add some variance to avoid predictable movement
      const variance = (Math.random() - 0.5) * 0.3;
      return { angleRad: awayAngle + variance, power: 0.85 + Math.random() * 0.15 };
    } else {
      // Seeker: chase directly at hider (with accuracy noise applied by caller)
      const dx = opp.x - me.x;
      const dy = opp.y - me.y;
      return { angleRad: Math.atan2(dy, dx), power: 0.8 };
    }
  }
}

export class PassiveStrategy implements AIStrategy {
  name = 'passive';
  description = 'Minimal power shots. Tests if game stalls, turn-swap bugs.';

  decideShot(state: GameState, _accuracy?: number): Shot | null {
    return {
      angleRad: Math.random() * Math.PI * 2,
      power: 0.1 + Math.random() * 0.2,
    };
  }
}

// ── Bumper-Chaser Strategy ──

export class BumperChaserStrategy implements AIStrategy {
  name = 'bumper_chaser';
  description = 'Aims at nearby bumpers for combo scoring. Tests scoring system.';

  decideShot(state: GameState, _accuracy?: number): Shot | null {
    const me = activeBall(state);

    // Find nearest bumper
    let best: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    for (const b of state.bumpers) {
      const d = Math.hypot(b.x - me.x, b.y - me.y);
      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }

    if (best && bestDist < 600) {
      const dx = best.x - me.x;
      const dy = best.y - me.y;
      return { angleRad: Math.atan2(dy, dx), power: 0.6 + Math.random() * 0.3 };
    }

    // Fallback: random
    return {
      angleRad: Math.random() * Math.PI * 2,
      power: 0.3 + Math.random() * 0.5,
    };
  }
}

// ── Registry ──

export const STRATEGIES: Record<string, AIStrategy> = {
  random: new RandomStrategy(),
  heuristic: new HeuristicStrategy(),
  aggressive: new AggressiveStrategy(),
  evasive: new EvasiveStrategy(),
  survive: new SurviveStrategy(),
  passive: new PassiveStrategy(),
  bumper_chaser: new BumperChaserStrategy(),
};

export function getStrategy(name: string): AIStrategy {
  const s = STRATEGIES[name];
  if (!s) {
    throw new Error(`Unknown AI strategy "${name}". Available: ${Object.keys(STRATEGIES).join(', ')}`);
  }
  return s;
}
