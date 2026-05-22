/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GamePhase, MatchConfig, RoundRecord, Unlocks, RoundMeta, PlayerRole, AIDifficulty } from './types';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { MatchOverlay } from './components/MatchOverlay';
import { HelpModal } from './components/HelpManual';
import { ShopModal } from './components/ShopModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ProfileModal } from './components/ProfileModal';
import { Trophy, HelpCircle, RefreshCw, Store, BarChart3, User } from 'lucide-react';
import { useMetaProgression } from './hooks/useMetaProgression';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [config, setConfig] = useState<MatchConfig>({
    p1Name: 'Player 1',
    p2Name: 'Player 2',
    bestOfRounds: 5,
  });

  const [currentRound, setCurrentRound] = useState<number>(0);
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);

  const [isSuddenDeath, setIsSuddenDeath] = useState<boolean>(false);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [shopOpen, setShopOpen] = useState<boolean>(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [activeRoundRecord, setActiveRoundRecord] = useState<RoundRecord | null>(null);
  const [lastRoundCredits, setLastRoundCredits] = useState<number>(0);

  // Meta-progression
  const { meta, awardRound, purchase, isOwned, setMeta } = useMetaProgression();

  // Shop
  const handlePurchase = useCallback((category: keyof Unlocks, itemId: string, cost: number): boolean => {
    return purchase(category, itemId, cost);
  }, [purchase]);

  // Initialize or reset a match
  const handleStartGame = (newConfig: MatchConfig) => {
    setConfig(newConfig);
    setCurrentRound(0);
    setHistory([]);
    setP1Score(0);
    setP2Score(0);
    setIsSuddenDeath(false);
    setActiveRoundRecord(null);
    setPhase('round_intro');
  };

  // Modified round completion to incorporate credit awarding
  const handleRoundComplete = (turns: number, suddenDeathWinnerRole?: PlayerRole, roundMeta?: RoundMeta) => {
    // Update game scores bounds
    const p1IsHider = currentRound % 2 === 0;

    // Award credit points
    if (roundMeta) {
      // Determine Hider is the player who earned the turns
      if (p1IsHider) {
        setP1Score(prev => {
          const newScore = prev + turns;
          return newScore;
        });
      } else {
        setP2Score(prev => prev + turns);
      }

      // Persist round record to history
      const hiderName = p1IsHider ? config.p1Name : config.p2Name;
      const seekerName = p1IsHider ? config.p2Name : config.p1Name;
      const newRecord: RoundRecord = {
        roundIndex: currentRound,
        p1Role: p1IsHider ? 'hider' : 'seeker',
        p2Role: p1IsHider ? 'seeker' : 'hider',
        turnsSurvived: turns,
        roundWinner: hiderName,
        hiderName,
        seekerName,
      };
      setHistory(prev => [...prev, newRecord]);
      setActiveRoundRecord(newRecord);

      // Award meta-progression credits and update leaderboard
      const creditEarned = awardRound(roundMeta, p1IsHider ? config.p1Name : config.p2Name, true);
      setLastRoundCredits(creditEarned);
      // Note: If it's sudden death, the winner might be seeker, but the Hider still earned turns, so treat them as Hider for meta.
      // If Seeker got a quick tag, that's already tracked in roundMeta.tagTurn.

      setMeta(prev => ({ ...prev })); // force refresh if needed
      setPhase('round_over');
      return;
    }

    // Fallback if no roundMeta (shouldn't happen)
    setPhase('round_over');
  };

  const handleNextRound = () => {
    if (phase === 'round_intro' || phase === 'sudden_death_intro') {
      setPhase('playing');
    } else if (phase === 'round_over') {
      const nextRnd = currentRound + 1;
      if (nextRnd >= config.bestOfRounds) {
        if (p1Score === p2Score) {
          setIsSuddenDeath(true);
          setPhase('sudden_death_intro');
        } else {
          setPhase('match_over');
        }
      } else {
        setCurrentRound(nextRnd);
        setPhase('round_intro');
      }
    }
  };

  const handleRestartGame = () => {
    handleStartGame(config);
  };

  const handleReturnToMenu = () => {
    setPhase('menu');
  };

  const p1IsHider = currentRound % 2 === 0;
  const currentHider = {
    name: p1IsHider ? config.p1Name : config.p2Name,
    isP1: p1IsHider,
  };
  const currentSeeker = {
    name: p1IsHider ? config.p2Name : config.p1Name,
    isP1: !p1IsHider,
  };

  // Get active unlock selections for balls (both players share the same unlocked skin)
  const activeSkin = Object.keys(meta.unlocks.ballSkins).find(k => k !== 'default' && meta.unlocks.ballSkins[k]) || 'default';

  return (
    <div className="min-h-screen bg-[#020502] text-neutral-200 font-sans antialiased overflow-x-hidden selection:bg-emerald-500/30 selection:text-white">
      {/* 1. Main configuration terminal */}
      {phase === 'menu' && (
        <MainMenu 
          onStartGame={handleStartGame} 
          onOpenHelp={() => setHelpOpen(true)} 
          onOpenShop={() => setShopOpen(true)}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />
      )}

      {/* 2. Active playing canvas screens */}
      {(phase === 'playing' || phase === 'round_over' || phase === 'round_intro' || phase === 'sudden_death_intro' || phase === 'match_over') && (
        <div className="w-full h-screen flex flex-col justify-between">
          <GameCanvas
            phase={phase}
            config={config}
            currentRound={currentRound}
            isSuddenDeath={isSuddenDeath}
            onRoundComplete={handleRoundComplete}
            onOpenHelp={() => setHelpOpen(true)}
            onExitGame={handleReturnToMenu}
            unlocks={meta.unlocks}
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
            creditsEarned={phase === 'round_over' ? lastRoundCredits : undefined}
            totalTurnsSurvived={meta.totalTurnsSurvived}
            averageSurvival={meta.totalRoundsPlayed > 0 ? Math.round(meta.totalTurnsSurvived / meta.totalRoundsPlayed) : 0}
            totalPowerUpsCollected={meta.totalPowerUpsCollected}
          />
        </div>
      )}

      {/* 3. Global overlay modals */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <ShopModal
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        credits={meta.credits}
        unlocks={meta.unlocks}
        onPurchase={handlePurchase}
      />
      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        entries={meta.leaderboard}
      />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        meta={meta}
      />
    </div>
  );
}
