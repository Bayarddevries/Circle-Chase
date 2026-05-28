/**
 * Headless game state — plain objects, no React.
 * Mirrors the state that GameCanvas holds in refs + React state.
 */

import { PlayerBall, NeonBumper, HazardPatch, PowerUpOrb, PlayerRole, PowerUpType, AIDifficulty } from '../src/types';
import { MAP_WIDTH, MAP_HEIGHT, SD_MAP_WIDTH, SD_MAP_HEIGHT, HIDER_RADIUS, SEEKER_RADIUS } from '../src/constants';
import { generateMap } from '../src/game/map';
import { AimingState, resetAIAiming } from '../src/game/ai';

export interface RoundMeta {
  turnsSurvived: number;
  powerUpCollector: 'hider' | 'seeker' | null;
  bumperHits: number;
  tagTurn: number;
}

export interface GameState {
  // Ball state
  hider: PlayerBall;
  seeker: PlayerBall;

  // Map
  bumpers: NeonBumper[];
  hazards: HazardPatch[];
  orbs: PowerUpOrb[];
  mapWidth: number;
  mapHeight: number;

  // Game flow
  phase: 'round_intro' | 'playing' | 'tag_freeze' | 'round_over' | 'match_over' | 'sudden_death_intro';
  activeRole: PlayerRole;
  ballsMoving: boolean;
  turnNumber: number;
  roundNumber: number;
  isSuddenDeath: boolean;

  // Scoring
  roundMeta: RoundMeta;
  p1Score: number;
  p2Score: number;
  p1Role: PlayerRole; // which role P1 has this round

  // Power-up
  activePowerUp: PowerUpType | null;
  powerUpDuration: number;

  // Physics refs (plain objects, not React refs)
  slowMotion: number;
  shakeAmt: number;
  hiderFrozen: number;

  // Tracking
  comboCount: number;
  nearMissTriggered: boolean;
  minDistance: number;
  vampireActive: boolean;

  // AI
  aiState: AimingState;
  cpuFiredThisTurn: boolean;
  cpuHiderFiredThisTurn: boolean;
  aiDifficulty: AIDifficulty;
  isCpu: boolean;

  // Parameter overrides for sweep testing
  overrides?: { HIDER_BASE_SPEED?: number; SEEKER_SPEED_MULT?: number };

  // Tag freeze timer
  tagFreezeRemaining: number;
}

export interface MatchConfig {
  p1Name: string;
  p2Name: string;
  bestOfRounds: number;
  isCpu: boolean;
  difficulty: AIDifficulty;
  gameMode: 'standard' | 'survival';
  /** Aim accuracy 0.0-1.0 (1.0 = perfect aim). Default 0.85 simulates medium AI. */
  accuracy?: number;
  /** Separate accuracy for seeker role (if not set, uses accuracy). Simulates human seeker with fog-of-war handicap. */
  seekerAccuracy?: number;
  /** Separate accuracy for hider role (if not set, uses accuracy). */
  hiderAccuracy?: number;
}

export function createInitialState(config: MatchConfig, roundNumber: number, isSuddenDeath: boolean): GameState {
  const mapWidth = isSuddenDeath ? SD_MAP_WIDTH : MAP_WIDTH;
  const mapHeight = isSuddenDeath ? SD_MAP_HEIGHT : MAP_HEIGHT;
  const generated = generateMap(isSuddenDeath, config.p1Name, config.p2Name);

  // In standard mode, P1 is hider on even rounds, seeker on odd
  // In survival mode, P1 is always hider
  const p1IsHider = config.gameMode === 'survival' || roundNumber % 2 === 0;
  const p1Role: PlayerRole = p1IsHider ? 'hider' : 'seeker';

  return {
    hider: { ...generated.hider, vx: 0, vy: 0 },
    seeker: { ...generated.seeker, vx: 0, vy: 0 },
    bumpers: generated.bumpers,
    hazards: generated.hazards,
    orbs: generated.orbs,
    mapWidth,
    mapHeight,
    phase: 'playing',
    activeRole: 'hider',  // hider always goes first
    ballsMoving: false,
    turnNumber: 0,
    roundNumber,
    isSuddenDeath,
    roundMeta: {
      turnsSurvived: 0,
      powerUpCollector: null,
      bumperHits: 0,
      tagTurn: 0,
    },
    p1Score: 0,
    p2Score: 0,
    p1Role,
    activePowerUp: null,
    powerUpDuration: 0,
    slowMotion: 1.0,
    shakeAmt: 0,
    hiderFrozen: 0,
    comboCount: 0,
    nearMissTriggered: false,
    minDistance: Infinity,
    vampireActive: false,
    aiState: resetAIAiming(),
    cpuFiredThisTurn: false,
    cpuHiderFiredThisTurn: false,
    aiDifficulty: config.difficulty,
    isCpu: config.isCpu,
    tagFreezeRemaining: 0,
  };
}
