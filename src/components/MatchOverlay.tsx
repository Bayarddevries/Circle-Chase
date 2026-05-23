import React from 'react';
import { GamePhase, RoundRecord, MatchConfig, PlayerRole } from '../types';
import { Swords, Trophy, Zap, AlertOctagon, RotateCcw, Home, Sparkles } from 'lucide-react';

interface MatchOverlayProps {
  phase: GamePhase;
  config: MatchConfig;
  currentRound: number;
  currentHider: { name: string; isP1: boolean };
  currentSeeker: { name: string; isP1: boolean };
  roundRecord: RoundRecord | null;
  history: RoundRecord[];
  p1TotalScore: number;
  p2TotalScore: number;
  onNextRound: () => void;
  onRestartGame: () => void;
  onReturnToMenu: () => void;
  isP1Turn: boolean;
  activeRole: PlayerRole;
  creditsEarned?: number;
  totalTurnsSurvived?: number;
  averageSurvival?: number;
  totalPowerUpsCollected?: number;
}

export function MatchOverlay({
  phase,
  config,
  currentRound,
  currentHider,
  currentSeeker,
  roundRecord,
  history,
  p1TotalScore,
  p2TotalScore,
  onNextRound,
  onRestartGame,
  onReturnToMenu,
  isP1Turn,
  activeRole,
  creditsEarned,
  totalTurnsSurvived,
  averageSurvival,
  totalPowerUpsCollected,
}: MatchOverlayProps) {
  if (phase === 'playing' || phase === 'tag_freeze') return null;

  const isSuddenDeath = phase === 'sudden_death_intro';

  const isMatchOver = phase === 'match_over';
  let matchWinnerName = '';
  let matchWinnerScore = 0;
  let matchLoserName = '';
  let matchLoserScore = 0;

  if (isMatchOver) {
    if (p1TotalScore > p2TotalScore) {
      matchWinnerName = config.p1Name;
      matchWinnerScore = p1TotalScore;
      matchLoserName = config.p2Name;
      matchLoserScore = p2TotalScore;
    } else {
      matchWinnerName = config.p2Name;
      matchWinnerScore = p2TotalScore;
      matchLoserName = config.p1Name;
      matchLoserScore = p1TotalScore;
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="w-full max-w-xl bg-neutral-950/90 border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-2xl text-center flex flex-col space-y-6 relative max-h-[95vh] overflow-y-auto">
        
        {/* Glow behind */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/5 blur-[80px] -z-10 pointer-events-none" />

        {/* Round Intro */}
        {phase === 'round_intro' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-full text-[10px] tracking-[4px] text-emerald-400 font-mono uppercase mb-4">
                Round {currentRound + 1} of {config.bestOfRounds}
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-widest text-white uppercase font-sans">
                Roles
              </h2>
              <p className="text-xs text-neutral-500 tracking-[1.5px] mt-1 font-mono uppercase">
                Pass the device to the right player
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 bg-zinc-900 border border-zinc-200/5 rounded-2xl flex flex-col items-center space-y-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/2 pointer-events-none" />
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Runner</span>
                <span className="text-lg font-bold text-white tracking-wide">{currentHider.name}</span>
                <span className="text-xs font-black px-3 py-1 bg-white text-black rounded-lg uppercase tracking-widest leading-none mt-2">
                  Run
                </span>
                <p className="text-zinc-500 text-[10px] leading-relaxed pt-2">
                  Go first. Stay hidden. Survive as long as you can.
                </p>
              </div>

              <div className="p-5 bg-zinc-900 border border-orange-500/10 rounded-2xl flex flex-col items-center space-y-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-orange-500/2 pointer-events-none" />
                <span className="text-[10px] text-orange-500/60 font-mono tracking-widest uppercase">Chaser</span>
                <span className="text-lg font-bold text-white tracking-wide">{currentSeeker.name}</span>
                <span className="text-xs font-black px-3 py-1 bg-[#ff6600] text-black rounded-lg uppercase tracking-widest leading-none mt-2 shadow-lg shadow-orange-500/20">
                  Chase
                </span>
                <p className="text-zinc-500 text-[10px] leading-relaxed pt-2">
                  Faster and slipperier. Use power-ups to catch the Runner.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl text-left text-xs space-y-1">
              <span className="text-emerald-400 font-bold tracking-widest text-[10px] uppercase block font-mono">Rules:</span>
              <p className="text-neutral-400">
                Drag back from your ball to aim, release to launch. Runner goes first each turn. Score 1 point per turn survived. Tagged? Roles swap.
              </p>
            </div>

            <button
              onClick={onNextRound}
              id="btn-intro-start"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-[4px] uppercase text-xs rounded-xl shadow-lg shadow-emerald-500/15 cursor-pointer transition-transform hover:scale-[1.01]"
            >
              Start Round {currentRound + 1}
            </button>
          </div>
        )}

        {/* Sudden Death */}
        {isSuddenDeath && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <AlertOctagon className="w-16 h-16 text-fuchsia-500 animate-bounce mb-3" />
              <h2 className="text-3xl md:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-rose-500 uppercase font-sans">
                Sudden Death
              </h2>
              <p className="text-xs text-neutral-500 tracking-[2px] mt-1 font-mono uppercase">
                Tie: {p1TotalScore} - {p2TotalScore}
              </p>
            </div>

            <div className="p-5 bg-neutral-900 border border-fuchsia-500/30 rounded-2xl space-y-4 text-left">
              <div className="text-sm font-semibold text-fuchsia-400 uppercase tracking-widest text-center border-b border-fuchsia-500/20 pb-2">
                Final Round
              </div>
              <ul className="space-y-2 text-xs text-neutral-300 list-disc list-inside">
                <li>Smaller map, more bumpers.</li>
                <li><strong className="text-white">No fog:</strong> Chaser can always see the Runner.</li>
                <li><strong className="text-fuchsia-400">First tag wins.</strong></li>
              </ul>
            </div>

            <button
              onClick={onNextRound}
              id="btn-sdeath-start"
              className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black tracking-[4px] uppercase text-xs rounded-xl shadow-lg shadow-fuchsia-500/20 cursor-pointer transition-transform"
            >
              Go
            </button>
          </div>
        )}

        {/* Round Over */}
        {phase === 'round_over' && roundRecord && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 bg-red-950/40 border border-red-500/20 rounded-full text-[10px] tracking-[4px] text-red-400 font-mono uppercase mb-4">
                Tagged!
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-widest text-white uppercase font-sans">
                Round {roundRecord.roundIndex + 1} Over
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block mb-1">
                  Turns Survived
                </span>
                <span className="text-3xl font-black text-rose-500 tracking-wider">
                  {roundRecord.turnsSurvived}
                </span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block mb-1">
                  Score
                </span>
                <span className="text-xl font-bold text-emerald-400 tracking-wider font-sans">
                  +{roundRecord.turnsSurvived} pts
                </span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block mb-1">
                  Credits
                </span>
                <span className="text-2xl font-bold text-amber-400 tracking-wider font-sans">
                  +{creditsEarned ?? 0}
                </span>
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border border-emerald-500/10 rounded-xl space-y-3">
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold block text-left">
                Scoreboard
              </span>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-300 font-semibold">{config.p1Name}</span>
                <span className="font-mono font-bold text-white text-lg bg-neutral-950 px-3 py-0.5 rounded border border-white/5">
                  {p1TotalScore} pts
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-300 font-semibold">{config.p2Name}</span>
                <span className="font-mono font-bold text-white text-lg bg-neutral-950 px-3 py-0.5 rounded border border-white/5">
                  {p2TotalScore} pts
                </span>
              </div>
            </div>

            <button
              onClick={onNextRound}
              id="btn-round-next"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-[4px] uppercase text-xs rounded-xl shadow-lg shadow-emerald-500/15 cursor-pointer transition-transform"
            >
              Next Round
            </button>
          </div>
        )}

        {/* Match Over */}
        {phase === 'match_over' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <Trophy className="w-14 h-14 text-yellow-400 animate-pulse mb-3" />
              <span className="text-[10px] tracking-[4px] font-mono font-semibold text-yellow-400 uppercase">
                Winner
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase font-sans mt-2">
                {matchWinnerName}!
              </h2>
            </div>

            <div className="p-6 bg-zinc-900/60 border border-yellow-500/10 rounded-2xl flex items-center justify-around">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-yellow-400 font-semibold block uppercase">Winner</span>
                <span className="text-lg font-bold text-white truncate max-w-[150px] block">{matchWinnerName}</span>
                <span className="text-3xl font-black text-yellow-400 font-mono">{matchWinnerScore}</span>
              </div>
              <div className="text-neutral-600 font-mono font-black text-xl">vs</div>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-neutral-500 block uppercase">Runner-up</span>
                <span className="text-lg font-semibold text-neutral-400 truncate max-w-[150px] block">{matchLoserName}</span>
                <span className="text-2xl font-bold text-neutral-500 font-mono">{matchLoserScore}</span>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">Round History</span>
              <div className="max-h-36 overflow-y-auto border border-neutral-800 rounded-lg text-xs divide-y divide-neutral-900">
                {history.map((record, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between items-center bg-neutral-950/40">
                    <div>
                      <span className="font-semibold text-neutral-300 block">Round {record.roundIndex + 1}</span>
                      <span className="text-[10px] text-neutral-500">
                        {record.hiderName} vs {record.seekerName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400 font-bold block">{record.turnsSurvived} turns</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(totalTurnsSurvived !== undefined || totalPowerUpsCollected !== undefined) && (
              <div className="p-4 bg-neutral-900 border border-amber-500/10 rounded-xl">
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold block text-left mb-3">
                  Stats
                </span>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-black text-white font-mono">{totalTurnsSurvived ?? 0}</div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Total Turns</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-mono">{averageSurvival !== undefined ? averageSurvival.toFixed(1) : '0'}</div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Avg Survival</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-mono">{totalPowerUpsCollected ?? 0}</div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Power-ups</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onRestartGame}
                id="btn-match-replay"
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-700/20 font-bold tracking-wider text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" /> Rematch
              </button>
              <button
                onClick={onReturnToMenu}
                id="btn-match-home"
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" /> Menu
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
