import React, { useEffect, useState } from 'react';
import { Trophy, Activity, ArrowRight } from 'lucide-react';
import { getLeaderboard, getLeaderboardByScore } from '../stats/firebase';
import { getCachedLeaderboard } from '../stats/storage';
import type { LeaderboardEntry, AIDifficulty } from '../types';

interface LeaderboardPanelProps {
  playerName: string;
  difficulty?: AIDifficulty;
}

type LbCategory = 'turns' | 'score';

function difficultyColor(d: AIDifficulty): string {
  switch (d) {
    case 'easy':
      return 'text-green-400 bg-green-500/10';
    case 'medium':
      return 'text-yellow-400 bg-yellow-500/10';
    case 'hard':
      return 'text-red-400 bg-red-500/10';
  }
}

export function LeaderboardPanel({ playerName, difficulty }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<LbCategory>('turns');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const remote = category === 'turns'
        ? await getLeaderboard(50)
        : await getLeaderboardByScore(50);
      if (remote.length > 0) {
        setEntries(remote);
        localStorage.setItem('turn_tag_leaderboard_v1', JSON.stringify(remote));
      } else {
        setEntries(getCachedLeaderboard(50));
      }
      setLoading(false);
    }
    load();
  }, [category]);

  // If a difficulty filter is set, filter entries but still show overall rank
  const displayEntries = difficulty
    ? entries.filter(e => e.difficulty === difficulty)
    : entries;

  // Find player's best global rank among entries
  const playerEntryIndex = entries.findIndex(e => e.playerName === playerName);
  const playerRank = playerEntryIndex >= 0 ? playerEntryIndex + 1 : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-neutral-500">
        <Activity className="w-5 h-5 animate-spin mr-2" />
        Loading leaderboard...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-600 italic">
        No scores recorded yet. Be the first!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category toggle */}
      <div className="flex gap-1 border border-neutral-800 rounded-lg p-0.5">
        <button
          onClick={() => setCategory('turns')}
          className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-colors ${
            category === 'turns'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Most Rounds Survived
        </button>
        <button
          onClick={() => setCategory('score')}
          className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-colors ${
            category === 'score'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Highest Score
        </button>
      </div>

      {difficulty && (
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="uppercase text-[10px] font-mono tracking-wider text-neutral-500">
            Global {difficulty} {category === 'turns' ? 'Rounds' : 'Scores'}
          </span>
          {playerRank && (
            <span className="ml-auto text-xs font-mono text-emerald-400">
              Your rank #{playerRank}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-2">
        {displayEntries.slice(0, 20).map((entry, idx) => (
          <div
            key={entry.id ?? idx}
            className={`flex items-center justify-between p-3 rounded-lg ${
              entry.playerName === playerName
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-neutral-900/40 border border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-mono font-bold w-4 text-center ${
                  idx < 3 ? 'text-yellow-400' : 'text-neutral-600'
                }`}
              >
                {idx + 1}
              </span>
              <div>
                <div className="font-semibold text-neutral-200 text-sm">
                  {entry.playerName}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  {new Date(entry.date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-mono font-bold text-xl text-white">
                  {category === 'turns' ? entry.turnsSurvived : entry.totalScore}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  {category === 'turns' ? 'rounds' : 'pts'}
                </div>
              </div>

              <ArrowRight className="w-3 h-3 text-neutral-600" />

              <div className="text-right">
                <div className="font-mono font-bold text-sm text-white">
                  {category === 'turns' ? entry.totalScore : entry.turnsSurvived}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  {category === 'turns' ? 'pts' : 'rounds'}
                </div>
              </div>

              <div
                className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                  difficultyColor(entry.difficulty)
                }`}
              >
                {entry.difficulty}
              </div>
            </div>
          </div>
        ))}
      </div>

      {difficulty && entries.length > 20 && (
        <div className="text-center text-[10px] text-neutral-600 font-mono pt-2">
          Showing top 20 of {entries.length} total scores
        </div>
      )}
    </div>
  );
}