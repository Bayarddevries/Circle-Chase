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

        {/* Explanation */}
        <div className="space-y-6 text-sm leading-relaxed text-neutral-300 font-sans">
          
          {/* Phase 1: Game Loop */}
          <div>
            <h3 className="flex items-center gap-2 text-amber-400 font-medium tracking-wider mb-2 text-base uppercase">
              <RefreshCw className="w-4 h-4" /> 1. How Turns Work
            </h3>
            <p>
              Two players share the same screen. Players take turns slingshotting. <span className="text-white font-semibold">Runner goes first</span>, then the <span className="text-orange-400 font-semibold">Chaser</span>. A round continues until the Chaser tags the Runner. The Runner earns points for every turn survived. Once tagged, roles swap.
            </p>
          </div>

          {/* Phase 2: Controls */}
          <div>
            <h3 className="flex items-center gap-2 text-amber-400 font-medium tracking-wider mb-2 text-base uppercase">
              <Compass className="w-4 h-4" /> 2. Slingshot Controls
            </h3>
            <p>
              Touch/Click and <span className="text-white font-semibold">drag backwards</span> from your circle to aim, then release to launch your ball into high-speed physics action. Power correlates to your drag distance.
              The next turn starts <span className="text-amber-500 font-semibold font-bold">only when BOTH balls have come to a complete stop</span>.
            </p>
          </div>

          {/* Seeker Advantage & Terrains */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/20">
              <h4 className="flex items-center gap-2 text-orange-400 font-semibold tracking-wider mb-2 uppercase">
                <ShieldAlert className="w-4 h-4" /> Chaser Advantage
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-neutral-400">
                <li><strong className="text-neutral-200">+50% speed:</strong> Heavy charge capability.</li>
                <li><strong className="text-neutral-200">-15% friction:</strong> Slides further and faster.</li>
                <li><strong className="text-neutral-200">Distance Veil:</strong> Runner is hidden in a dark Fog of War if beyond 350px.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-500/20">
              <h4 className="flex items-center gap-2 text-amber-400 font-semibold tracking-wider mb-2 uppercase">
                <Eye className="w-4 h-4" /> Runner Ability
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-neutral-400">
                <li><strong className="text-neutral-200">Sonar Pings:</strong> Map broadcasts an acoustic shockwave from Runner's location every 3 seconds, leaking their general position through the mist.</li>
                <li><strong className="text-neutral-200">First Launch:</strong> Runner goes first in every round.</li>
              </ul>
            </div>
          </div>

          {/* Grid of Terrains */}
          <div>
            <h3 className="text-amber-400 font-medium tracking-wider mb-2 text-base uppercase">
              Terrain
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-900 border border-yellow-500/20 rounded-lg">
                <div className="text-yellow-400 font-semibold tracking-wider text-xs uppercase mb-1">Sand (Slow)</div>
                <div className="text-xs text-neutral-400">Reduces current speed by an extra <span className="text-yellow-500">8%</span> per frame upon entries. Avoid!</div>
              </div>
              <div className="p-3 bg-neutral-900 border border-cyan-500/20 rounded-lg">
                <div className="text-cyan-400 font-semibold tracking-wider text-xs uppercase mb-1">Ice (Fast)</div>
                <div className="text-xs text-neutral-400">Glide effortlessly! Velocity loses only <span className="text-cyan-400">1%</span> per frame, generating infinite speed.</div>
              </div>
              <div className="p-3 bg-neutral-900 border border-amber-500/20 rounded-lg">
                <div className="text-amber-400 font-semibold tracking-wider text-xs uppercase mb-1 font-bold">Bumper (Boost)</div>
                <div className="text-xs text-neutral-400">Booster hazards of <span className="text-amber-400 font-bold">1.4x bounciness</span>. Hits supply sudden vertical launch velocity!</div>
              </div>
            </div>
          </div>

          {/* Seeker Power-Up System */}
          <div>
            <h3 className="flex items-center gap-2 text-amber-400 font-medium tracking-wider mb-2 text-base uppercase">
              <Award className="w-4 h-4" /> Chaser Power-ups
            </h3>
            <p className="mb-3 text-xs text-neutral-400">
              A glowing cyan Orb coordinates dynamically in neutral zones. Collection gives the Chaser immediate, single-use, turn-exclusive technological advancements:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-neutral-900 border border-blue-500/25">
                <span className="text-xs font-semibold text-blue-400 uppercase block">1. Laser Sight</span>
                <span className="text-xs text-zinc-400">Extends the slingshot predictive path trajectory by 2.5x for long range snipes.</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-900 border border-fuchsia-500/25">
                <span className="text-xs font-semibold text-fuchsia-400 uppercase block">2. Superball</span>
                <span className="text-xs text-zinc-400">Fling rebounds bounce off border walls and hazards with 2x intensity!</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-900 border border-orange-500/25">
                <span className="text-xs font-semibold text-orange-400 uppercase block">3. Iron Ball</span>
                <span className="text-xs text-zinc-400">Gain massive virtual weight, plowing through slow sand completely unaffected.</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-900 border border-purple-500/25">
                <span className="text-xs font-semibold text-purple-400 uppercase block">4. Sonar Pulse</span>
                <span className="text-xs text-zinc-400">Fades the fog, revealing the Runner's position!</span>
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
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
