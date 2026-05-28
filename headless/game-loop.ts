/**
 * Headless game loop.
 * Runs physics steps, detects ball rest, handles turn swaps, tags, scoring.
 * No rendering, no React, no DOM.
 */

import { GameState, createInitialState, RoundMeta, MatchConfig } from './game-state';
import { physicsStep, PhysicsState, PhysicsCallbacks } from '../src/game/physics';
import { calculateRoundScore } from '../src/game/scoring';
import { AIStrategy, shotToVelocity } from './ai-strategies';
import { DELTA_CAP, TAG_FREEZE_TIME, STOP_THRESHOLD, HIDER_BASE_SPEED, SEEKER_SPEED_MULT } from '../src/constants';
import { PowerUpType, PlayerRole } from '../src/types';

export interface LogEntry {
  type: 'frame' | 'event';
  frame: number;
  timestamp: number;
  // Frame fields
  phase?: string;
  turnNumber?: number;
  activeRole?: string;
  hider?: { x: number; y: number; vx: number; vy: number };
  seeker?: { x: number; y: number; vx: number; vy: number };
  activePowerUp?: string | null;
  ballsMoving?: boolean;
  roundMeta?: {
    turnsSurvived: number;
    bumperHits: number;
    powerUpCollector: string | null;
    tagTurn: number;
  };
  // Event fields
  eventType?: string;
  data?: Record<string, unknown>;
}

export interface RoundResult {
  roundIndex: number;
  isSuddenDeath: boolean;
  turnsSurvived: number;
  hiderScore: number;
  seekerScore: number;
  winner: 'hider' | 'seeker';
  events: LogEntry[];
  finalPhase: string;
}

export interface MatchResult {
  matchIndex: number;
  config: MatchConfig;
  strategy: string;
  rounds: RoundResult[];
  finalP1Score: number;
  finalP2Score: number;
  winner: 'p1' | 'p2' | 'tie';
  totalFrames: number;
  totalEvents: number;
  events: LogEntry[];
  durationMs: number;
}

const FIXED_DELTA = 16.67; // ~60fps
const MAX_FRAMES_PER_ROUND = 60 * 60 * 5; // 5 minutes at 60fps = 18000 frames
const MAX_TURNS_PER_ROUND = 100; // force end after 100 turns even without tag

export function runMatch(
  config: MatchConfig,
  strategy: AIStrategy,
  matchIndex: number,
  overrides?: { HIDER_BASE_SPEED?: number; SEEKER_SPEED_MULT?: number },
): MatchResult {
  const startTime = Date.now();
  const allEvents: LogEntry[] = [];
  const rounds: RoundResult[] = [];
  let p1TotalScore = 0;
  let p2TotalScore = 0;
  let roundNumber = 0;
  let isSuddenDeath = false;
  let totalFrames = 0;

  const maxRounds = config.bestOfRounds;

  while (roundNumber < maxRounds) {
    const roundResult = runRound(config, strategy, roundNumber, isSuddenDeath, overrides);
    rounds.push(roundResult);
    totalFrames += roundResult.events.filter(e => e.type === 'frame').length;
    allEvents.push(...roundResult.events);

    // Scoring: P1 is hider on even rounds in standard mode
    const p1IsHider = config.gameMode === 'survival' || roundNumber % 2 === 0;
    if (p1IsHider) {
      p1TotalScore += roundResult.hiderScore;
      p2TotalScore += roundResult.seekerScore;
    } else {
      p1TotalScore += roundResult.seekerScore;
      p2TotalScore += roundResult.hiderScore;
    }

    // Check if match is over
    const winsNeeded = Math.floor(maxRounds / 2) + 1;
    const p1Wins = rounds.filter(r => {
      const p1IsHiderR = config.gameMode === 'survival' || r.roundIndex % 2 === 0;
      return (p1IsHiderR && r.winner === 'hider') || (!p1IsHiderR && r.winner === 'seeker');
    }).length;
    const p2Wins = rounds.length - p1Wins;

    if (p1Wins >= winsNeeded || p2Wins >= winsNeeded) {
      break;
    }

    // Check for tie → sudden death
    if (roundNumber === maxRounds - 1 && p1Wins === p2Wins) {
      isSuddenDeath = true;
      roundNumber++;
      continue; // play sudden death round
    }

    roundNumber++;
  }

  const winner = p1TotalScore > p2TotalScore ? 'p1' : p2TotalScore > p1TotalScore ? 'p2' : 'tie';

  return {
    matchIndex,
    config,
    strategy: strategy.name,
    rounds,
    finalP1Score: p1TotalScore,
    finalP2Score: p2TotalScore,
    winner,
    totalFrames,
    totalEvents: allEvents.filter(e => e.type === 'event').length,
    events: allEvents,
    durationMs: Date.now() - startTime,
  };
}

