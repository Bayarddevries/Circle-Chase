import React from 'react';
import { X, Award, BarChart3 } from 'lucide-react';
import { Badge, MetaState } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  meta: MetaState;
}

const BADGE_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  first_round: { bg: 'bg-emerald-950/20', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: '✦' },
  sand_dodger: { bg: 'bg-amber-950/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: '⌛' },
  bounce_master: { bg: 'bg-fuchsia-950/20', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', icon: '⬡' },
  quick_tag: { bg: 'bg-red-950/20', border: 'border-red-500/30', text: 'text-red-400', icon: '⚡' },
  century: { bg: 'bg-blue-950/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: '💯' },
  power_hungry: { bg: 'bg-cyan-950/20', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: '◆' },
};

export function ProfileModal({ isOpen, onClose, meta }: ProfileModalProps) {
  if (!isOpen) return null;

  const avgSurvival = meta.totalRoundsPlayed > 0
    ? (meta.totalTurnsSurvived / meta.totalRoundsPlayed).toFixed(1)
    : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-neutral-950 border border-emerald-500/30 rounded-2xl shadow-2xl p-6 text-neutral-200">
        <button
          onClick={onClose}
          className="absolute p-2 text-neutral-400 transition-colors top-4 right-4 hover:text-white hover:bg-neutral-900 rounded-lg"
          aria-label="Close profile"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 border-b border-emerald-500/20 pb-4">
          <Award className="w-7 h-7 text-emerald-400" />
          <h2 className="text-2xl font-bold tracking-widest text-emerald-400 font-sans uppercase">PROFILE & STATS</h2>
        </div>

        {/* Stats */}
        <div className="mb-5">
          <h3 className="flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-400 uppercase font-bold mb-3">
            <BarChart3 className="w-4 h-4" /> Career Stats
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
              <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider block">Total Turns Survived</span>
              <span className="text-xl font-black text-white font-mono">{meta.totalTurnsSurvived}</span>
            </div>
            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
              <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider block">Rounds Played</span>
              <span className="text-xl font-black text-white font-mono">{meta.totalRoundsPlayed}</span>
            </div>
            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
              <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider block">Avg Survival</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{avgSurvival}</span>
            </div>
            <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
              <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider block">Power-ups Used</span>
              <span className="text-xl font-black text-cyan-400 font-mono">{meta.totalPowerUpsCollected}</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h3 className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-400 uppercase font-bold mb-3">
            <Award className="w-4 h-4" /> Badges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {meta.badges.map(badge => {
              const style = BADGE_STYLES[badge.id] || { bg: 'bg-neutral-900', border: 'border-neutral-800', text: 'text-neutral-400', icon: '?' };
              return (
                <div
                  key={badge.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                    badge.earned
                      ? `${style.bg} ${style.border}`
                      : 'bg-neutral-900/60 border-neutral-800 opacity-50'
                  }`}
                >
                  <span className={`text-lg shrink-0 mt-0.5 ${badge.earned ? style.text : 'text-neutral-600'}`}>
                    {style.icon}
                  </span>
                  <div>
                    <span className={`text-xs font-bold block ${badge.earned ? style.text : 'text-neutral-500'}`}>
                      {badge.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 leading-tight block mt-0.5">
                      {badge.earned ? '✓ Earned' : badge.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-emerald-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold tracking-wider text-xs uppercase rounded transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
