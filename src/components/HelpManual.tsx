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
      <div className="relative w-full max-w-2xl overflow-y-auto border max-h-[90vh] bg-neutral-950 border-emerald-500/30 rounded-2xl shadow-2xl p-6 text-neutral-200">
        <button
          onClick={onClose}
          id="btn-close-help"
          className="absolute p-2 text-neutral-400 transition-colors top-4 right-4 hover:text-white hover:bg-neutral-900 rounded-lg"
          aria-label="Close help modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-emerald-500/20 pb-4">
          <HelpCircle className="w-7 h-7 text-emerald-500" />
          <h2 className="text-2xl font-bold tracking-widest text-emerald-500 font-sans uppercase">
            How to Play
          </h2>
        </div>

        {/* Explanation */}
        <div className="space-y-6 text-sm leading-relaxed text-neutral-300 font-sans">
          
          {/* Phase 1: Game Loop */}
          <div>
            <h3 className="flex items-center gap-2 text-emerald-400 font-medium tracking-wider mb-2 text-base uppercase">
              <RefreshCw className="w-4 h-4" /> 1. How Turns Work
            </h3>
            <p>
              Two players share the same screen. Players take turns slingshotting. <span className="text-white font-semibold">Runner goes first</span>, then the <span className="text-orange-400 font-semibold">Chaser</span>. A round continues until the Chaser tags the Runner. The Runner earns points for every turn survived. Once tagged, roles swap.
            </p>
          </div>

          {/* Phase 2: Controls */}
          <div>
            <h3 className="flex items-center gap-2 text-emerald-400 font-medium tracking-wider mb-2 text-base uppercase">
              <Compass className="w-4 h-4" /> 2. Slingshot Controls
            </h3>
            <p>
              Touch/Click and <span className="text-white font-semibold">drag backwards</span> from your circle to aim, then release to launch your ball into high-speed physics action. Power correlates to your drag distance.
              The next turn starts <span className="text-emerald-500 font-semibold font-bold">only when BOTH balls have come to a complete stop</span>.
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

            <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/20">
              <h4 className="flex items-center gap-2 text-emerald-400 font-semibold tracking-wider mb-2 uppercase">
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
            <h3 className="text-emerald-400 font-medium tracking-wider mb-2 text-base uppercase">
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
              <div className="p-3 bg-neutral-900 border border-emerald-500/20 rounded-lg">
                <div className="text-emerald-400 font-semibold tracking-wider text-xs uppercase mb-1 font-bold">Bumper (Boost)</div>
                <div className="text-xs text-neutral-400">Booster hazards of <span className="text-emerald-400 font-bold">1.4x bounciness</span>. Hits supply sudden vertical launch velocity!</div>
              </div>
            </div>
          </div>

          {/* Chaser Power-Up System */}
          <div>
            <h3 className="flex items-center gap-2 text-emerald-400 font-medium tracking-wider mb-2 text-base uppercase">
              <Award className="w-4 h-4" /> Chaser Power-ups
            </h3>
            <p className="mb-3 text-xs text-neutral-400">
              <span className="text-white font-semibold">8 glowing orbs</span> spawn on the map each round. Only the <span className="text-orange-400 font-semibold">Chaser</span> gains abilities from collecting them.
              If the <span className="text-white font-semibold">Runner</span> touches an orb first, they <span className="text-yellow-400 font-semibold">steal it</span> — denying the Chaser that power-up for the round.
              Some power-ups activate immediately on collection; others are stored for manual activation (press <span className="text-white font-semibold">SPACE</span> or tap the HUD button).
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Gravity — violet */}
              <div className="p-2.5 rounded bg-neutral-900 border border-violet-500/25">
                <span className="text-xs font-semibold text-violet-400 uppercase block">Gravity Well</span>
                <span className="text-xs text-zinc-400">
                  <span className="text-violet-300">Auto-activate.</span> Pulls the Runner <span className="text-white font-semibold">80px</span> toward the Chaser instantly on collection. Short-range but immediate.
                </span>
              </div>
              {/* Magnet — blue */}
              <div className="p-2.5 rounded bg-neutral-900 border border-blue-500/25">
                <span className="text-xs font-semibold text-blue-400 uppercase block">Magnet</span>
                <span className="text-xs text-zinc-400">
                  <span className="text-blue-300">Manual activate.</span> Pulls the Runner toward the Chaser for <span className="text-white font-semibold">~120px</span> over <span className="text-white font-semibold">0.8 seconds</span>. A pulsing blue ring and directional arrows on the Runner show the pull in action. Use it to drag them out of hiding.
                </span>
              </div>
              {/* Iron — yellow/gray */}
              <div className="p-2.5 rounded bg-neutral-900 border border-yellow-500/25">
                <span className="text-xs font-semibold text-yellow-400 uppercase block">Iron Ball</span>
                <span className="text-xs text-zinc-400">
                  <span className="text-yellow-300">Manual activate.</span> Reduces all surface friction by <span className="text-white font-semibold">50%</span> for <span className="text-white font-semibold">2 rounds</span>. Plows through sand and glides on ice.
                </span>
              </div>
              {/* Tracker — emerald */}
              <div className="p-2.5 rounded bg-neutral-900 border border-emerald-500/25">
                <span className="text-xs font-semibold text-emerald-400 uppercase block">Tracker</span>
                <span className="text-xs text-zinc-400">
                  <span className="text-emerald-300">Manual activate.</span> Shows a <span className="text-white font-semibold">directional line</span> from the Chaser toward the Runner with exact distance (px) for <span className="text-white font-semibold">5 seconds</span>. Essential for finding hidden Runners.
                </span>
              </div>
            </div>
          </div>

          {/* Smoke — coming later */}
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-700/30">
            <h4 className="flex items-center gap-2 text-neutral-400 font-semibold tracking-wider mb-2 uppercase">
              <Award className="w-4 h-4" /> More Power-ups Coming
            </h4>
            <p className="text-xs text-neutral-500">
              Additional Chaser power-ups are being designed. The fog-of-war system is also being rethought to create more interesting chase dynamics.
            </p>
          </div>

          {/* Runner Orb Denial */}
          <div className="p-4 rounded-xl bg-yellow-950/20 border border-yellow-500/20">
            <h4 className="flex items-center gap-2 text-yellow-400 font-semibold tracking-wider mb-2 uppercase">
              <ShieldAlert className="w-4 h-4" /> Runner: Orb Denial
            </h4>
            <p className="text-xs text-neutral-400">
              The Runner can <span className="text-yellow-300 font-semibold">touch orbs first</span> to steal them before the Chaser collects it. Each stolen orb displays <span className="text-white font-semibold">"STOLEN!"</span> and denies that power-up to the Chaser for the entire round. Strategic denial is a key defensive tool — deny the Gravity Well and Magnet first!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-emerald-500/20 flex justify-end">
          <button
            onClick={onClose}
            id="btn-close-help-footer"
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold tracking-wider text-xs uppercase rounded transition-colors uppercase cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
