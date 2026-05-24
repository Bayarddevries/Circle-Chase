import React, { useState } from 'react';
import { MatchConfig } from '../types';
import { Swords, Trophy, Play, Settings, Users, BookOpen } from 'lucide-react';

interface MainMenuProps {
  onStartGame: (config: MatchConfig) => void;
  onOpenHelp: () => void;
}

export function MainMenu({ onStartGame, onOpenHelp }: MainMenuProps) {
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [bestOf, setBestOf] = useState<number>(5);
  const [colorblindMode, setColorblindMode] = useState<boolean>(false);
  const [isCpu, setIsCpu] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      p1Name: p1Name.trim() || 'Player 1',
      p2Name: p2Name.trim() || 'Player 2',
      bestOfRounds: bestOf,
      colorblindMode,
      isCpu,
      difficulty,
    });
  };

  return (
    <div className="relative min-h-screen bg-[#07090e] text-neutral-200 flex flex-col justify-between p-6 overflow-hidden md:p-12">
      {/* Decorative Cinematic Amber Halos */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-amber-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-yellow-600/5 blur-[140px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `linear-gradient(rgba(217, 119, 6, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(217, 119, 6, 0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Header with Title and Cyber Creds */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center mt-6 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/20 border border-amber-500/20 rounded-full text-[9px] tracking-[4px] text-amber-500 font-mono uppercase mb-4 shadow-lg shadow-amber-500/5">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> CHAMPIONSHIP SLATE PROTOCOL ACTIVE
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-center tracking-[8px] font-sans text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-500 uppercase select-none drop-shadow-2xl">
          Night Golf Chase
        </h1>
        <p className="text-xs md:text-sm text-neutral-400 tracking-[4px] font-mono mt-3 uppercase text-center max-w-lg">
          Turn-Based Cinematic Physics Evasion & Evocative Stealth Drift
        </p>
      </div>

      {/* Configuration Form Card */}
      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto my-auto relative z-10 bg-[#0c0e14]/90 backdrop-blur-md border border-amber-500/15 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        <h2 className="flex items-center gap-2 text-[10px] tracking-[3px] font-mono uppercase text-amber-500 font-bold border-b border-amber-500/10 pb-3">
          <Settings className="w-4 h-4 text-amber-500" /> CHALLENGE REGISTRY
        </h2>

        {/* Name Registration Input Grid */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] tracking-widest text-neutral-400 uppercase font-mono font-medium">
              Pilot Alpha (Hider Starting)
            </label>
            <div className="relative">
              <input
                id="p1-name-input"
                type="text"
                maxLength={14}
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="w-full bg-[#050609] border border-amber-500/10 focus:border-amber-400/40 outline-none rounded-lg px-4 py-3 text-sm tracking-widest font-semibold focus:ring-1 focus:ring-amber-400/10 text-amber-200 transition-all font-sans"
                placeholder="PILOT ALPHA"
              />
              <Users className="absolute right-3.5 top-3.5 w-4 h-4 text-amber-500/20" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] tracking-widest text-neutral-400 uppercase font-mono font-medium">
              Pilot Beta (Seeker Starting)
            </label>
            <div className="relative">
              <input
                id="p2-name-input"
                type="text"
                maxLength={14}
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                className="w-full bg-[#050609] border border-amber-500/10 focus:border-amber-400/40 outline-none rounded-lg px-4 py-3 text-sm tracking-widest font-semibold focus:ring-1 focus:ring-amber-400/10 text-amber-200 transition-all font-sans"
                placeholder="PILOT BETA"
              />
              <Users className="absolute right-3.5 top-3.5 w-4 h-4 text-amber-500/20" />
            </div>
          </div>
        </div>

        {/* Series Length Selector */}
        <div className="space-y-2">
          <label className="block text-[10px] tracking-widest text-neutral-400 uppercase font-mono font-medium">
            Match Series Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[3, 5, 7].map((rounds) => (
              <button
                key={rounds}
                id={`btn-bestof-${rounds}`}
                type="button"
                onClick={() => setBestOf(rounds)}
                className={`py-2 px-3 border rounded-xl font-mono text-xs font-bold tracking-widest transition-all ${
                  bestOf === roudsCount(rounds)
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/10'
                    : 'bg-neutral-900/60 text-neutral-400 border-amber-500/10 hover:border-amber-500/30 hover:text-white'
                }`}
              >
                {rounds} RDS
              </button>
            ))}
          </div>
        </div>

        {/* Game Options */}
        <div className="space-y-3">
          <span className="block text-[10px] tracking-widest text-neutral-400 uppercase font-mono font-medium">Game Options</span>

          {/* Colorblind Mode */}
          <button
            type="button"
            onClick={() => setColorblindMode(!colorblindMode)}
            className={`w-full py-2 px-3 border rounded-xl text-xs font-mono tracking-widest transition-all flex items-center justify-between ${
              colorblindMode
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-neutral-900/60 text-neutral-400 border-amber-500/10 hover:border-amber-500/30'
            }`}
          >
            <span>COLORBLIND MODE</span>
            <span className={`w-8 h-4 rounded-full transition-colors ${colorblindMode ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${colorblindMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </span>
          </button>

          {/* CPU Opponent */}
          <button
            type="button"
            onClick={() => setIsCpu(!isCpu)}
            className={`w-full py-2 px-3 border rounded-xl text-xs font-mono tracking-widest transition-all flex items-center justify-between ${
              isCpu
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-neutral-900/60 text-neutral-400 border-amber-500/10 hover:border-amber-500/30'
            }`}
          >
            <span>CPU OPPONENT</span>
            <span className={`w-8 h-4 rounded-full transition-colors ${isCpu ? 'bg-amber-500' : 'bg-neutral-700'}`}>
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${isCpu ? 'translate-x-4' : 'translate-x-0'}`} />
            </span>
          </button>

          {/* Difficulty selector (only when CPU is on) */}
          {isCpu && (
            <div className="space-y-2">
              <label className="block text-[10px] tracking-widest text-neutral-400 uppercase font-mono font-medium">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 border rounded-xl font-mono text-xs font-bold tracking-widest transition-all ${
                      difficulty === d
                        ? 'bg-amber-500 text-neutral-950 border-amber-400'
                        : 'bg-neutral-900/60 text-neutral-400 border-amber-500/10 hover:border-amber-500/30'
                    }`}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            id="btn-main-help"
            onClick={onOpenHelp}
            className="flex-1 py-3 text-xs bg-neutral-900/40 hover:bg-neutral-850 text-neutral-300 font-bold tracking-wider rounded-xl uppercase border border-amber-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-amber-500" /> Manual
          </button>

          <button
            type="submit"
            id="btn-main-start"
            className="flex-[2] py-3 text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black tracking-widest rounded-xl uppercase border border-amber-400/20 shadow-lg shadow-amber-500/15 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-neutral-950" /> Start Chase
          </button>
        </div>
      </form>

      {/* Instruction Mini Guide or Footer Card */}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] font-mono tracking-wider text-neutral-500 uppercase border-t border-amber-500/10 pt-4 mt-6 gap-2">
        <span className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Goal: Escape longest as Hider / Catch fast as Seeker</span>
        <span>Local Device Pass-and-Play Hotseat</span>
        <span>© 2026 Night Cyber Golfing Corp</span>
      </div>
    </div>
  );

  // Quick helper to strictly cast value
  function roudsCount(r: number) {
    return r;
  }
}
