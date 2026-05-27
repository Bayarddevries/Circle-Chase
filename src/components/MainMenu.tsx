import React, { useEffect, useState } from 'react';
import { MatchConfig } from '../types';
import type { GameMode } from '../types';
import { Play, Settings, Users, BookOpen, Cpu, Zap, Swords } from 'lucide-react';
import { playUIClick } from '../game/sounds';

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
  const [gameMode, setGameMode] = useState<GameMode>('standard');

  useEffect(() => {
    if (gameMode === 'survival') {
      setIsCpu(true);
    }
  }, [gameMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      p1Name: p1Name.trim() || 'Player 1',
      p2Name: gameMode === 'survival' ? 'CPU' : (p2Name.trim() || 'Player 2'),
      bestOfRounds: gameMode === 'survival' ? 1 : bestOf,
      colorblindMode,
      isCpu: gameMode === 'survival' ? true : isCpu,
      difficulty,
      gameMode,
    });
  };

  const isSurvival = gameMode === 'survival';

  return (
    <div className="relative min-h-screen bg-[#020502] text-neutral-200 flex flex-col p-4 md:p-8 overflow-y-auto">
      {/* Decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-600/5 blur-[120px] pointer-events-none" />

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      <div className="w-full max-w-xl mx-auto relative z-10 flex flex-col items-center">
        {/* Title — compact */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-950/20 border border-emerald-500/20 rounded-full text-[8px] tracking-[4px] text-emerald-400 font-mono uppercase mb-2 shadow-lg shadow-emerald-500/5">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> TURN TAG
        </div>

        <h1 className="text-3xl md:text-5xl font-display text-center tracking-[8px] text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-emerald-400 uppercase select-none drop-shadow-2xl leading-tight">
          Turn Tag
        </h1>
        <p className="text-[10px] text-neutral-500 tracking-[4px] font-mono uppercase mb-4">
          Turn-Based Tag 'Em Up
        </p>
      </div>

      {/* Form Card — compact */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto relative z-10 bg-neutral-950/90 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-2xl p-5 md:p-6 space-y-3">
        <h2 className="flex items-center gap-2 text-[9px] tracking-[3px] font-mono uppercase text-emerald-400 font-bold border-b border-emerald-500/10 pb-2.5">
          <Settings className="w-3.5 h-3.5 text-emerald-400" /> MATCH SETUP
        </h2>

        {/* Name input(s) */}
        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className="block text-[9px] tracking-widest text-neutral-500 uppercase font-mono font-medium">
              Runner
            </label>
            <div className="relative">
              <input
                id="p1-name-input"
                type="text"
                maxLength={14}
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="w-full bg-[#040604] border border-emerald-500/10 focus:border-emerald-400/40 outline-none rounded-lg px-3.5 py-2.5 text-sm tracking-widest font-semibold focus:ring-1 focus:ring-emerald-400/10 text-emerald-200 transition-all font-sans"
                placeholder={isSurvival ? "Your name" : "Runner name"}
              />
              <Users className="absolute right-3 top-2.5 w-4 h-4 text-emerald-500/20" />
            </div>
          </div>

          {!isSurvival && (
            <div className="space-y-1">
              <label className="block text-[9px] tracking-widest text-neutral-500 uppercase font-mono font-medium">
                Chaser
              </label>
              <div className="relative">
                <input
                  id="p2-name-input"
                  type="text"
                  maxLength={14}
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="w-full bg-[#040604] border border-emerald-500/10 focus:border-emerald-400/40 outline-none rounded-lg px-3.5 py-2.5 text-sm tracking-widest font-semibold focus:ring-1 focus:ring-emerald-400/10 text-emerald-200 transition-all font-sans"
                  placeholder="Chaser name"
                />
                <Users className="absolute right-3 top-2.5 w-4 h-4 text-emerald-500/20" />
              </div>
            </div>
          )}
        </div>

        {/* Best Of (hidden in survival) */}
        {!isSurvival && (
          <div className="space-y-1.5">
            <label className="block text-[9px] tracking-widest text-neutral-500 uppercase font-mono font-medium">
              Best of
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[3, 5, 7].map((rounds) => (
                <button
                  key={rounds}
                  id={`btn-bestof-${rounds}`}
                  type="button"
                  onClick={() => setBestOf(rounds)}
                  className={`py-1.5 px-2 border rounded-lg font-mono text-[10px] font-bold tracking-widest transition-all ${
                    bestOf === rounds
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/10'
                      : 'bg-zinc-900/60 text-neutral-400 border-emerald-500/10 hover:border-emerald-500/30 hover:text-white'
                  }`}
                >
                  {rounds}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Options */}
        <div className="space-y-2">
          <span className="block text-[9px] tracking-widest text-neutral-500 uppercase font-mono font-medium">Options</span>

          {/* Colorblind */}
          <button
            type="button"
            onClick={() => setColorblindMode(!colorblindMode)}
            className={`w-full py-1.5 px-3 border rounded-lg text-[10px] font-mono tracking-widest transition-all flex items-center justify-between ${
              colorblindMode
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900/60 text-neutral-400 border-emerald-500/10 hover:border-emerald-500/30'
            }`}
          >
            <span>COLORBLIND</span>
            <span className={`w-7 h-3.5 rounded-full transition-colors ${colorblindMode ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
              <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${colorblindMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </span>
          </button>

          {/* CPU (hidden in survival) */}
          {!isSurvival && (
            <div className={`w-full border rounded-lg transition-all ${
              isCpu
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-zinc-900/60 border-emerald-500/10'
            }`}>
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[10px] font-mono tracking-widest text-neutral-400">CPU PLAYER</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCpu(!isCpu)}
                  className={`w-7 h-3.5 rounded-full transition-colors ${isCpu ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                >
                  <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${isCpu ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </button>
              </div>
              {isCpu && (
                <div className="flex gap-1 px-3 pb-1.5 pt-0 border-t border-emerald-500/10 mt-0">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-1 rounded-lg font-mono text-[9px] font-bold tracking-widest transition-all ${
                        difficulty === d
                          ? 'bg-emerald-500 text-neutral-950'
                          : 'bg-zinc-800/60 text-neutral-400 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {d === 'easy' ? 'EASY' : d === 'medium' ? 'MED' : 'HARD'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game Mode */}
        <div className="space-y-2">
          <span className="block text-[9px] tracking-widest text-neutral-500 uppercase font-mono font-medium">Mode</span>
          <div className={`w-full border rounded-lg transition-all ${
            isSurvival
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-zinc-900/60 border-emerald-500/10'
          }`}>
            <div className="flex items-center justify-between px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className={`text-[10px] font-mono tracking-widest ${isSurvival ? 'text-emerald-400' : 'text-neutral-400'}`}>SURVIVAL MODE</span>
              </div>
              <button
                type="button"
                onClick={() => setGameMode(isSurvival ? 'standard' : 'survival')}
                className={`w-7 h-3.5 rounded-full transition-colors ${isSurvival ? 'bg-emerald-500' : 'bg-neutral-700'}`}
              >
                <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${isSurvival ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </button>
            </div>
            {isSurvival && (
              <>
                <div className="flex gap-1 px-3 pb-1.5 pt-0 border-t border-emerald-500/10 mt-0">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-1 rounded-lg font-mono text-[9px] font-bold tracking-widest transition-all ${
                        difficulty === d
                          ? 'bg-emerald-500 text-neutral-950'
                          : 'bg-zinc-800/60 text-neutral-400 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {d === 'easy' ? 'EASY' : d === 'medium' ? 'MED' : 'HARD'}
                    </button>
                  ))}
                </div>
                <div className="px-3 pb-1.5">
                  <p className="text-[9px] text-neutral-500 text-left leading-relaxed">
                    One round vs CPU. Survive as long as possible. Scores appear on the global leaderboard.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            id="btn-main-help"
            onClick={() => { playUIClick(); onOpenHelp(); }}
            className="flex-1 py-2.5 text-[10px] bg-zinc-900/40 hover:bg-zinc-850 text-neutral-300 font-bold tracking-wider rounded-lg uppercase border border-emerald-500/10 transition-colors flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Manual
          </button>

          <button
            type="submit"
            id="btn-main-start"
            onClick={playUIClick}
            className="flex-[2] py-2.5 text-[10px] bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest rounded-lg uppercase border border-emerald-400/20 shadow-lg shadow-emerald-500/15 transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current text-neutral-950" /> {isSurvival ? 'SURVIVE' : 'START'}
          </button>
        </div>
      </form>

      {/* Footer — thin */}
      <div className="w-full max-w-xl mx-auto flex justify-center text-[8px] font-mono tracking-wider text-neutral-600 uppercase border-t border-emerald-500/10 pt-2.5 mt-3 gap-3 flex-wrap">
        <span>© 2026 Bayard devries</span>
        <span>Hotseat</span>
      </div>
    </div>
  );
}
