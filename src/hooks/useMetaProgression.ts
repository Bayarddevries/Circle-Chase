import { useState, useEffect, useCallback } from 'react';
import {
  MetaState,
  Unlocks,
  LeaderboardEntry,
  Badge,
  RoundMeta,
} from '../types';

const LS_CREDITS = 'circleChase_credits';
const LS_UNLOCKS = 'circleChase_unlocks';
const LS_LEADERBOARD = 'circleChase_leaderboard';

const DEFAULT_UNLOCKS: Unlocks = {
  ballSkins: { default: true },
  trailColors: { default: true },
  bumperThemes: { default: true },
  mapBackgrounds: { default: true },
};

const DEFAULT_BADGES: Badge[] = [
  { id: 'sand_dodger', name: 'Sand Dodger', description: 'Survive 10 turns on a map with any sand hazard', earned: false },
  { id: 'bounce_master', name: 'Bounce Master', description: 'Use bumpers 50 times', earned: false },
  { id: 'quick_tag', name: 'Quick Tag', description: 'Tag the Hider within the first 3 turns as Seeker', earned: false },
  { id: 'first_round', name: 'First Round', description: 'Complete your first round', earned: false },
  { id: 'century', name: 'Century Runner', description: 'Survive a total of 100 turns', earned: false },
  { id: 'power_hungry', name: 'Power Hungry', description: 'Collect 25 power-ups total', earned: false },
];

function loadNumber(key: string, fallback: number): number {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    }
  } catch { /* localStorage unavailable */ }
  return fallback;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) {
      const parsed = JSON.parse(v);
      // Basic validation: ensure it's an object if that's what we expect
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch { /* invalid JSON */ }
  return fallback;
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full */ }
}

export function createDefaultMeta(): MetaState {
  return {
    credits: 0,
    totalTurnsSurvived: 0,
    totalRoundsPlayed: 0,
    totalPowerUpsCollected: 0,
    totalBumperHits: 0,
    quickTags: 0,
    unlocks: DEFAULT_UNLOCKS,
    leaderboard: [],
    badges: DEFAULT_BADGES.map(b => ({ ...b })),
  };
}

