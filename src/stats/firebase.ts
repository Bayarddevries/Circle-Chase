import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, serverTimestamp } from 'firebase/database';
import type { LeaderboardEntry, AIDifficulty } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyAcI-aYH_jHL6m91CG7u0aBx_1jEU71Uw",
  authDomain: "turn-tag-leader.firebaseapp.com",
  databaseURL: "https://turn-tag-leader-default-rtdb.firebaseio.com",
  projectId: "turn-tag-leader",
  storageBucket: "turn-tag-leader.firebasestorage.app",
  messagingSenderId: "595071983004",
  appId: "1:595071983004:web:9227d23718f269c3ba7c59",
  measurementId: "G-T3LBN2P9B9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function getDeviceId(): string {
  let deviceId = localStorage.getItem('turn_tag_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('turn_tag_device_id', deviceId);
  }
  return deviceId;
}

export async function submitSurvivalScore(
  playerName: string,
  turnsSurvived: number,
  totalScore: number,
  difficulty: AIDifficulty,
): Promise<void> {
  const entry: Omit<LeaderboardEntry, 'id'> = {
    turnsSurvived,
    totalScore,
    difficulty,
    playerName,
    date: new Date().toISOString(),
    matchId: crypto.randomUUID(),
  };

  const leaderboardRef = ref(db, 'leaderboard');
  await push(leaderboardRef, {
    ...entry,
    deviceId: getDeviceId(),
    timestamp: serverTimestamp(),
  });
}

const DB_BASE = 'https://turn-tag-leader-default-rtdb.firebaseio.com';

/**
 * Fetch and sort leaderboard entries client-side via the Realtime DB REST API.
 * Avoids Firebase SDK ordered queries that require `.indexOn` in security rules.
 */
async function getLeaderboardByChild(
  child: 'turnsSurvived' | 'totalScore',
  limit = 50,
): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`${DB_BASE}/leaderboard.json`);
    if (!res.ok) {
      console.warn('Leaderboard fetch not OK:', res.status, res.statusText);
      return [];
    }
    const data: Record<string, unknown> | null = await res.json();
    if (!data) return [];

    const entries: LeaderboardEntry[] = Object.entries(data).map(([key, val]) => ({
      id: key,
      ...(val as Omit<LeaderboardEntry, 'id'>),
    }));

    return entries
      .sort((a, b) => (b[child] || 0) - (a[child] || 0))
      .slice(0, limit);
  } catch (err) {
    console.error('Leaderboard fetch failed:', err);
    return [];
  }
}

export function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  return getLeaderboardByChild('turnsSurvived', limit);
}

export function getLeaderboardByScore(limit = 50): Promise<LeaderboardEntry[]> {
  return getLeaderboardByChild('totalScore', limit);
}