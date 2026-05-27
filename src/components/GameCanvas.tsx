import React, { useRef, useEffect, useState } from 'react';
import {
  PlayerRole,
  GamePhase,
  MatchConfig,
  PlayerBall,
  NeonBumper,
  HazardPatch,
  PowerUpOrb,
  Particle,
  SonarPing,
  PowerUpType,
  RoundRecord,
  RoundMeta
} from '../types';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  SD_MAP_WIDTH,
  SD_MAP_HEIGHT,
  HIDER_RADIUS,
  SEEKER_RADIUS,
  SUBSTEPS,
  FRICTION_BASE,
  FRICTION_SEEKER,
  FRICTION_SLOWMO,
  FRICTION_SAND_MULT,
  FRICTION_ICE,
  STOP_THRESHOLD,
  DELTA_CAP,
  BOUNCE_REST_NORMAL,
  BOUNCE_REST_SLOWMO,
  BOUNCE_REST_SUPERBALL,
  BUMPER_REST,
  BUMPER_REST_SUPERBALL,
  BUMPER_BOOST_NORMAL,
  BUMPER_BOOST_SUPERBALL,
  BUMPER_MIN_SPEED,
  BUMPER_KICK_SPEED,
  MAX_DRAG,
  MIN_DRAG_DIST,
  TOUCH_TARGET_PAD,
  LAUNCH_SPARKS,
  SONAR_INTERVAL,
  SONAR_SPEED,
  SONAR_MAX_RADIUS,
  SONAR_START_RADIUS,
  FOG_RADIUS,
  BUMPER_COUNT_NORMAL,
  BUMPER_COUNT_SD,
  BUMPER_MIN_RADIUS,
  BUMPER_RADIUS_VAR,
  BUMPER_SPAWN_CLEAR,
  BUMPER_MIN_SEP,
  BUMPER_PULSE_DURATION,
  BUMPER_PARTICLES,
  SAND_COUNT,
  ICE_COUNT,
  SAND_MIN_RADIUS,
  SAND_RADIUS_VAR,
  ICE_MIN_RADIUS,
  ICE_RADIUS_VAR,
  HAZARD_SPAWN_CLEAR,
  HAZARD_MIN_SEP,
  HAZARD_BUMPER_CLEAR,
  ORB_RADIUS,
  ORB_SPAWN_RANGE,
  ORB_PULSE_SPEED,
  ORB_PULSE_AMP,
  ORB_RESPAWN_TIME,
  ORB_COLLECT_PARTICLES,
  TAG_SPARKS,
  TAG_DEBRIS,
  TAG_GLASS,
  TAG_SHOCKWAVE_MAX_R,
  TAG_SHOCKWAVE_SPEED,
  TAG_RECOIL_HIDER,
  TAG_RECOIL_SEEKER,
  TAG_FREEZE_TIME,
  PARTICLE_MAX,
  PARTICLE_BOUNCE_REST,
  PARTICLE_GRAVITY,
  TRAIL_MAX_POINTS,
  TRAIL_MIN_SPEED,
  CAM_LERP_POS,
  CAM_LERP_ZOOM,
  CAM_ZOOM_REST_CLOSE,
  CAM_ZOOM_REST_FAR,
  CAM_ZOOM_MOVING,
  CAM_ZOOM_MIN,
  CAM_ZOOM_MAX,
  CAM_ZOOM_SUDDEN_DEATH,
  CAM_SD_X,
  CAM_SD_Y,
  PROXIMITY_ZOOM_THRESHOLD,
  PROXIMITY_ZOOM_BOOST,
  SHAKE_DECAY,
  SHAKE_TAG_AMOUNT,
  SHAKE_BUMPER_ADD,
  SHAKE_MAX,
  SLOWMO_TAG_SPEED,
  SLOWMO_RECOVERY,
  HIDER_BASE_SPEED,
  SEEKER_SPEED_MULT,
  ROCKET_SPEED_MULT,
  EMP_FREEZE_MS,
  EMP_FREEZE_FRAMES,
  VAMPIRE_BONUS,
  ORBIT_SPEED,
  ORBIT_RADIUS,
  AI_EASY_ERROR,
  AI_THINK_DELAY,
  FLOAT_MESSAGE_DURATION,
} from '../constants';
import {
  Zap,
  Target,
  Flame,
  Eye,
  Compass,
  VolumeX,
  HelpCircle,
  Swords,
  Trophy,
  Grid3X3,
  Dribbble,
  Cpu,
} from 'lucide-react';
import {
  updateParticles,
  updateShockwave,
  drawParticles,
  spawnTagParticles,
  spawnBumperParticles,
  spawnOrbParticles,
  spawnLaunchParticles,
} from '../game/particles';
import {
  updateCamera,
  applyCameraTransform,
  restoreCameraTransform,
  Camera,
} from '../game/camera';
import {
  updateSonarPings,
  maybeSpawnSonarPing,
  drawSonarPings,
} from '../game/sonar';
import { screenToMap, calculateLaunch } from '../game/input';
import { updateTrail, drawTrail, HIDER_TRAIL_COLOR, SEEKER_TRAIL_COLOR } from '../game/trails';
import { drawFogOfWar } from '../game/fog';
import { generateMap as generateMapModule } from '../game/map';
import { drawMinimap, getDefaultConfig } from '../game/minimap';
import { updateOrbPulse, drawOrb } from '../game/powerups';
import { drawHazards, drawBumpers, drawShockwave, drawHiderBall, drawSeekerBall } from '../game/renderer';
import { physicsStep } from '../game/physics';
import {
  playLaunch,
  playBumperHit,
  playNearMiss,
  playTag,
  playOrbCollect,
  playTurnIncrement,
  playTurnStart,
  playPowerUpActivate,
  playUIClick,
  startDrone,
  updateDrone,
  stopDrone,
  initAudio,
} from '../game/sounds';
import * as haptics from '../game/haptics';
import {
  startAIAiming,
  isAIReadyToFire,
  getAIFiringVector,
  resetAIAiming,
  AimingState,
} from '../game/ai';