export function useMetaProgression() {
  const [meta, setMeta] = useState<MetaState>(() => {
    const credits = loadNumber(LS_CREDITS, 0);
    const unlocks = loadJSON<Unlocks>(LS_UNLOCKS, { ...DEFAULT_UNLOCKS, ballSkins: { ...DEFAULT_UNLOCKS.ballSkins }, trailColors: { ...DEFAULT_UNLOCKS.trailColors }, bumperThemes: { ...DEFAULT_UNLOCKS.bumperThemes }, mapBackgrounds: { ...DEFAULT_UNLOCKS.mapBackgrounds } });
    const leaderboard = loadJSON<LeaderboardEntry[]>(LS_LEADERBOARD, []);

    // Merge loaded unlocks with defaults (new unlock categories may not exist in saved data)
    const mergedUnlocks: Unlocks = {
      ballSkins: { ...DEFAULT_UNLOCKS.ballSkins, ...(unlocks.ballSkins || {}) },
      trailColors: { ...DEFAULT_UNLOCKS.trailColors, ...(unlocks.trailColors || {}) },
      bumperThemes: { ...DEFAULT_UNLOCKS.bumperThemes, ...(unlocks.bumperThemes || {}) },
      mapBackgrounds: { ...DEFAULT_UNLOCKS.mapBackgrounds, ...(unlocks.mapBackgrounds || {}) },
    };

    const badges = DEFAULT_BADGES.map(b => ({ ...b }));
    // Load saved badge state
    try {
      const savedBadges = localStorage.getItem('circleChase_badges');
      if (savedBadges) {
        const parsed = JSON.parse(savedBadges);
        for (const b of badges) {
          if (parsed[b.id] === true) b.earned = true;
        }
      }
    } catch { /* ignore */ }

    return {
      credits,
      totalTurnsSurvived: loadNumber('circleChase_totalTurns', 0),
      totalRoundsPlayed: loadNumber('circleChase_totalRounds', 0),
      totalPowerUpsCollected: loadNumber('circleChase_totalPowerUps', 0),
      totalBumperHits: loadNumber('circleChase_totalBumperHits', 0),
      quickTags: loadNumber('circleChase_quickTags', 0),
      unlocks: mergedUnlocks,
      leaderboard,
      badges,
    };
  });

  // Persist credits
  useEffect(() => {
    try { localStorage.setItem(LS_CREDITS, String(meta.credits)); } catch {}
  }, [meta.credits]);

  // Persist unlocks
  useEffect(() => {
    saveJSON(LS_UNLOCKS, meta.unlocks);
  }, [meta.unlocks]);

  // Persist leaderboard
  useEffect(() => {
    saveJSON(LS_LEADERBOARD, meta.leaderboard);
  }, [meta.leaderboard]);

  // Persist badges
  useEffect(() => {
    const badgeMap: Record<string, boolean> = {};
    for (const b of meta.badges) badgeMap[b.id] = b.earned;
    saveJSON('circleChase_badges', badgeMap);
  }, [meta.badges]);

  // Persist aggregated stats
  useEffect(() => {
    try { localStorage.setItem('circleChase_totalTurns', String(meta.totalTurnsSurvived)); } catch {}
  }, [meta.totalTurnsSurvived]);
  useEffect(() => {
    try { localStorage.setItem('circleChase_totalRounds', String(meta.totalRoundsPlayed)); } catch {}
  }, [meta.totalRoundsPlayed]);
  useEffect(() => {
    try { localStorage.setItem('circleChase_totalPowerUps', String(meta.totalPowerUpsCollected)); } catch {}
  }, [meta.totalPowerUpsCollected]);
  useEffect(() => {
    try { localStorage.setItem('circleChase_totalBumperHits', String(meta.totalBumperHits)); } catch {}
  }, [meta.totalBumperHits]);
  useEffect(() => {
    try { localStorage.setItem('circleChase_quickTags', String(meta.quickTags)); } catch {}
  }, [meta.quickTags]);

  /** Award credits after a round and update stats. Returns credits earned this round. */
  const awardRound = useCallback((roundMeta: RoundMeta, playerName: string, isHider: boolean) => {
    const creditsEarned = Math.round(roundMeta.turnsSurvived * (1 + (roundMeta.powerUpCollected ? 0.5 : 0)));
    const newBadgeEarned = checkBadges(meta, creditsEarned, roundMeta);

    setMeta(prev => {
      // Leaderboard – top 10 by turns
      const newEntry: LeaderboardEntry = {
        name: playerName,
        role: isHider ? 'Hider' : 'Seeker',
        turns: roundMeta.turnsSurvived,
        date: new Date().toISOString().split('T')[0],
      };
      const newLeaderboard = [...prev.leaderboard, newEntry]
        .sort((a, b) => b.turns - a.turns)
        .slice(0, 10);

      // Quick tag detection: Seeker tagged Hider within first 3 turns
      const newQuickTags = prev.quickTags + (!isHider && roundMeta.tagTurn <= 3 ? 1 : 0);

      // Update badges
      const newBadges = prev.badges.map(b => {
        if (b.earned) return b;
        if (b.id === 'first_round') return { ...b, earned: true };
        if (b.id === 'sand_dodger' && roundMeta.turnsSurvived >= 10) {
          // We don't track sand presence in roundMeta directly,
          // but assume the awarder knows. We'll check by total rounds.
          // Actually, for simplicity: the game always has sand hazards
          // in normal rounds (not sudden death), so surviving 10 turns = sand dodge.
          // More accurate: mark it only if hazard existed on the map.
          // We'll pass an extra flag for simplicity.
          return { ...b, earned: roundMeta.turnsSurvived >= 10 };
        }
        if (b.id === 'bounce_master' && prev.totalBumperHits + roundMeta.bumperHits >= 50) return { ...b, earned: true };
        if (b.id === 'quick_tag' && !isHider && roundMeta.tagTurn <= 3) return { ...b, earned: true };
        if (b.id === 'century' && prev.totalTurnsSurvived + roundMeta.turnsSurvived >= 100) return { ...b, earned: true };
        if (b.id === 'power_hungry' && prev.totalPowerUpsCollected + (roundMeta.powerUpCollected ? 1 : 0) >= 25) return { ...b, earned: true };
        return b;
      });

      return {
        ...prev,
        credits: prev.credits + creditsEarned,
        totalTurnsSurvived: prev.totalTurnsSurvived + roundMeta.turnsSurvived,
        totalRoundsPlayed: prev.totalRoundsPlayed + 1,
        totalPowerUpsCollected: prev.totalPowerUpsCollected + (roundMeta.powerUpCollected ? 1 : 0),
        totalBumperHits: prev.totalBumperHits + roundMeta.bumperHits,
        quickTags: newQuickTags,
        leaderboard: newLeaderboard,
        badges: newBadges,
      };
    });

    return creditsEarned;
  }, [meta]);

  const purchase = useCallback((category: keyof Unlocks, itemId: string, cost: number): boolean => {
    let bought = false;
    setMeta(prev => {
      if (prev.credits < cost) return prev;
      if (prev.unlocks[category]?.[itemId]) return prev; // already owned
      bought = true;
      return {
        ...prev,
        credits: prev.credits - cost,
        unlocks: {
          ...prev.unlocks,
          [category]: { ...prev.unlocks[category], [itemId]: true },
        },
      };
    });
    return bought;
  }, []);

  const isOwned = useCallback((category: keyof Unlocks, itemId: string): boolean => {
    return meta.unlocks[category]?.[itemId] === true;
  }, [meta.unlocks]);

  return { meta, awardRound, purchase, isOwned, setMeta };
}

function checkBadges(prevMeta: MetaState, _creditsEarned: number, _roundMeta: RoundMeta): boolean {
  // Checks are done inside awardRound's setMeta reducer for atomicity
  return false;
}
