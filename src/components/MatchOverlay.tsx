import React, { useEffect, useRef, useState } from 'react';
import { GamePhase, RoundRecord, MatchConfig, PlayerRole } from '../types';
import { Swords, Trophy, Zap, AlertOctagon, RotateCcw, Home, Sparkles } from 'lucide-react';
import { playUIClick, playRoundOver, playMatchOver } from '../game/sounds';
import { submitSurvivalScore } from '../stats/firebase';
import { updateStats } from '../stats/storage';
import { LeaderboardPanel } from '../stats/LeaderboardPanel';
import { StatsPanel } from '../stats/StatsPanel';

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
}: MatchOverlayProps) {
  const [activeTab, setActiveTab] = useState<'log' | 'leaderboard' | 'stats'>('log');
  const scoreSubmittedRef = useRef(false);

  // Submit survival score on match_over
  const matchOverPlayedRef = useRef(false);
  useEffect(() => {
    if (phase === 'match_over') {
      if (!matchOverPlayedRef.current) {
        matchOverPlayedRef.current = true;
        playMatchOver();
      }
      if (config.gameMode === 'survival' && roundRecord && !scoreSubmittedRef.current) {
        scoreSubmittedRef.current = true;
        submitSurvivalScore(
          config.p1Name,
          roundRecord.turnsSurvived,
          roundRecord.hiderScore,
          config.difficulty || 'medium',
        ).catch(() => {});
        updateStats(
          roundRecord.turnsSurvived,
          roundRecord.hiderScore,
          true,
          config.difficulty || 'medium',
        );
      }
    }
  }, [phase, config.gameMode, config.p1Name, config.difficulty, roundRecord]);

  if (phase === 'playing' || phase === 'tag_freeze') return null;

  const isSuddenDeath = phase === 'sudden_death_intro';

  // Find general winner
  const isMatchOver = phase === 'match_over';
  let matchWinnerName = '';
  let matchWinnerScore = 0;
  let matchLoserName = '';
  let matchLoserScore = 0;
  let isTie = p1TotalScore === p2TotalScore;

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

        {/* Phase 1: Round Intro / Side Swap */}
        {phase === 'round_intro' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-full text-[10px] tracking-[4px] text-emerald-400 font-mono uppercase mb-4">
                Round {currentRound + 1} of {config.bestOfRounds}
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-widest text-white uppercase font-sans">
                Runner vs Chaser
              </h2>
              <p className="text-xs text-neutral-500 tracking-[1.5px] mt-1 font-mono uppercase">
                Hand the device after your turn
              </p>
            </div>

            {/* Asymmetric Role Display Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 bg-zinc-900 border border-zinc-200/5 rounded-2xl flex flex-col items-center space-y-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/2 pointer-events-none" />
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Runner</span>
                <span className="text-lg font-bold text-white tracking-wide">{currentHider.name}</span>
                <span className="text-xs font-black px-3 py-1 bg-white text-black rounded-lg uppercase tracking-widest leading-none mt-2">
                  Runner
                </span>
                <p className="text-zinc-500 text-[10px] leading-relaxed pt-2">
                  Launch first. Hide in the fog. Stay out of reach.
                </p>
              </div>

              <div className="p-5 bg-zinc-900 border border-orange-500/10 rounded-2xl flex flex-col items-center space-y-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-orange-500/2 pointer-events-none" />
                <span className="text-[10px] text-orange-500/60 font-mono tracking-widest uppercase">Chaser</span>
                <span className="text-lg font-bold text-white tracking-wide">{currentSeeker.name}</span>
                <span className="text-xs font-black px-3 py-1 bg-[#ff6600] text-black rounded-lg uppercase tracking-widest leading-none mt-2 shadow-lg shadow-orange-500/20">
                  Chaser
                </span>
                <p className="text-zinc-500 text-[10px] leading-relaxed pt-2">
                  +50% speed, -15% friction, and power-ups on the map.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl text-left text-xs space-y-1">
              <span className="text-emerald-400 font-bold tracking-widest text-[10px] uppercase block font-mono">Quick Tips</span>
              <p className="text-neutral-400">
                Runner scores 1 point per turn survived. Chaser scores by tagging. Drag back to aim, release to launch.
              </p>
            </div>

            <button
              onClick={() => { playUIClick(); onNextRound(); }}
              id="btn-intro-start"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-[4px] uppercase text-xs rounded-xl shadow-lg shadow-emerald-500/15 cursor-pointer transition-transform hover:scale-[1.01]"
            >
              Start Round {currentRound + 1}
            </button>
          </div>
        )}

        {/* Phase 2: Sudden Death Intro */}
        {isSuddenDeath && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <AlertOctagon className="w-16 h-16 text-fuchsia-500 animate-bounce mb-3" />
              <h2 className="text-3xl md:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-rose-500 uppercase font-sans">
                SUDDEN DEATH
              </h2>
              <p className="text-xs text-neutral-500 tracking-[2px] mt-1 font-mono uppercase">
                Tied at {p1TotalScore} - {p2TotalScore}
              </p>
            </div>

            <div className="p-5 bg-neutral-900 border border-fuchsia-500/30 rounded-2xl space-y-4 text-left">
              <div className="text-sm font-semibold text-fuchsia-400 uppercase tracking-widest text-center border-b border-fuchsia-500/20 pb-2">
                Sudden Death Rules
              </div>
              <ul className="space-y-2 text-xs text-neutral-300 list-disc list-inside">
                <li>Map area is restricted to a compact size.</li>
                <li>High-density bumpers deployed.</li>
                <li><strong className="text-white">Zero Fog of War:</strong> All positions are constantly revealed.</li>
                <li><strong className="text-fuchsia-400">Survival Condition:</strong> First player to score a tag wins the game instantly!</li>
              </ul>
            </div>

            <button
              onClick={() => { playUIClick(); onNextRound(); }}
              id="btn-sdeath-start"
              className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black tracking-[4px] uppercase text-xs rounded-xl shadow-lg shadow-fuchsia-500/20 cursor-pointer transition-transform"
            >
              Final Round
            </button>
          </div>
        )}

        {/* Phase 3: Round Over */}
        {phase === 'round_over' && roundRecord && (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <span className="px-3 py-1 bg-red-950/40 border border-red-500/20 rounded-full text-[10px] tracking-[4px] text-red-400 font-mono uppercase mb-4">
                Tag!
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-widest text-white uppercase font-sans">
                ROUND {roundRecord.roundIndex + 1} RESULT
              </h2>
            </div>

            {/* Scoring Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {/* Hider summary */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="text-xs text-neutral-500 font-mono uppercase mb-2">
                  {roundRecord.hiderName} (RUNNER)
                </div>
                <div className="text-2xl font-black text-rose-500 mb-3">
                  {roundRecord.hiderScore}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Turns Survived</span>
                    <span className="text-emerald-300">+{roundRecord.hiderBreakdown.base}</span>
                  </div>
                  {roundRecord.hiderBreakdown.comboBonus > 0 && (
                    <div className="flex justify-between text-emerald-300">
                      <span>Bumper Combos</span>
                      <span>+{roundRecord.hiderBreakdown.comboBonus}</span>
                    </div>
                  )}
                  {roundRecord.hiderBreakdown.nearMissBonus > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>Near Miss</span>
                      <span>+{roundRecord.hiderBreakdown.nearMissBonus}</span>
                    </div>
                  )}
                  {roundRecord.hiderBreakdown.powerUpBonus > 0 && (
                    <div className="flex justify-between text-purple-300">
                      <span>Power-up</span>
                      <span>+{roundRecord.hiderBreakdown.powerUpBonus}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Seeker summary */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="text-xs text-neutral-500 font-mono uppercase mb-2">
                  {roundRecord.seekerName} (CHASER)
                </div>
                <div className="text-2xl font-black text-cyan-500 mb-3">
                  {roundRecord.seekerScore}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Tag</span>
                    <span className="text-yellow-300">+{roundRecord.seekerBreakdown.base}</span>
                  </div>
                  {roundRecord.seekerBreakdown.quickTagBonus > 0 && (
                    <div className="flex justify-between text-yellow-200">
                      <span>Quick Tag Bonus</span>
                      <span>+{roundRecord.seekerBreakdown.quickTagBonus}</span>
                    </div>
                  )}
                  {roundRecord.seekerBreakdown.powerUpBonus > 0 && (
                    <div className="flex justify-between text-purple-300">
                      <span>Power-up</span>
                      <span>+{roundRecord.seekerBreakdown.powerUpBonus}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Score updates */}
            <div className="p-4 bg-neutral-900 border border-emerald-500/10 rounded-xl space-y-3">
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold block text-left">
                Scoreboard
              </span>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-300 font-semibold">{config.p1Name}</span>
                <span className="font-mono font-bold text-white text-lg bg-neutral-950 px-3 py-0.5 rounded border border-white/5">
                  {p1TotalScore} PTS
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-300 font-semibold">{config.p2Name}</span>
                <span className="font-mono font-bold text-white text-lg bg-neutral-950 px-3 py-0.5 rounded border border-white/5">
                  {p2TotalScore} PTS
                </span>
              </div>
            </div>

            <button
              onClick={() => { playRoundOver(); onNextRound(); }}
              id="btn-round-next"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-[4px] uppercase text-xs rounded-xl shadow-lg shadow-emerald-500/15 cursor-pointer transition-transform"
            >
              Next Round
            </button>
          </div>
        )}

        {/* Phase 4: Match Over / Game Summary */}
        {phase === 'match_over' && (
          <div className="space-y-6">
            {config.gameMode === 'survival' ? (
              <SurvivalMatchOver roundRecord={roundRecord} config={config} />
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <Trophy className="w-14 h-14 text-yellow-400 animate-pulse mb-3" />
                  <span className="text-[10px] tracking-[4px] font-mono font-semibold text-yellow-400 uppercase">
                    Match Over
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase font-sans mt-2">
                    {matchWinnerName} WINS!
                  </h2>
                </div>

                {/* Score comparison visual */}
                <div className="p-6 bg-zinc-900/60 border border-yellow-500/10 rounded-2xl flex items-center justify-around">
                  <div>
                    <span className="text-[10px] font-mono tracking-wider text-yellow-400 font-semibold block uppercase">CHAMPION</span>
                    <span className="text-lg font-bold text-white truncate max-w-[150px] block">{matchWinnerName}</span>
                    <span className="text-3xl font-black text-yellow-400 font-mono">{matchWinnerScore}</span>
                  </div>
                  <div className="text-neutral-600 font-mono font-black text-xl">v</div>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider text-neutral-500 block uppercase">Runner-Up</span>
                    <span className="text-lg font-semibold text-neutral-400 truncate max-w-[150px] block">{matchLoserName}</span>
                    <span className="text-2xl font-bold text-neutral-500 font-mono">{matchLoserScore}</span>
                  </div>
                </div>
              </>
            )}

            {/* Tabbed content */}
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-neutral-800">
                <button
                  onClick={() => setActiveTab('log')}
                  className={`px-4 py-2 text-xs font-mono uppercase transition-colors ${
                    activeTab === 'log'
                      ? 'border-b-2 border-emerald-500 text-emerald-300'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Round Log
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-4 py-2 text-xs font-mono uppercase transition-colors ${
                    activeTab === 'leaderboard'
                      ? 'border-b-2 border-emerald-500 text-emerald-300'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-2 text-xs font-mono uppercase transition-colors ${
                    activeTab === 'stats'
                      ? 'border-b-2 border-emerald-500 text-emerald-300'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Stats
                </button>
              </div>

              {/* Tab panels */}
              {activeTab === 'log' && (
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                    Round Log
                  </span>
                  <div className="max-h-36 overflow-y-auto border border-neutral-800 rounded-lg text-xs divide-y divide-neutral-900">
                    {history.map((record, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center bg-neutral-950/40">
                        <div>
                          <span className="font-semibold text-neutral-300 block">Round {record.roundIndex + 1}</span>
                          <span className="text-[10px] text-neutral-500">
                            Runner: {record.hiderName}  |  Chaser: {record.seekerName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-emerald-400 font-bold block">+{record.turnsSurvived} Turns</span>
                          <span className="text-[10px] text-neutral-500">Points</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'leaderboard' && (
                <LeaderboardPanel playerName={config.p1Name} difficulty={config.difficulty} />
              )}
              {activeTab === 'stats' && (
                <StatsPanel playerName={config.p1Name} />
              )}
            </div>

{/* Option menus */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { playUIClick(); onRestartGame(); }}
                id="btn-match-replay"
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-700/20 font-bold tracking-wider text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" /> {config.gameMode === 'survival' ? 'TRY AGAIN' : 'REPLAY SERIES'}
              </button>
              <button
                onClick={() => { playUIClick(); onReturnToMenu(); }}
                id="btn-match-home"
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black tracking-widest text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" /> Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// ── Survival Mode Match Over component ─────────────────────
function SurvivalMatchOver({
  roundRecord,
  config,
}: {
  roundRecord: RoundRecord | null;
  config: MatchConfig;
}) {
  const turns = roundRecord?.turnsSurvived ?? 0;
  const score = roundRecord?.hiderScore ?? 0;

  return (
    <>
      <div className="flex flex-col items-center">
        <Sparkles className="w-14 h-14 text-emerald-400 animate-pulse mb-3" />
        <span className="text-[10px] tracking-[4px] font-mono font-semibold text-emerald-400 uppercase">
          Survival Run Complete
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase font-sans mt-2">
          {config.p1Name}
        </h2>
      </div>

      {/* Two-panel score card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-zinc-900/60 border border-emerald-500/20 rounded-2xl flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-wider text-emerald-400 font-semibold uppercase mb-2">
            Rounds Survived
          </span>
          <span className="text-5xl md:text-6xl font-black text-white font-mono">
            {turns}
          </span>
        </div>
        <div className="p-6 bg-zinc-900/60 border border-amber-500/20 rounded-2xl flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-wider text-amber-400 font-semibold uppercase mb-2">
            Total Score
          </span>
          <span className="text-5xl md:text-6xl font-black text-amber-400 font-mono">
            {score}
          </span>
        </div>
      </div>

      {/* Difficulty badge */}
      {config.difficulty && (
        <div className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
          Difficulty: <span className="text-neutral-300 font-bold">{config.difficulty}</span>
        </div>
      )}
    </>
  );
}