function runRound(
  config: MatchConfig,
  strategy: AIStrategy,
  roundNumber: number,
  isSuddenDeath: boolean,
  overrides?: { HIDER_BASE_SPEED?: number; SEEKER_SPEED_MULT?: number },
): RoundResult {
  const state = createInitialState(config, roundNumber, isSuddenDeath);
  state.overrides = overrides;
  const events: LogEntry[] = [];
  let frameCount = 0;
  let tagOccurred = false;

  // Physics callbacks
  const callbacks: PhysicsCallbacks = {
    onTag: () => {
      tagOccurred = true;
      state.roundMeta.tagTurn = state.turnNumber;
      state.vampireActive = state.activePowerUp === 'vampire';
      // Apply tag recoil
      const h = state.hider;
      const s = state.seeker;
      const recoilAngle = Math.atan2(h.y - s.y, h.x - s.x);
      const TAG_RECOIL_HIDER = 8;
      const TAG_RECOIL_SEEKER = 6;
      h.vx = Math.cos(recoilAngle) * TAG_RECOIL_HIDER;
      h.vy = Math.sin(recoilAngle) * TAG_RECOIL_HIDER;
      s.vx = -Math.cos(recoilAngle) * TAG_RECOIL_SEEKER;
      s.vy = -Math.sin(recoilAngle) * TAG_RECOIL_SEEKER;

      events.push({
        type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
        eventType: 'tag_attempt',
        data: { tagTurn: state.turnNumber, distance: Math.hypot(h.x - s.x, h.y - s.y) },
      });
      events.push({
        type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
        eventType: 'tag_freeze',
        data: {},
      });
    },
    onOrbCollect: (orbType: PowerUpType) => {
      state.activePowerUp = orbType;
      state.powerUpDuration = 2;
      state.roundMeta.powerUpCollector = state.activeRole;
      events.push({
        type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
        eventType: 'powerup_collect',
        data: { orbType, collector: state.activeRole },
      });
    },
    onBumperHit: () => {
      state.comboCount++;
      state.roundMeta.bumperHits++;
      events.push({
        type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
        eventType: 'bumper_hit',
        data: { comboCount: state.comboCount, hitter: state.activeRole },
      });
    },
  };

  // Build physics state
  const physState: PhysicsState = {
    hider: state.hider,
    seeker: state.seeker,
    bumpers: state.bumpers,
    hazards: state.hazards,
    orbs: state.orbs,
    slowMotionRef: { current: state.slowMotion },
    activePowerUp: state.activePowerUp,
    shakeAmtRef: { current: state.shakeAmt },
    particlesRef: { current: [] },  // no rendering
    mapWidth: state.mapWidth,
    mapHeight: state.mapHeight,
    hiderFrozenRef: { current: state.hiderFrozen },
  };

  // Store computed scores when round ends (used for return value)
  let finalHiderScore = 0;
  let finalSeekerScore = 0;
  let finalRoundWinner: 'hider' | 'seeker' | 'tie' = 'seeker';

  // Main loop
  let lastTime = 0;
  let shotThisTurn = false;

  while (frameCount < MAX_FRAMES_PER_ROUND) {
    // Run physics
    physicsStep(physState, callbacks);

    // Check ball speeds
    const hSpeed = Math.hypot(state.hider.vx, state.hider.vy);
    const sSpeed = Math.hypot(state.seeker.vx, state.seeker.vy);
    const isMoving = hSpeed > 0 || sSpeed > 0;

    // Detect motion start
    if (isMoving && !state.ballsMoving) {
      state.ballsMoving = true;
    }

    // Detect motion end → turn swap
    if (!isMoving && state.ballsMoving) {
      state.ballsMoving = false;
      state.comboCount = 0;

      // Turn swap logic (same as GameCanvas toggleTurnFlow)
      if (state.activeRole === 'hider') {
        state.activeRole = 'seeker';
        state.roundMeta.turnsSurvived++;
        state.turnNumber = state.roundMeta.turnsSurvived;
        state.cpuFiredThisTurn = false;
        shotThisTurn = false;
        events.push({
          type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
          eventType: 'turn_swap',
          data: { newRole: 'seeker', turnsSurvived: state.roundMeta.turnsSurvived },
        });
      } else {
        state.activeRole = 'hider';
        state.cpuHiderFiredThisTurn = false;
        shotThisTurn = false;
        // Power-up duration decrement
        if (state.activePowerUp && state.powerUpDuration > 0) {
          state.powerUpDuration--;
          if (state.powerUpDuration <= 0) {
            state.activePowerUp = null;
          }
        }
        events.push({
          type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
          eventType: 'turn_swap',
          data: { newRole: 'hider', turnsSurvived: state.roundMeta.turnsSurvived },
        });
      }
    }

    // Near-miss detection
    if (state.ballsMoving && state.activeRole === 'seeker' && !state.nearMissTriggered) {
      const dist = Math.hypot(state.seeker.x - state.hider.x, state.seeker.y - state.hider.y);
      if (dist < state.minDistance) state.minDistance = dist;
      if (dist < 100) {
        state.nearMissTriggered = true;
        events.push({
          type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
          eventType: 'near_miss',
          data: { distance: dist },
        });
      }
    }

    // AI/strategy shot decision
    if (!state.ballsMoving && !isMoving && state.phase === 'playing' && !tagOccurred) {
      // Determine accuracy for this shot based on role
    const roleAccuracy = state.activeRole === 'seeker'
      ? (config.seekerAccuracy ?? config.accuracy ?? 0.85)
      : (config.hiderAccuracy ?? config.accuracy ?? 0.85);
    const shot = strategy.decideShot(state, roleAccuracy);
      if (shot && !shotThisTurn) {
        const vel = shotToVelocity(state, shot);
        if (vel) {
          const ball = state.activeRole === 'hider' ? state.hider : state.seeker;
          ball.vx = vel.vx;
          ball.vy = vel.vy;
          shotThisTurn = true;
          state.cpuFiredThisTurn = true;
          state.cpuHiderFiredThisTurn = true;
          events.push({
            type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
            eventType: 'shot_fired',
            data: { role: state.activeRole, vx: vel.vx, vy: vel.vy, angle: shot.angleRad, power: shot.power },
          });
        }
      }
    }

    // Handle tag freeze
    if (tagOccurred) {
      // After tag, let balls settle then end round
      state.tagFreezeRemaining -= FIXED_DELTA;
      if (state.tagFreezeRemaining <= 0 || (!isMoving && frameCount > 100)) {
        const scoreResult = calculateRoundScore(
          state.roundMeta,
          state.nearMissTriggered,
          state.minDistance,
          state.comboCount,
          config.gameMode === 'survival' || state.roundNumber % 2 === 0,
        );
        if (state.vampireActive) {
          if (config.gameMode === 'survival' || state.roundNumber % 2 === 0) {
            scoreResult.seekerScore += 1;
          } else {
            scoreResult.hiderScore += 1;
          }
        }
        state.phase = 'round_over';
        finalHiderScore = scoreResult.hiderScore;
        finalSeekerScore = scoreResult.seekerScore;
        finalRoundWinner = scoreResult.roundWinner;
        events.push({
          type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
          eventType: 'round_end',
          data: {
            hiderScore: scoreResult.hiderScore,
            seekerScore: scoreResult.seekerScore,
            winner: scoreResult.roundWinner,
          },
        });
        break;
      }
    }

    // Max turns safety: end round if turn limit reached without tag
    if (state.roundMeta.turnsSurvived >= MAX_TURNS_PER_ROUND && !tagOccurred) {
      tagOccurred = true;
      state.phase = 'round_over';
      const scoreResult = calculateRoundScore(
        state.roundMeta,
        state.nearMissTriggered,
        state.minDistance,
        state.comboCount,
        config.gameMode === 'survival' || state.roundNumber % 2 === 0,
      );
      finalHiderScore = scoreResult.hiderScore;
      finalSeekerScore = scoreResult.seekerScore;
      finalRoundWinner = scoreResult.roundWinner;
      events.push({
        type: 'event', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
        eventType: 'round_end',
        data: { hiderScore: finalHiderScore, seekerScore: finalSeekerScore, winner: finalRoundWinner, reason: 'max_turns' },
      });
      break;
    }

    // Log frame (throttle: every 6th frame = ~10fps logging to keep files manageable)
    if (frameCount % 6 === 0) {
      events.push({
        type: 'frame', frame: frameCount, timestamp: frameCount * FIXED_DELTA,
        phase: state.phase,
        turnNumber: state.turnNumber,
        activeRole: state.activeRole,
        hider: { x: state.hider.x, y: state.hider.y, vx: state.hider.vx, vy: state.hider.vy },
        seeker: { x: state.seeker.x, y: state.seeker.y, vx: state.seeker.vx, vy: state.seeker.vy },
        activePowerUp: state.activePowerUp,
        ballsMoving: state.ballsMoving,
        roundMeta: { ...state.roundMeta },
      });
    }

    frameCount++;
    lastTime += FIXED_DELTA;

    // Safety: if nothing is moving and no shot has been fired for 3 seconds, force a shot
    if (!isMoving && !shotThisTurn && frameCount > 180 && !tagOccurred) {
      // Force random shot to prevent deadlock
      const angle = Math.random() * Math.PI * 2;
      const ball = state.activeRole === 'hider' ? state.hider : state.seeker;
      const maxSpeed = state.activeRole === 'seeker' ? HIDER_BASE_SPEED * SEEKER_SPEED_MULT : HIDER_BASE_SPEED;
      ball.vx = Math.cos(angle) * maxSpeed * 0.5;
      ball.vy = Math.sin(angle) * maxSpeed * 0.5;
      shotThisTurn = true;
    }
  }

  // Compute final scores if round ended without tag (shouldn't happen normally)
  // If round ended normally (phase === round_over), use stored scores.
  // Otherwise compute from current state (edge case).
  if (state.phase !== 'round_over') {
    const computed = calculateRoundScore(
      state.roundMeta,
      state.nearMissTriggered,
      state.minDistance,
      state.comboCount,
      config.gameMode === 'survival' || state.roundNumber % 2 === 0,
    );
    finalHiderScore = computed.hiderScore;
    finalSeekerScore = computed.seekerScore;
    finalRoundWinner = computed.roundWinner;
  }

  return {
    roundIndex: state.roundNumber,
    isSuddenDeath: state.isSuddenDeath,
    turnsSurvived: state.roundMeta.turnsSurvived,
    hiderScore: finalHiderScore,
    seekerScore: finalSeekerScore,
    winner: finalRoundWinner === 'tie' ? 'seeker' : finalRoundWinner,
    events,
    finalPhase: state.phase,
  };
}
