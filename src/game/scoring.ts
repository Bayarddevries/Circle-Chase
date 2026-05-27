/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Scoring system for Circle Chase.
 * Calculates round scores from tracked stats and determines the round winner.
 */

import { RoundMeta, ScoreBreakdown } from '../types';

const NEAR_MISS_BONUS = 1;
const POWERUP_BONUS = 2;
const BUMPER_POINTS = 1;
const TAG_BASE = 5;
const QUICK_TAG = 3;  // bonus for tagging within 3 turns

export interface RoundScoreResult {
  hiderScore: number;
  seekerScore: number;
  hiderBreakdown: Partial<ScoreBreakdown>;
  seekerBreakdown: Partial<ScoreBreakdown>;
  roundWinner: 'hider' | 'seeker' | 'tie';
}

export function calculateRoundScore(
  meta: RoundMeta,
  nearMissTriggered: boolean,
  minDistance: number,
  comboCount: number,
  p1IsHider: boolean,
): RoundScoreResult {
  // ── Hider score ──────────────────────────────────────
  const base = meta.turnsSurvived;
  const hiderBumperBonus = meta.bumperHits * BUMPER_POINTS;
  const nearMissBonus = nearMissTriggered ? NEAR_MISS_BONUS : 0;
  const hiderPowerUpBonus = meta.powerUpCollector === 'hider' ? POWERUP_BONUS : 0;
  const hiderScore = base + hiderBumperBonus + nearMissBonus + hiderPowerUpBonus;

  // ── Seeker score ────────────────────────────────────
  const tagBonus = TAG_BASE;
  const quickTagBonus =
    meta.turnsSurvived <= 3 ? QUICK_TAG : 0;
  const seekerPowerUpBonus = meta.powerUpCollector === 'seeker' ? POWERUP_BONUS : 0;
  const seekerScore = tagBonus + quickTagBonus + seekerPowerUpBonus;

  // ── Winner ───────────────────────────────────────────
  let roundWinner: 'hider' | 'seeker' | 'tie' = 'tie';
  if (hiderScore > seekerScore) roundWinner = 'hider';
  if (seekerScore > hiderScore) roundWinner = 'seeker';

  return {
    hiderScore,
    seekerScore,
    hiderBreakdown: {
      base,
      comboBonus: hiderBumperBonus,
      nearMissBonus,
      powerUpBonus: hiderPowerUpBonus,
      total: hiderScore,
    },
    seekerBreakdown: {
      base: tagBonus,
      quickTagBonus,
      powerUpBonus: seekerPowerUpBonus,
      total: seekerScore,
    },
    roundWinner,
  };
}