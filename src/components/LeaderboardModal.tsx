import React from 'react';
import { X, Trophy, Medal, Star } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
}

const RANK_ICONS = [
  <Trophy key="1" className="w-4 h-4 text-yellow-400" />,
  <Medal key="2" className="w-4 h-4 text-zinc-300" />,
  <Medal key="3" className="w-4 h-4 text-amber-600" />,
];

export function LeaderboardModal({ isOpen, onClose, entries }: LeaderboardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-neutral-950 border border-amber-500/30 rounded-2xl shadow-2xl p-6 text-neutral-200">
        <button
          onClick={onClose}
          className="absolute p-2 text-neutral-400 transition-colors top-4 right-4 hover:text-white hover:bg-neutral-900 rounded-lg"
          aria-label="Close leaderboard"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 border-b border-amber-500/20 pb-4">
          <Trophy className="w-7 h-7 text-amber-400" />
          <h2 className="text-2xl font-bold tracking-widest text-amber-400 font-sans uppercase">LEADERBOARD</h2>
        </div>

        {entries.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-sm font-mono">
            <Star className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
            No records yet. Complete a match to appear here.
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                  idx < 3 ? 'bg-amber-950/10 border border-amber-500/10' : 'bg-neutral-900/40'
                }`}
              >
                <div className="w-8 text-center shrink-0">
                  {idx < 3
                    ? RANK_ICONS[idx]
                    : <span className="text-xs font-mono text-neutral-500">#{idx + 1}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white truncate block">{entry.name}</span>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase">{entry.role}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-400 font-mono block">{entry.turns}</span>
                  <span className="text-[9px] text-neutral-600 font-mono">{entry.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-amber-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold tracking-wider text-xs uppercase rounded transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
