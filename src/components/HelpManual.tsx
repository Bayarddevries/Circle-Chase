import React from 'react';
import { X, HelpCircle, Eye, ShieldAlert, Award, Zap, Compass, RefreshCw } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-y-auto border max-h-[90vh] bg-neutral-950 border-amber-500/30 rounded-2xl shadow-2xl p-6 text-neutral-200">
        <button
          onClick={onClose}
          id="btn-close-help"
          className="absolute p-2 text-neutral-400 transition-colors top-4 right-4 hover:text-white hover:bg-neutral-900 rounded-lg"
          aria-label="Close help modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-amber-500/20 pb-4">
          <HelpCircle className="w-7 h-7 text-amber-500 animate-pulse" />
          <h2 className="text-2xl font-bold tracking-widest text-amber-500 font-sans uppercase">
            How to Play
          </h2>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-neutral-300 font-sans">
          
          {/* Game Loop */}
          <div>
            <h3 className="flex items-center gap-2 text-amber-400 font-medium tracking-wider mb-2 text-base uppercase">
              <RefreshCw className="w-4 h-4" /> 1. Turns
            </h3>
            <p>
              Two players share the same screen. The <span className="text-white font-semibold">Runner</span> goes first, then the <span className="text-orange-400 font-semibold">Chaser</span>. Keep alternating until the Chaser tags the Runner. The Runner scores 1 point per turn survived. Then swap roles.
            </p>
          </div>

          {/* Controls */}
          <div>
            <h3 className="flex items-center gap-2 text-amber-400 font-medium tracking-wider mb-2 text-base uppercase">
              <Compass className="w-4 h-4" /> 2. Controls
            </h3>
            <p>
              Touch or click your ball and <span className="text-white font-semibold">drag backwards</span> to aim. Release to launch. Pull further for more power. The next turn starts <span className="text-amber-500 font-semibold">only when both balls have stopped</span>.
            </p>
          </div>

          {/* Roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/20">
              <h4 className="flex items-center gap-2 text-orange-400 font-semibold tracking-wider mb-2 uppercase">
                <ShieldAlert className="w-4 h-4" /> Chaser
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-neutral-400">
                <li><strong className="text-neutral-200">+50% speed</strong> on launch</li>
                <li><strong className="text-neutral-200">Slides further</strong> (less friction)</li>
                <li><strong className="text-neutral-200">Fog of war:</strong> Runner is hidden beyond 350px</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-500/20">
              <h4 className="flex items-center gap-2 text-amber-400 font-semibold tracking-wider mb-2 uppercase">
                <Eye className="w-4 h-4" /> Runner
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-neutral-400">
                <li><strong className="text-neutral-200">Goes first</strong> every round</li>
                <li><strong className="text-neutral-200">Hidden in fog</strong> when far from Chaser</li>
                <li><strong className="text-neutral-200">Sonar pings</strong> leak position every 3 seconds</li>
              </ul>
            </div>
          </div>

          {/* Hazards */}
          <div>
            <h3 className="text-amber-400 font-medium tracking-wider mb-2 text-base uppercase">
              Hazards
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-900 border border-yellow-500/20 rounded-lg">
                <div className="text-yellow-400 font-semibold tracking-wider text-xs uppercase mb-1">Sand (Slow)</div>
                <div className="text-xs text-neutral-400">Extra 8% speed loss per frame. Avoid!</div>
              </div>
              <div className="p-3 bg-neutral-900 border border-cyan-500/20 rounded-lg">
                <div className="text-cyan-400 font-semibold tracking-wider text-xs uppercase mb-1">Ice (Fast)</div>
                <div className="text-xs text-neutral-400">Only 1% speed loss per frame. Slide far.</div>
              </div>
              <div className="p-3 bg-neutral-900 border border-amber-500/20 rounded-lg">
                <div className="text-amber-400 font-semibold tracking-wider text-xs uppercase mb-1">Bumpers</div>
                <div className="text-xs text-neutral-400">1.4x bounce. Use them to change direction fast.</div>
              </div>
            </div>
          </div>

          {/* Power-ups */}
          <div>
            <h3 className="flex items-center gap-2 text-amber-400 font-medium tracking-wider mb-2 text-base uppercase">
              <Award className="w-4 h-4" /> Power-ups
            </h3>
            <p className="mb-3 text-xs text-neutral-400">
              Glowing orbs spawn on the map. Touch one to pick it up. Only the Chaser can use them.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-neutral-900 border border-blue-500/25">
                <span className="text-xs font-semibold text-blue-400 uppercase block">Laser Sight</span>
                <span className="text-xs text-zinc-400">See 2.5x further along your aim line.</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-900 border border-fuchsia-500/25">
                <span className="text-xs font-semibold text-fuchsia-400 uppercase block">Superball</span>
                <span className="text-xs text-zinc-400">2x bounce off walls and bumpers.</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-900 border border-orange-500/25">
                <span className="text-xs font-semibold text-orange-400 uppercase block">Iron Ball</span>
                <span className="text-xs text-zinc-400">Ignore sand slowdown completely.</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-900 border border-purple-500/25">
                <span className="text-xs font-semibold text-purple-400 uppercase block">Sonar Pulse</span>
                <span className="text-xs text-zinc-400">Reveal Runner position, removes fog.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-amber-500/20 flex justify-end">
          <button
            onClick={onClose}
            id="btn-close-help-footer"
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold tracking-wider text-xs uppercase rounded transition-colors uppercase cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
