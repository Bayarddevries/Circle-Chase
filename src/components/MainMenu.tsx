import React, { useState } from 'react';
import { MatchConfig, AIDifficulty } from '../types';
import { Swords, Trophy, Play, Settings, Users, BookOpen, Cpu, Store } from 'lucide-react';

interface MainMenuProps {
  onStartGame: (config: MatchConfig) => void;
  onOpenHelp: () => void;
  onOpenShop: () => void;
  onOpenLeaderboard: () => void;
  onOpenProfile: () => void;
}

export function MainMenu({ onStartGame, onOpenHelp, onOpenShop, onOpenLeaderboard, onOpenProfile }: MainMenuProps) {
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [bestOf, setBestOf] = useState<number>(5);
  const [isCpu, setIsCpu] = useState(false);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [colorblindMode, setColorblindMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      p1Name: p1Name.trim() || 'Player 1',
      p2Name: isCpu ? 'CPU' : (p2Name.trim() || 'Player 2'),
      bestOfRounds: bestOf,
      isCpu,
      difficulty: isCpu ? difficulty : undefined,
      colorblindMode,
    });
  };

  return (
    <div className="relative min-h-screen bg-[#07090e] text-neutral-200 flex flex-col justify-between p-6 overflow-hidden md:p-12">
      {/* Decorative background glow */}
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

      {/* Header */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center mt-6 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/20 border border-amber-500/20 rounded-full text-[9px] tracking-[4px] text-amber-500 font-mono uppercase mb-4 shadow-lg shadow-amber-500/5">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Ready to Play
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-center tracking-[8px] font-sans text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-500 uppercase select-none drop-shadow-2xl">
          Chase Tag
        </h1>
        <p className="text-xs md:text-sm text-neutral-400 tracking-[4px] font-mono mt-3 uppercase text-center max-w-lg">
          Turn-Based Physics Evasion
        </p>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto my-auto relative z-10 bg-[#0c0e14]/90 backdrop-blur-md border border-amber-500/15 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
        <h2 className="flex items-center gap-2 text-[10px] tracking-[3px] font-mono uppercase text-amber-500 font-bold border-b border-amber-500/10 pb-3">
          <Settings className="w-4 h-4 text-amber-500" /> Match Setup
        </h2>

        {/* Player Names */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] tracking-widest text-neutral-400 uppercase font-mono font-medium">
              Player 1 (Runner)
            </label>
            <div className="relative">
              <input
                id="p1-name-input"
                type="text"
                maxLength={14}
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="w-full bg-[#050609] border border-amber-500/10 focus:border-amber-400/40 outline-none rounded-lg px-4 py-3 text-sm tracking-widest font-semibold focus:ring-1 focus:ring-amber-400/10 text-amber-200 transition-all font-sans"
                placeholder="Enter name"
              />
              <Users className="absolute right-3.5 top-3.5 w-4 h-4 text-amber-500/20" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] tracking-widest text-neutral-400 uppercase font-mono font-medium">
              Player 2 (Chaser)
            </label>
            <div className="relative">
              <input
                id="p2-name-input"
                type="text"
                maxLength={14}
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                className="w-full bg-[#050609] border border-amber-500/10 focus:border-amber-400/40 outline-none rounded-lg px-4 py-3 text-sm tracking-widest font-semibold focus:ring-1 focus:ring-amber-400/10 text-amber-200 transition-all font-sans"
                placeholder="Enter name"
              />
              <Users className="absolute right-3.5 top-3.5 w-4 h-4 text-amber-500/20" />
            </div>
          </div>
        </div>

        {/* Play vs CPU Toggle */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-cpu-toggle"
              onClick={() => {
                setIsCpu(!isCpu);
                if (!isCpu) setP2Name('CPU');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold tracking-wider transition-all ${
                isCpu
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/5'
                  : 'bg-neutral-900/40 border-amber-500/10 text-neutral-400 hover:border-amber-500/30'
              }`}
            >
              <Cpu className={`w-4 h-4 ${isCpu ? 'text-emerald-400' : 'text-neutral-500'}`} />
              Play vs CPU
            </button>
          </div>

          {isCpu && (
            <div className="flex items-center gap-2 pl-1">
              <label className="text-[10px] tracking-widest text-neutral-400 uppercase font-mono font-medium mr-1">
                Difficulty
              </label>
              <div className="flex gap-1.5">
                {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((level) => (
                  <button
                    key={level}
                    id={`btn-diff-${level}`}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition-all ${
                      difficulty === level
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/5'
                        : 'bg-neutral-900/40 border-amber-500/10 text-neutral-400 hover:border-amber-500/30'
                    }`}
                  >
                    {level === 'easy' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colorblind Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-colorblind-toggle"
            onClick={() => setColorblindMode(!colorblindMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold tracking-wider transition-all ${
              colorblindMode
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/5'
                : 'bg-neutral-900/40 border-amber-500/10 text-neutral-400 hover:border-amber-500/30'
            }`}
          >
            ◻ Colorblind Mode
          </button>
        </div>

        {/* Series Length */}
        <div className="space-y-2">
          <label className="block text-[10px] tracking-widest text-neutral-400 uppercase font-mono font-medium">
            Rounds
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[3, 5, 7].map((rounds) => (
              <button
                key={rounds}
                id={`btn-bestof-${rounds}`}
                type="button"
                onClick={() => setBestOf(rounds)}
                className={`py-2 px-3 border rounded-xl font-mono text-xs font-bold tracking-widest transition-all ${
                  bestOf === rounds
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 font-extrabold shadow-lg shadow-amber-500/10'
                    : 'bg-neutral-900/60 text-neutral-400 border-amber-500/10 hover:border-amber-500/30 hover:text-white'
                }`}
              >
                {rounds}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            id="btn-main-help"
            onClick={onOpenHelp}
            className="flex-1 py-3 text-xs bg-neutral-900/40 hover:bg-neutral-850 text-neutral-300 font-bold tracking-wider rounded-xl uppercase border border-amber-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-amber-500" /> How to Play
          </button>

          <button
            type="button"
            id="btn-main-shop"
            onClick={onOpenShop}
            className="flex-1 py-3 text-xs bg-amber-950/20 hover:bg-amber-900/30 text-amber-300 border border-amber-500/20 rounded-xl uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Store className="w-4 h-4" /> Shop
          </button>

          <button
            type="submit"
            id="btn-main-start"
            className="flex-[2] py-3 text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black tracking-widest rounded-xl uppercase border border-amber-400/20 shadow-lg shadow-amber-500/15 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current text-neutral-950" /> Start Game
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] font-mono tracking-wider text-neutral-500 uppercase border-t border-amber-500/10 pt-4 mt-6 gap-2">
        <span className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Goal: Run long as Runner / Catch fast as Chaser</span>
        <span>Local 2-Player Pass-and-Play</span>
        <span>© 2026</span>
      </div>
    </div>
  );
}