import {
  calculateRoundScore,
  RoundScoreResult,
} from '../game/scoring';

interface GameCanvasProps {
  phase: GamePhase;
  config: MatchConfig;
  currentRound: number;
  isSuddenDeath: boolean;
  onRoundComplete: (data: RoundScoreResult & { suddenDeathWinnerRole?: PlayerRole }) => void;
  onOpenHelp: () => void;
  onExitGame: () => void;
}

export function GameCanvas({
  phase,
  config,
  currentRound,
  isSuddenDeath,
  onRoundComplete,
  onOpenHelp,
  onExitGame,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Round meta tracking (for scoring combos + future features)
  const roundMetaRef = useRef<RoundMeta>({
    turnsSurvived: 0,
    powerUpCollector: null,
    bumperHits: 0,
    tagTurn: 0,
  });
  const currentTurnNumberRef = useRef<number>(0); // which turn we're on (for quick tag detection)
  const totalDistanceRef = useRef<number>(0);       // accumulated distance for avg
  const distanceSamplesRef = useRef<number>(0);     // number of distance samples
  const minDistanceRef = useRef<number>(Infinity);  // closest approach this seeker turn
  const comboCountRef = useRef<number>(0);          // consecutive bumper hits
  const nearMissTriggeredRef = useRef<boolean>(false);
  const tagFrozenRef = useRef<boolean>(false); // true during slow-mo tag freeze — stop scoring

  // Game state parameters
  const [activeRole, setActiveRole] = useState<PlayerRole>('hider');
  const [turnsSurvived, setTurnsSurvived] = useState<number>(0);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpDuration, setPowerUpDuration] = useState<number>(0); // turns remaining (decrements on seeker→hider swap)
  
  // Floating status message
  const [floatMessage, setFloatMessage] = useState<string | null>(null);
  const [floatTimer, setFloatTimer] = useState<number>(0);

  // Scoring message queue — shows live point events during play
  const [scoreMessages, setScoreMessages] = useState<Array<{id: number; text: string; type: string}>>([]);
  const msgIdCounter = useRef(0);
  const showScoreMessage = (text: string, type: string) => {
    const id = msgIdCounter.current++;
    setScoreMessages(prev => [...prev, {id, text, type}]);
  };

  // Determine who plays which role in the current round
  // Player 1 is Hider on even-indexed rounds (0, 2, ...), Seeker on odd-indexed rounds
  const p1IsHider = currentRound % 2 === 0;
  const hiderName = p1IsHider ? config.p1Name : config.p2Name;
  const seekerName = p1IsHider ? config.p2Name : config.p1Name;

  // Map limits
  const mapWidth = isSuddenDeath ? SD_MAP_WIDTH : MAP_WIDTH;
  const mapHeight = isSuddenDeath ? SD_MAP_HEIGHT : MAP_HEIGHT;

  // Core physics references to prevent React re-renders of high-frequency coordinates
  const hiderBallRef = useRef<PlayerBall>({
    x: 400,
    y: 750,
    vx: 0,
    vy: 0,
    radius: HIDER_RADIUS,
    role: 'hider',
    name: hiderName,
  });

  const seekerBallRef = useRef<PlayerBall>({
    x: 1600,
    y: 750,
    vx: 0,
    vy: 0,
    radius: SEEKER_RADIUS, // Seeker is slightly larger and heavier
    role: 'seeker',
    name: seekerName,
  });

  // Entities
  const bumpersRef = useRef<NeonBumper[]>([]);
  const hazardsRef = useRef<HazardPatch[]>([]);
  const orbsRef = useRef<PowerUpOrb[]>([]);

  // FX systems
  const particlesRef = useRef<Particle[]>([]);
  const sonarPingsRef = useRef<SonarPing[]>([]);
  const lastPingTimeRef = useRef<number>(0);

  // Slingshot variables
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Camera variables with LERP tracking
  const cameraRef = useRef<Camera>({
    x: 1000,
    y: 750,
    zoom: 0.8,
  });

  // Dynamic visual FX and slow-motion tracking refs
  const hiderTrailRef = useRef<{ x: number; y: number }[]>([]);
  const seekerTrailRef = useRef<{ x: number; y: number }[]>([]);
  const shakeAmtRef = useRef<number>(0);
  const slowMotionRef = useRef<number>(1.0);
  const activeShockwaveRef = useRef<{ x: number; y: number; r: number; maxR: number; active: boolean } | null>(null);
  const hiderExplodedRef = useRef<boolean>(false);
  const tagFlashRef = useRef<{x: number; y: number; alpha: number} | null>(null);

  // Freeze timer for EMP power-up (frames)
  const hiderFrozenRef = useRef(0);
  // Vampire: flag when active to add point steal on tag
  const vampireActiveRef = useRef(false);

  // Controls lock during active flings
  const [ballsMoving, setBallsMoving] = useState<boolean>(false);

  // AI opponent state
  const aiStateRef = useRef<AimingState>(resetAIAiming());
  const cpuFiredThisTurnRef = useRef<boolean>(false);
  const cpuHiderFiredThisTurnRef = useRef<boolean>(false);
  const roundStartTimeRef = useRef<number>(0);

  // Run procedural map generator when a round shifts
  const generateMap = () => {
    const map = generateMapModule(isSuddenDeath, hiderName, seekerName);
    hiderBallRef.current = map.hider;
    seekerBallRef.current = map.seeker;
    bumpersRef.current = map.bumpers;
    hazardsRef.current = map.hazards;
    orbsRef.current = map.orbs;

    // Reset systems
    particlesRef.current = [];
    sonarPingsRef.current = [];
    hiderTrailRef.current = [];
    seekerTrailRef.current = [];
    shakeAmtRef.current = 0;
    slowMotionRef.current = 1.0;
    activeShockwaveRef.current = null;
    hiderExplodedRef.current = false;
    tagFlashRef.current = null;
    setActiveRole('hider');
    setTurnsSurvived(0);
    setActivePowerUp(null);
    setBallsMoving(false);

    // Reset round-specific tracking for scoring
    roundMetaRef.current = {
      turnsSurvived: 0,
      powerUpCollector: null,
      bumperHits: 0,
      tagTurn: 0,
    };
    comboCountRef.current = 0;
    nearMissTriggeredRef.current = false;
    minDistanceRef.current = Infinity;
    totalDistanceRef.current = 0;
    distanceSamplesRef.current = 0;
    tagFrozenRef.current = false;

    // Reset AI state for new round
    aiStateRef.current = resetAIAiming();
    cpuFiredThisTurnRef.current = false;
    cpuHiderFiredThisTurnRef.current = false;
    roundStartTimeRef.current = performance.now();
  };

  // Build the map on mount & phase variations
  useEffect(() => {
    if (phase === 'playing') {
      generateMap();
    }
  }, [currentRound, phase, isSuddenDeath]);

  // Handle float text notification animation
  useEffect(() => {
    if (floatMessage) {
      const tid = setTimeout(() => {
        setFloatMessage(null);
      }, FLOAT_MESSAGE_DURATION);
      return () => clearTimeout(tid);
    }
  }, [floatMessage]);

  // Auto-dismiss scoring messages after 1.5s
  useEffect(() => {
    if (scoreMessages.length === 0) return;
    const id = scoreMessages[0].id;
    const tid = setTimeout(() => {
      setScoreMessages(prev => prev.filter(m => m.id !== id));
    }, 1500);
    return () => clearTimeout(tid);
  }, [scoreMessages]);

  // Core Game Loop
  useEffect(() => {
    // Initialize error buffer so it's always queryable (even when no errors)
    (window as any).__gameLoopErrors = [];

    if (phase !== 'playing') return;
    startDrone();

    let animFrame: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = Math.min(DELTA_CAP, time - lastTime);
      lastTime = time;

      // Update positions & physics with substepping
      physicsStepLocal(time);

      // Proximity drone update based on distance
      const hdr = hiderBallRef.current;
      const skr = seekerBallRef.current;
      if (hdr && skr) {
        const dist = Math.hypot(hdr.x - skr.x, hdr.y - skr.y);
        const norm = 1 - Math.min(1, dist / 1500);
        updateDrone(norm);
      }

      // Decay tag flash
      if (tagFlashRef.current) {
        tagFlashRef.current.alpha -= 0.03; // fade over ~30 frames (0.5s)
        if (tagFlashRef.current.alpha <= 0) {
          tagFlashRef.current = null;
        }
      }

// Draw everything
        draw(time);

      animFrame = requestAnimationFrame(loop);
    };

    // Sub-stepping engine for exact physical calculations (5 steps per frame)
    const physicsStepLocal = (_time: number) => {
      physicsStep(
        {
          hider: hiderBallRef.current,
          seeker: seekerBallRef.current,
          bumpers: bumpersRef.current,
          hazards: hazardsRef.current,
          orbs: orbsRef.current,
          slowMotionRef,
          activePowerUp,
          shakeAmtRef,
          particlesRef,
          mapWidth,
          mapHeight,
          hiderFrozenRef,
        },
        {
          onTag: triggerTagEvent,
          onOrbCollect: (orbType: PowerUpType) => {
            setActivePowerUp(orbType);
            setPowerUpDuration(2); // lasts through next full turn
            const titles: Record<PowerUpType, string> = {
              iron: 'IRON BALL',
              rocket: 'ROCKET BURST',
              gravity: 'GRAVITY WELL',
              vampire: 'VAMPIRE',
              superball: 'SUPERBALL',
              emp: 'EMP',
            };
            setFloatMessage(`Power-up: ${titles[orbType]}`);
            playOrbCollect();
            // Immediate activation sounds for passive power-ups (gravity, iron, superball)
            if (orbType === 'gravity' || orbType === 'iron' || orbType === 'superball') {
              playPowerUpActivate(orbType);
            }
            haptics.buzz();
            roundMetaRef.current.powerUpCollector = activeRole;
          },
          onBumperHit: () => {
            if (tagFrozenRef.current) return;
            playBumperHit();
            haptics.tap();
            comboCountRef.current++;
            // Track total bumper hits for end-of-round scoring
            // EMP freeze if active
            if (activePowerUp === 'emp') {
              hiderFrozenRef.current = EMP_FREEZE_FRAMES;
              setActivePowerUp(null);
              setFloatMessage('EMP FREEZE!');
              playPowerUpActivate('emp');
            }
            roundMetaRef.current.bumperHits++;
            const count = comboCountRef.current;
            if (count <= 1) {
              showScoreMessage('+1 BUMPER', 'combo');
            } else {
              showScoreMessage(`x${count} COMBO`, 'combo');
            }
          },
        },
      );

      // Check if balls have come to rest
      const hSpeed = Math.hypot(hiderBallRef.current.vx, hiderBallRef.current.vy);
      const sSpeed = Math.hypot(seekerBallRef.current.vx, seekerBallRef.current.vy);
      const isMoving = hSpeed > 0 || sSpeed > 0;

      if (isMoving && !ballsMoving) {
        setBallsMoving(true);
      }

      // Detect state transition from motion to resting
      if (!isMoving && ballsMoving) {
        setBallsMoving(false);
        // Reset combo counter — combos are per-flight
        comboCountRef.current = 0;
        // Clean turn swaps
        toggleTurnFlow();
        playTurnStart();
      }

      // --- AI opponent logic (CPU controls Seeker when P1=Hider) ---
      if (
        config.isCpu &&
        p1IsHider &&
        activeRole === 'seeker' &&
        !isMoving &&
        !ballsMoving &&
        !cpuFiredThisTurnRef.current
      ) {
        // Start AI aiming if not already started
        if (!aiStateRef.current.active) {
          aiStateRef.current = startAIAiming(
            hiderBallRef.current,
            seekerBallRef.current,
            config.difficulty || 'medium',
          );
        }
        // Check if AI is ready to fire
        if (isAIReadyToFire(aiStateRef.current, performance.now())) {
          const launch = getAIFiringVector(aiStateRef.current);
          seekerBallRef.current.vx = launch.vx;
          seekerBallRef.current.vy = launch.vy;
          cpuFiredThisTurnRef.current = true;

          // Launch sparks particles
          particlesRef.current.push(
            ...spawnLaunchParticles(
              seekerBallRef.current.x,
              seekerBallRef.current.y,
              seekerBallRef.current.vx,
              seekerBallRef.current.vy,
              true, // isSeeker
            ),
          );

          // Reset AI state for next turn
          aiStateRef.current = resetAIAiming();
        }
      }

      // --- CPU auto-fires as Hider (when P2=CPU controls Hider on odd rounds) ---
      if (
        config.isCpu &&
        !p1IsHider &&
        activeRole === 'hider' &&
        !isMoving &&
        !ballsMoving &&
        !cpuHiderFiredThisTurnRef.current
      ) {
        // Launch Hider in a random-ish direction at 60% power
        const angle = (Math.random() - 0.5) * Math.PI; // random upward direction
        const power = HIDER_BASE_SPEED * 0.6;
        hiderBallRef.current.vx = Math.cos(angle) * power;
        hiderBallRef.current.vy = Math.sin(angle) * power;
        cpuHiderFiredThisTurnRef.current = true;
        particlesRef.current.push(
          ...spawnLaunchParticles(
            hiderBallRef.current.x,
            hiderBallRef.current.y,
            hiderBallRef.current.vx,
            hiderBallRef.current.vy,
            false,
          ),
        );
      }

      // --- Near miss detection (Seeker came close during flight) ---
      if (isMoving && activeRole === 'seeker' && !nearMissTriggeredRef.current) {
        const seekDist = Math.hypot(seekerBallRef.current.x - hiderBallRef.current.x, seekerBallRef.current.y - hiderBallRef.current.y);
        // Track minimum distance this turn for end-of-round bonus
        if (seekDist < minDistanceRef.current) {
          minDistanceRef.current = seekDist;
        }
        if (seekDist < 100) {
          nearMissTriggeredRef.current = true;
          playNearMiss();
          haptics.buzz();
          showScoreMessage('NEAR MISS!', 'nearMiss');
        }
      }

      // Update Particle debris FX
      updateParticles(particlesRef.current, slowMotionRef.current, mapWidth, mapHeight);

      // Update sonar pings
      updateSonarPings(sonarPingsRef.current);
      lastPingTimeRef.current = maybeSpawnSonarPing(
        sonarPingsRef.current,
        lastPingTimeRef.current,
        performance.now(),
        hiderBallRef.current.x, hiderBallRef.current.y,
        seekerBallRef.current.x, seekerBallRef.current.y,
        activeRole,
        isSuddenDeath,
      );

      // Update bumper pulse glows
      for (const b of bumpersRef.current) {
        if (b.pulseTimer > 0) b.pulseTimer--;
      }

      // Update orb pulse
      for (const orb of orbsRef.current) {
        updateOrbPulse(orb, _time);
      }

      // --- Accumulate ball trails ---
      updateTrail(hiderTrailRef.current, hiderBallRef.current.x, hiderBallRef.current.y, hiderBallRef.current.vx, hiderBallRef.current.vy);
      updateTrail(seekerTrailRef.current, seekerBallRef.current.x, seekerBallRef.current.y, seekerBallRef.current.vx, seekerBallRef.current.vy);

      // --- Propagate post-tag shockwave ripple ---
      updateShockwave(activeShockwaveRef.current);

      // --- Decelerate camera screen-shake vibration ---
      if (shakeAmtRef.current > 0.05) {
        shakeAmtRef.current *= SHAKE_DECAY;
      } else {
        shakeAmtRef.current = 0;
      }

      // --- Recover slow-motion timeline dampening back to normal ---
      if (slowMotionRef.current < 1.0) {
        slowMotionRef.current += SLOWMO_RECOVERY;
        if (slowMotionRef.current > 1.0) slowMotionRef.current = 1.0;
      }
    };

    // Trigger turn toggle sequence
    const toggleTurnFlow = () => {
      if (activeRole === 'hider') {
        // Hider completed fling!
        // Swap turn to seeker
        setActiveRole('seeker');
        // Earn survival point
        setTurnsSurvived(prev => prev + 1);
        roundMetaRef.current.turnsSurvived++;
        currentTurnNumberRef.current = roundMetaRef.current.turnsSurvived;
        playTurnIncrement();
        showScoreMessage('+1 TURN SURVIVED', 'turn');
        // Reset CPU fired flag so AI can fire on its turn
        cpuFiredThisTurnRef.current = false;
      } else {
        // Seeker flings and misses!
        // Swap back to Hider
        setActiveRole('hider');
        cpuHiderFiredThisTurnRef.current = false;
        roundStartTimeRef.current = performance.now();

        // Check if Seeker consumed their active single-use powerup
        if (activePowerUp) {
          setPowerUpDuration(prev => {
            const next = prev - 1;
            if (next <= 0) {
              setActivePowerUp(null);
              setFloatMessage('PERK EXPIRED');
            }
            return next;
          });
        }
      }
    };

    // Play high impact tag animation
    const triggerTagEvent = () => {
      const h = hiderBallRef.current;
      const s = seekerBallRef.current;

      // Record tag turn for quick-tag bonus
      roundMetaRef.current.tagTurn = currentTurnNumberRef.current;
      tagFrozenRef.current = true; // freeze scoring — no more combos during slow-mo
      // Vampire: steal an extra point on tag
      if (activePowerUp === 'vampire') {
        vampireActiveRef.current = true;
        setActivePowerUp(null);
        setFloatMessage('VAMPIRE STEAL!');
        playPowerUpActivate('vampire');
      }
      showScoreMessage('TAG! +5', 'tag');
      playTag();
      haptics.strong();

      // Set hiderExploded to true so the solid ball core shatters out of sight
      hiderExplodedRef.current = true;

      // Tag confirmed! Apply intense screen shake and engage dramatic slow-motion
      shakeAmtRef.current = SHAKE_TAG_AMOUNT;
      slowMotionRef.current = SLOWMO_TAG_SPEED;

      const centerTagX = (h.x + s.x) / 2;
      const centerTagY = (h.y + s.y) / 2;

      // Initiate golden expanding shockwave
      activeShockwaveRef.current = {
        x: centerTagX,
        y: centerTagY,
        r: 15,
        maxR: TAG_SHOCKWAVE_MAX_R,
        active: true,
      };

      // Tag flash burst
      tagFlashRef.current = { x: centerTagX, y: centerTagY, alpha: 1.0 };

      particlesRef.current = spawnTagParticles(h.x, h.y, s.x, s.y);

      // Force extreme Rocket League slow-mo recoil physics: blast player balls outwards!
      const recoilAngle = Math.atan2(h.y - s.y, h.x - s.x);
      
      // Highly boosted recoil speeds so they glide super far and bounce off walls in slow motion
      h.vx = Math.cos(recoilAngle) * TAG_RECOIL_HIDER;
      h.vy = Math.sin(recoilAngle) * TAG_RECOIL_HIDER;
      s.vx = -Math.cos(recoilAngle) * TAG_RECOIL_SEEKER;
      s.vy = -Math.sin(recoilAngle) * TAG_RECOIL_SEEKER;

      // Conclude round in 1.45 seconds to showcase the slow-mo kinetic bounces and shockwave
      setTimeout(() => {
        // Halt velocity forces when transitioning
        h.vx = 0; h.vy = 0;
        s.vx = 0; s.vy = 0;

        // Getting tagged means no near-miss bonus
        nearMissTriggeredRef.current = false;

        // Calculate final scores from tracked stats
         const scoreResult = calculateRoundScore(
           roundMetaRef.current,
           nearMissTriggeredRef.current,
           minDistanceRef.current,
           comboCountRef.current,
           p1IsHider,
         );
         // Vampire bonus: add 1 point to seeker's score
         if (vampireActiveRef.current) {
           if (p1IsHider) {
             scoreResult.seekerScore += VAMPIRE_BONUS;
           } else {
             scoreResult.hiderScore += VAMPIRE_BONUS;
           }
         }
 
         if (isSuddenDeath) {
          onRoundComplete({ ...scoreResult, suddenDeathWinnerRole: 'seeker' });
        } else {
          onRoundComplete(scoreResult);
        }
      }, TAG_FREEZE_TIME);
    };

    // Wrap game loop in error catcher for debug visibility
    const wrappedLoop = (time: number) => {
      try {
        loop(time);
      } catch (e) {
        const errs = ((window as any).__gameLoopErrors ??= []);
        errs.push({
          message: e instanceof Error ? e.message : String(e),
          stack: e instanceof Error ? e.stack : undefined,
          time: performance.now(),
        });
        // Keep loop alive despite error — next frame might recover
        animFrame = requestAnimationFrame(wrappedLoop);
      }
    };

    animFrame = requestAnimationFrame(wrappedLoop);
    return () => {
      stopDrone();
      cancelAnimationFrame(animFrame);
    };
  }, [phase, activeRole, ballsMoving, activePowerUp, isSuddenDeath]);

  // Handle active aiming line projections + reflect wall trajectories
  const getAimPoints = () => {
    if (!isDraggingRef.current) return [];
    
    const activeBall = activeRole === 'hider' ? hiderBallRef.current : seekerBallRef.current;
    const dragX = dragCurrentRef.current.x;
    const dragY = dragCurrentRef.current.y;

    const dx = activeBall.x - dragX;
    const dy = activeBall.y - dragY;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return [];

    const baseMaxDrag = MAX_DRAG;
    const dragPower = Math.min(1.0, dist / baseMaxDrag);
    
    // Scale vectors linearly according to slingshot power
    const vMax = activeRole === 'seeker' ? HIDER_BASE_SPEED * SEEKER_SPEED_MULT : HIDER_BASE_SPEED;
    const launchSpeed = vMax * dragPower;
    
    const vx = (dx / dist) * launchSpeed;
    const vy = (dy / dist) * launchSpeed;

    const points: { x: number; y: number }[] = [{ x: activeBall.x, y: activeBall.y }];
    
    // Calculate laser sight projection with reflections if active
    const beamLength = 180;
    let cx = activeBall.x;
    let cy = activeBall.y;
    let cvx = vx;
    let cvy = vy;

    // Normalizing
    const launchHypot = Math.hypot(cvx, cvy);
    if (launchHypot === 0) return [];
    const dirX = cvx / launchHypot;
    const dirY = cvy / launchHypot;

    // Fast segment walk to detect reflections
    let steps = beamLength / 10;
    let testX = cx;
    let testY = cy;

    for (let i = 0; i < steps; i++) {
      testX += dirX * 10;
      testY += dirY * 10;

      // Check border bounces
      let bounced = false;
      let nx = 0, ny = 0;

      if (testX < 15) { testX = 15; nx = 1; bounced = true; }
      else if (testX > mapWidth - 15) { testX = mapWidth - 15; nx = -1; bounced = true; }

      if (testY < 15) { testY = 15; ny = 1; bounced = true; }
      else if (testY > mapHeight - 15) { testY = mapHeight - 15; ny = -1; bounced = true; }

      // Also support drawing bumper prediction markers!
      for (const b of bumpersRef.current) {
        const d = Math.hypot(testX - b.x, testY - b.y);
        if (d < b.radius + activeBall.radius) {
          bounced = true;
          nx = (testX - b.x) / d;
          ny = (testY - b.y) / d;
          testX = b.x + nx * (b.radius + activeBall.radius + 2);
          break;
        }
      }

      if (bounced) {
        points.push({ x: testX, y: testY });
        // Reflection ray directional shift!
        break; // Show first bounce node for laser clarity
      }
    }

    // Add trailing pointer
    points.push({ x: testX, y: testY });
    return points;
  };

  // Main Draw function to render Canvas elements
  const draw = (now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const hider = hiderBallRef.current;
    const seeker = seekerBallRef.current;
    const bumpers = bumpersRef.current;
    const hazards = hazardsRef.current;
    const orbs = orbsRef.current;
    const particles = particlesRef.current;
    const pings = sonarPingsRef.current;

    // Clean viewport background
    ctx.fillStyle = '#020502'; // Pure pitch black
    ctx.fillRect(0, 0, w, h);

    // --- Dynamic Lead Camera Math ---
    // Target coordinate tracks movement or turns
    let targetCamX = 1000;
    let targetCamY = 750;
    let targetZoom = 0.8;

    const hMoving = Math.hypot(hider.vx, hider.vy) > 0.05;
    const sMoving = Math.hypot(seeker.vx, seeker.vy) > 0.05;
    const dBetween = Math.hypot(hider.x - seeker.x, hider.y - seeker.y);

    if (hMoving && sMoving) {
      targetCamX = (hider.x + seeker.x) / 2;
      targetCamY = (hider.y + seeker.y) / 2;
      const normalZoom = Math.max(CAM_ZOOM_MIN, Math.min(CAM_ZOOM_MAX, (window.innerWidth - 100) / (dBetween + 200)));
      
      // Proximity Tension Zoom: Magnifies significantly as Seeker narrows down onto Hider
      if (dBetween < PROXIMITY_ZOOM_THRESHOLD) {
        const proximityRatio = Math.max(0, (PROXIMITY_ZOOM_THRESHOLD - dBetween) / PROXIMITY_ZOOM_THRESHOLD);
        // Elevate zoom dramatically peaking up to 1.95x when on top of each other!
        targetZoom = normalZoom + proximityRatio * PROXIMITY_ZOOM_BOOST;
      } else {
        targetZoom = normalZoom;
      }
    } else if (hMoving) {
      targetCamX = hider.x;
      targetCamY = hider.y;
      targetZoom = CAM_ZOOM_MOVING;
    } else if (sMoving) {
      targetCamX = seeker.x;
      targetCamY = seeker.y;
      targetZoom = CAM_ZOOM_MOVING;
    } else {
      // Resting turn layout: Zoom in heavily if they are close, otherwise normal focus
      const activeObj = activeRole === 'hider' ? hider : seeker;
      targetCamX = activeObj.x;
      targetCamY = activeObj.y;
      
      if (dBetween < 260) {
        targetZoom = CAM_ZOOM_REST_CLOSE;
      } else {
        targetZoom = CAM_ZOOM_REST_FAR;
      }
    }

    // Sudden death camera override
    if (isSuddenDeath) {
      targetCamX = CAM_SD_X;
      targetCamY = CAM_SD_Y;
      targetZoom = CAM_ZOOM_SUDDEN_DEATH;
    }

    // Apply camera LERP
    updateCamera(cameraRef.current, targetCamX, targetCamY, targetZoom);
    const cam = cameraRef.current;

    // Calculate screen shake offsets
    let shakeX = 0;
    let shakeY = 0;
    if (shakeAmtRef.current > 0.1) {
      shakeX = (Math.random() - 0.5) * shakeAmtRef.current;
      shakeY = (Math.random() - 0.5) * shakeAmtRef.current;
    }

    // Apply viewport transform with shake
    applyCameraTransform(ctx, cam, shakeX, shakeY, w, h);

    // --- DRAW MAP INNER FLOOR ---
    ctx.fillStyle = '#080a0f'; // Luxurious cinematic deep charcoal slate space floor
    ctx.fillRect(0, 0, mapWidth, mapHeight);

    // Draw Grid vector lines for high tech feel
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.065)'; // Soft grid gold
    ctx.lineWidth = 1;

    const gSize = 100;
    for (let x = 0; x <= mapWidth; x += gSize) {
       ctx.beginPath();
       ctx.moveTo(x, 0);
       ctx.lineTo(x, mapHeight);
       ctx.stroke();
    }
    for (let y = 0; y <= mapHeight; y += gSize) {
       ctx.beginPath();
       ctx.moveTo(0, y);
       ctx.lineTo(mapWidth, y);
       ctx.stroke();
    }

    // Draw Map Outer Border Walls
    ctx.strokeStyle = '#d97706'; // Rich Sand Gold
    ctx.lineWidth = 12;
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(217, 119, 6, 0.35)';
    ctx.strokeRect(0, 0, mapWidth, mapHeight);
    ctx.shadowBlur = 0; // reset

    // --- DRAW TERRAIN HAZARDS ---
    drawHazards(ctx, hazards);

    // --- DRAW POWER-UP ORBS ---
    for (const orb of orbs) {
      drawOrb(ctx, orb, isSuddenDeath, now);
    }

    // --- DRAW SONAR PINGS ---
    drawSonarPings(ctx, pings);

    // --- DRAW NEON STATIC BUMPERS ---
    drawBumpers(ctx, bumpers);

    // --- DRAW SHOCKWAVE ---
    drawShockwave(ctx, activeShockwaveRef.current);

    // --- TAG FLASH BURST ---
    const flash = tagFlashRef.current;
    if (flash && flash.alpha > 0.01) {
      const flashR = 20 + (1 - flash.alpha) * 60;
      ctx.save();
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flashR, 0, Math.PI * 2);
      const fg = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flashR);
      fg.addColorStop(0, `rgba(255,255,255,${flash.alpha * 0.7})`);
      fg.addColorStop(0.4, `rgba(217,119,6,${flash.alpha * 0.3})`);
      fg.addColorStop(1, 'rgba(217,119,6,0)');
      ctx.fillStyle = fg;
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    // --- HIGH-END TRAILING PATHS ENGINE ---
    drawTrail(ctx, hiderTrailRef.current, HIDER_TRAIL_COLOR, hider.radius, 0.45, 0.9);
    drawTrail(ctx, seekerTrailRef.current, SEEKER_TRAIL_COLOR, seeker.radius, 0.65, 0.95);

    // --- AIMING SLINGSHOT VECTOR LINE gradient DRAW ---
    if (isDraggingRef.current && !ballsMoving) {
      const pts = getAimPoints();
      if (pts.length >= 2) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }

        // Create gradient stroke based on stretch pull distance
        const startBall = pts[0];
        const endTarget = pts[pts.length - 1];
        const g = ctx.createLinearGradient(startBall.x, startBall.y, endTarget.x, endTarget.y);
        g.addColorStop(0, '#eab308'); // Amber start
        g.addColorStop(0.5, '#f97316'); // Orange mid
        g.addColorStop(1, '#ef4444'); // Crimson finish (heavy tension)

        ctx.strokeStyle = g;
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 4]);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f97316';
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw aiming ring node
        ctx.beginPath();
        ctx.arc(endTarget.x, endTarget.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // --- DRAW PARTICLES ---
    drawParticles(ctx, particles);

    // --- DRAW HIDER BALL ---
    const shroudDistance = Math.hypot(hider.x - seeker.x, hider.y - seeker.y);
    const shroudEnabled = shroudDistance > FOG_RADIUS && activeRole === 'seeker' && !isSuddenDeath;
    if (!shroudEnabled && !hiderExplodedRef.current) {
      drawHiderBall(ctx, hider, config.colorblindMode, activeRole === 'hider', ballsMoving);
    }

    // --- DRAW SEEKER BALL ---
    drawSeekerBall(ctx, seeker, config.colorblindMode, activeRole === 'seeker', ballsMoving);

    // --- DRAW FOG OF WAR SHROUD ---
    if (activeRole === 'seeker' && !isSuddenDeath && !tagFrozenRef.current) {
      drawFogOfWar(ctx, seeker.x, seeker.y, mapWidth, mapHeight);
    }

    restoreCameraTransform(ctx); // Restore camera matrices

    // ==========================================
    // --- DRAW HUD TACTICAL MINIMAP OVERLAY ---
    drawMinimap(
      ctx,
      getDefaultConfig(w, h, mapWidth, mapHeight),
      hider.x, hider.y,
      seeker.x, seeker.y,
      hazards, bumpers,
      orbs,
      isSuddenDeath,
      shroudEnabled,
      hiderExplodedRef.current,
      activeRole,
    );
  };

  // --- TOUCH / MOUSE CONTROLS MAPPINGS ---
  const handleStart = (clientX: number, clientY: number) => {
    if (ballsMoving || phase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { mapX, mapY } = screenToMap(clientX, clientY, rect, canvas.width, canvas.height, cameraRef.current);

    const activeBall = activeRole === 'hider' ? hiderBallRef.current : seekerBallRef.current;
    const dist = Math.hypot(mapX - activeBall.x, mapY - activeBall.y);

    // Increase touch target bounding circle offset slightly for mobile ease: radius + 40px
    if (dist < activeBall.radius + TOUCH_TARGET_PAD) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: activeBall.x, y: activeBall.y };
      dragCurrentRef.current = { x: mapX, y: mapY };
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { mapX, mapY } = screenToMap(clientX, clientY, rect, canvas.width, canvas.height, cameraRef.current);
    dragCurrentRef.current = { x: mapX, y: mapY };
  };

  const handleEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Trigger sling fling launch!
    const activeBall = activeRole === 'hider' ? hiderBallRef.current : seekerBallRef.current;

    const launch = calculateLaunch(activeBall.x, activeBall.y, dragCurrentRef.current.x, dragCurrentRef.current.y, activeRole);
    if (!launch) return;

    activeBall.vx = launch.vx;
    activeBall.vy = launch.vy;

    // Rocket Burst: 3x speed boost on next launch
    if (activeRole === 'seeker' && activePowerUp === 'rocket') {
      activeBall.vx *= ROCKET_SPEED_MULT;
      activeBall.vy *= ROCKET_SPEED_MULT;
      setActivePowerUp(null);
      setFloatMessage('ROCKET BURST!');
      playPowerUpActivate('rocket');
    }

    playLaunch();
    haptics.launch();

    // Launch sparks particles
    particlesRef.current.push(
      ...spawnLaunchParticles(activeBall.x, activeBall.y, activeBall.vx, activeBall.vy, activeRole === 'seeker'),
    );
  };

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || (window.innerHeight - 80);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // initial set
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative flex flex-col flex-1 select-none overflow-hidden bg-[#020502]">
      
      {/* Top Banner HUD display */}
      <div className="w-full bg-neutral-950/80 backdrop-blur-md border-b border-emerald-500/25 px-4 py-3 flex justify-between items-center z-10 font-mono text-[11px] h-14 shrink-0 shadow-lg">
        
        {/* Left Side: Game details */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-zinc-500 text-[9px] uppercase tracking-wider">CHASE INDEX</span>
            <span className="text-white font-sans font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Swords className="w-4 h-4 text-emerald-400" /> RD {currentRound + 1}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-zinc-500 text-[9px] uppercase tracking-wider">ELAPSED SCORE</span>
            <span className="text-emerald-400 font-sans font-black text-sm tracking-widest leading-none">
              {turnsSurvived} TURNS
            </span>
          </div>
        </div>

        {/* Center Side: Wholesome turn indicators */}
        <div className="flex items-center gap-2">
          {isSuddenDeath ? (
            <div className="px-3 py-1 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-lg text-fuchsia-400 font-black animate-pulse leading-none text-[10px] tracking-widest uppercase">
              SUDDEN DEATH ACTIVEE
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-black/60 border border-emerald-500/10 rounded-full px-3 py-1">
              <span className="text-zinc-500 text-[9px] uppercase mr-1">SHOT PORT:</span>
              {activeRole === 'hider' ? (
                <span className="text-white font-sans font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" /> {hiderName}
                </span>
              ) : (
                <span className="text-orange-400 font-sans font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" /> {seekerName}
                </span>
              )}
            </div>
          )}
        </div>

        {/* AI Thinking Indicator */}
        {config.isCpu && activeRole === 'seeker' && !ballsMoving && aiStateRef.current.active && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/30 border border-amber-500/20 rounded-lg">
            <Cpu className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-amber-400 text-[9px] font-bold tracking-widest uppercase">CPU Aiming...</span>
          </div>
        )}

        {/* Right Side: Active power-up badge item */}
        <div className="flex items-center gap-2">
          {activePowerUp && (
            <div className={`px-2.5 py-1 rounded border leading-none text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${
              activePowerUp === 'iron' ? 'bg-yellow-950/20 text-yellow-400 border-yellow-500/20' :
              activePowerUp === 'rocket' ? 'bg-rose-950/20 text-rose-400 border-rose-500/20' :
              activePowerUp === 'gravity' ? 'bg-violet-950/20 text-violet-400 border-violet-500/20' :
              activePowerUp === 'vampire' ? 'bg-red-950/20 text-red-400 border-red-500/20' :
              activePowerUp === 'superball' ? 'bg-fuchsia-950/20 text-fuchsia-400 border-fuchsia-500/20' :
              activePowerUp === 'emp' ? 'bg-amber-950/20 text-amber-400 border-amber-500/20' :
              'bg-purple-950/30 text-purple-400 border-purple-500/20'
            }`}>
              <Zap className="w-3 h-3 fill-current" /> {activePowerUp.toUpperCase()}
            </div>
          )}

          <button
            onClick={onOpenHelp}
            id="btn-hud-help"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onExitGame}
            id="btn-hud-exit"
            className="px-2 py-1 bg-red-950/40 border border-red-500/20 text-red-400 rounded hover:bg-red-900 hover:text-white text-[9px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
          >
            QUIT
          </button>
        </div>
      </div>

      {/* Floating Alerts Container */}
      {floatMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-emerald-500/10 border border-emerald-400/40 text-emerald-400 rounded-full font-mono text-xs font-bold tracking-widest shadow-lg shadow-emerald-500/5 animate-bounce">
          {floatMessage}
        </div>
      )}

      {/* Scoring Message Queue */}
      {scoreMessages.length > 0 && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
          {scoreMessages.slice(-5).reverse().map((msg) => {
            const colors: Record<string, string> = {
              combo: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
              turn: 'bg-white/5 border-white/10 text-white',
              nearMiss: 'bg-amber-500/20 border-amber-400/40 text-amber-300 font-black animate-pulse',
              collect: 'bg-purple-500/15 border-purple-400/30 text-purple-300',
              tag: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300 font-black',
            };
            const style = colors[msg.type] || colors.turn;
            return (
              <div key={msg.id} className={`px-3 py-1.5 border rounded-lg font-mono text-xs font-bold tracking-wider shadow-lg ${style}`}>
                {msg.text}
              </div>
            );
          })}
        </div>
      )}

      {/* Input Locking Visual Overlay Indicator */}
      {!ballsMoving && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-neutral-950/90 border border-white/5 rounded-full text-[10px] text-zinc-400 font-mono tracking-widest shadow-xl pointer-events-none flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
          DRAG BACKWARD TO AIM FLING
        </div>
      )}

      {/* Canvas Element Container */}
      <div className="flex-1 w-full bg-[#020502] relative touch-none outline-none">
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handleStart(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={handleEnd}
          className="block w-full h-full cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
}
