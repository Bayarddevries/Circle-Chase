/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GamePhase, MatchConfig, RoundRecord, PlayerRole } from './types';
import type { RoundScoreResult } from './game/scoring';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { MatchOverlay } from './components/MatchOverlay';
import { HelpModal } from './components/HelpManual';
import { Trophy, HelpCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [config, setConfig] = useState<MatchConfig>({
    p1Name: 'Player 1',
    p2Name: 'Player 2',
    bestOfRounds: 5,
    isCpu: false,
    difficulty: 'medium',
  });

  const [currentRound, setCurrentRound] = useState<number>(0);
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  
  const [isSuddenDeath, setIsSuddenDeath] = useState<boolean>(false);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [activeRoundRecord, setActiveRoundRecord] = useState<RoundRecord | null>(null);

  // Initialize or Reset a match
  const handleStartGame = (newConfig: MatchConfig) => {
    setConfig(newConfig);
    setCurrentRound(0);
    setHistory([]);
    setP1Score(0);
    setP2Score(0);
    setIsSuddenDeath(false);
    setActiveRoundRecord(null);
    setPhase('round_intro'); // Show role assignments first
  };

  const handleNextRound = () => {
    if (phase === 'round_intro' || phase === 'sudden_death_intro') {
      setPhase('playing');
    } else if (phase === 'round_over') {
      const nextRnd = currentRound + 1;
      
      // Determine if match series limit is completed
      if (nextRnd >= config.bestOfRounds) {
        // Evaluate for true ties
        if (p1Score === p2Score) {
          setIsSuddenDeath(true);
          setPhase('sudden_death_intro');
        } else {
          setPhase('match_over');
        }
      } else {
        // Alternate next normal round
        setCurrentRound(nextRnd);
        setPhase('round_intro');
      }
    }
  };

  // Callback when Seeker tags Hider
  const handleRoundComplete = (
    data: RoundScoreResult & { suddenDeathWinnerRole?: PlayerRole }
  ) => {
    const p1IsHider = config.gameMode === 'survival' || currentRound % 2 === 0;
    const hiderName = p1IsHider ? config.p1Name : config.p2Name;
    const seekerName = p1IsHider ? config.p2Name : config.p1Name;

    // Determine round winner role (sudden death overrides)
    const roundWinnerRole: 'hider' | 'seeker' =
      data.suddenDeathWinnerRole || data.roundWinner;

    // Add scores to totals based on roles
    if (p1IsHider) {
      setP1Score(prev => prev + data.hiderScore);
      setP2Score(prev => prev + data.seekerScore);
    } else {
      setP1Score(prev => prev + data.seekerScore);
      setP2Score(prev => prev + data.hiderScore);
    }

    // Build round record with full breakdowns
    const newRecord: RoundRecord = {
      roundIndex: currentRound,
      p1Role: p1IsHider ? 'hider' : 'seeker',
      p2Role: p1IsHider ? 'seeker' : 'hider',
      turnsSurvived: data.hiderBreakdown.base ?? 0,
      roundWinner: roundWinnerRole === 'hider' ? hiderName : seekerName,
      hiderName,
      seekerName,
      hiderScore: data.hiderScore,
      seekerScore: data.seekerScore,
      hiderBreakdown: data.hiderBreakdown,
      seekerBreakdown: data.seekerBreakdown,
    };

    setHistory(prev => [...prev, newRecord]);
    setActiveRoundRecord(newRecord);
    if (config.gameMode === 'survival') {
      setPhase('match_over');
    } else {
      setPhase(isSuddenDeath ? 'match_over' : 'round_over');
    }
  };

  const handleRestartGame = () => {
    handleStartGame(config);
  };

  const handleReturnToMenu = () => {
    setPhase('menu');
  };

  // Determine current players as Hider vs Seeker info
  const p1IsHider = config.gameMode === 'survival' || currentRound % 2 === 0;
  const currentHider = {
    name: p1IsHider ? config.p1Name : config.p2Name,
    isP1: p1IsHider,
  };
  const currentSeeker = {
    name: p1IsHider ? config.p2Name : config.p1Name,
    isP1: !p1IsHider,
  };

  return (
    <div className="min-h-screen bg-[#020502] text-neutral-200 font-sans antialiased overflow-x-hidden selection:bg-emerald-500/30 selection:text-white">
      {/* 1. Main configuration terminal */}
      {phase === 'menu' && (
        <MainMenu 
          onStartGame={handleStartGame} 
          onOpenHelp={() => setHelpOpen(true)} 
        />
      )}

      {/* 2. Active playing canvas screens */}
      {(phase === 'playing' || phase === 'round_over' || phase === 'round_intro' || phase === 'sudden_death_intro' || phase === 'match_over') && phase !== 'menu' && (
        <div className="w-full h-screen flex flex-col justify-between">
          <GameCanvas
            phase={phase}
            config={config}
            currentRound={currentRound}
            isSuddenDeath={isSuddenDeath}
            onRoundComplete={handleRoundComplete}
            onOpenHelp={() => setHelpOpen(true)}
            onExitGame={handleReturnToMenu}
          />

          {/* Sub-structural backdrop transitions overlay modal */}
          <MatchOverlay
            phase={phase}
            config={config}
            currentRound={currentRound}
            currentHider={currentHider}
            currentSeeker={currentSeeker}
            roundRecord={activeRoundRecord}
            history={history}
            p1TotalScore={p1Score}
            p2TotalScore={p2Score}
            onNextRound={handleNextRound}
            onRestartGame={handleRestartGame}
            onReturnToMenu={handleReturnToMenu}
            isP1Turn={phase === 'playing' ? (currentRound % 2 === 0) : true}
            activeRole={currentRound % 2 === 0 ? 'hider' : 'seeker'}
          />
        </div>
      )}

      {/* 3. Global Operations Manual Help Screen overlay */}
      <HelpModal 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
      />
    </div>
  );
}
