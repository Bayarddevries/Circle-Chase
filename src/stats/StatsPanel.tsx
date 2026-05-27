import React from 'react';
import { BarChart3 } from 'lucide-react';
import { getStats } from '../stats/storage';

interface StatsPanelProps {
  playerName: string;
}

export function StatsPanel({ playerName }: StatsPanelProps) {
  const stats = getStats();

  const avgScore = stats.survivalCount > 0 ? Math.round(stats.totalScore / stats.survivalCount) : 0;
  const avgTurns = stats.survivalCount > 0 ? Math.round(stats.totalTurnsSurvived / stats.survivalCount) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <span className="uppercase text-[10px] font-mono tracking-wider text-neutral-500">
          Your Career Stats
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="text-[10px] text-neutral-500 font-mono uppercase">Matches</div>
          <div className="text-xl font-bold text-white font-mono">{stats.totalMatches}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="text-[10px] text-neutral-500 font-mono uppercase">Survival Runs</div>
          <div className="text-xl font-bold text-white font-mono">{stats.survivalCount}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="text-[10px] text-neutral-500 font-mono uppercase">Best Rounds</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{stats.bestRun}</div>
          <div className="text-[10px] text-neutral-500 capitalize">{stats.bestRunDifficulty}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="text-[10px] text-neutral-500 font-mono uppercase">Best Score</div>
          <div className="text-xl font-bold text-amber-400 font-mono">{stats.bestScore}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="text-[10px] text-neutral-500 font-mono uppercase">Avg Rounds</div>
          <div className="text-xl font-bold text-white font-mono">{avgTurns}</div>
        </div>
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="text-[10px] text-neutral-500 font-mono uppercase">Avg Score</div>
          <div className="text-xl font-bold text-white font-mono">{avgScore}</div>
        </div>
      </div>

      <div className="text-xs text-neutral-600 text-center pt-2">
        Stats are local to this browser. Clearing cache resets them.
      </div>
    </div>
  );
}