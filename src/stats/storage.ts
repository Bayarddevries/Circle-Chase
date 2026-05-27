import type { LeaderboardEntry, PlayerStats, AIDifficulty } from '../types';

const STORAGE_KEYS = {
  leaderboard: 'turn_tag_leaderboard_v1',
  stats: 'turn_tag_stats_v1',
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Leaderboard is a local-only copy used when Firebase is unreachable
export function getCachedLeaderboard(limit = 50): LeaderboardEntry[] {
  const entries = loadJSON<LeaderboardEntry[]>(STORAGE_KEYS.leaderboard, []);
  return entries.slice(0, limit);
}

export function cacheLeaderboard(entries: LeaderboardEntry[]): void {
  saveJSON(STORAGE_KEYS.leaderboard, entries);
}

const DEFAULT_STATS: PlayerStats = {
  totalMatches: 0,
  survivalCount: 0,
  bestRun: 0,
  bestScore: 0,
  bestRunDifficulty: 'easy',
  lastPlayed: '',
  totalTurnsSurvived: 0,
  totalScore: 0,
};

export function getStats(): PlayerStats {
  return loadJSON<PlayerStats>(STORAGE_KEYS.stats, { ...DEFAULT_STATS });
}

export function updateStats(
  turnsSurvived: number,
  hiderScore: number,
  isSurvival: boolean,
  difficulty: AIDifficulty,
): void {
  const stats = getStats();

  stats.totalMatches += 1;
  if (isSurvival) {
    stats.survivalCount += 1;
    if (turnsSurvived > stats.bestRun) {
      stats.bestRun = turnsSurvived;
      stats.bestRunDifficulty = difficulty;
    }
    if (hiderScore > stats.bestScore) {
      stats.bestScore = hiderScore;
    }
  }
  stats.totalTurnsSurvived += turnsSurvived;
  stats.totalScore += hiderScore;
  stats.lastPlayed = new Date().toISOString();

  saveJSON(STORAGE_KEYS.stats, stats);
}