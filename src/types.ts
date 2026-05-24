/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlayerRole = 'hider' | 'seeker';

export type PowerUpType = 'laser' | 'superball' | 'iron' | 'sonar' | 'cloak' | 'magnet';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type GamePhase = 
  | 'menu' 
  | 'round_intro' // Showing roles before starting
  | 'playing' 
  | 'tag_freeze' // Stun micro-moment
  | 'round_over' // Summary of score for the round
  | 'match_over' // Full match winner declaration
  | 'sudden_death_intro'; // Dramatic alert for tie breaker

export interface Vector2D {
  x: number;
  y: number;
}

export interface PlayerBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  role: PlayerRole;
  name: string;
}

export interface NeonBumper {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  pulseTimer: number;
}

export interface HazardPatch {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'sand' | 'ice';
}

export interface PowerUpOrb {
  x: number;
  y: number;
  radius: number;
  type: PowerUpType;
  active: boolean;
  pulseScale: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  type?: 'spark' | 'debris' | 'shockwave_ring' | 'glass';
  angle?: number;
  spin?: number;
  bounces?: number;
  heavy?: boolean;
}

export interface SonarPing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

export interface RoundRecord {
  roundIndex: number; // 0-based index
  p1Role: PlayerRole; // Role of player 1 in this round
  p2Role: PlayerRole; // Role of player 2 in this round
  turnsSurvived: number; // Score achieved by the Hider
  roundWinner: string; // Name of the winner of this round (the Seeker if quick, otherwise Hider)
  hiderName: string;
  seekerName: string;
}

export interface RoundMeta {
  turnsSurvived: number;
  powerUpCollected: boolean;
  bumperHits: number;
  tagTurn: number;
}

export interface ScoreBreakdown {
  base: number;
  distanceBonus: number;
  quickTagBonus: number;
  comboBonus: number;
  nearMissBonus: number;
  powerUpBonus: number;
  streakBonus: number;
  total: number;
}

export interface MatchConfig {
  p1Name: string;
  p2Name: string;
  bestOfRounds: number; // E.g., 3, 5, 7. First to win more than half or highest total score.
  isCpu?: boolean;
  difficulty?: AIDifficulty;
  colorblindMode?: boolean;
}
