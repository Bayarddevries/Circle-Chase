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
  RoundMeta,
  Unlocks,
} from '../types';
import {
  FOG_RADIUS,
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
  PARTICLE_MAX,
  SEEKER_SPEED_MULT,
  HIDER_BASE_SPEED,
  BUMPER_COUNT_NORMAL,
  BUMPER_COUNT_SD,
  SAND_COUNT,
  ICE_COUNT,
  ORB_RESPAWN_TIME,
  ORB_SPAWN_RANGE,
  CLOAK_DURATION,
  MAGNET_DURATION,
  MAGNET_PULL_STRENGTH,
  LASER_SPEED_MULT,
  CREDITS_BASE_MULT,
  CREDITS_POWERUP_BONUS,
  LEADERBOARD_MAX,
  AI_THINK_DELAY,
  AI_EASY_ERROR,
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

interface GameCanvasProps {
  phase: GamePhase;
  config: MatchConfig;
  currentRound: number;
  isSuddenDeath: boolean;
  onRoundComplete: (turns: number, suddenDeathWinnerRole?: PlayerRole, roundMeta?: RoundMeta) => void;
  onOpenHelp: () => void;
  onExitGame: () => void;
  unlocks: Unlocks;
}

export function GameCanvas({
  phase,
  config,
  currentRound,
  isSuddenDeath,
  onRoundComplete,
  onOpenHelp,
  onExitGame,
  unlocks,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  // Mobile detection — viewport width below 768px (landscape phones, small tablets)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Game state parameters
  const [activeRole, setActiveRole] = useState<PlayerRole>('hider');
  const [turnsSurvived, setTurnsSurvived] = useState<number>(0);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpDuration, setPowerUpDuration] = useState<number>(0); // consumed after 1 shot
  
  // Floating status message
  const [floatMessage, setFloatMessage] = useState<string | null>(null);
  const [floatTimer, setFloatTimer] = useState<number>(0);

  // CPU AI thinking overlay state
  const [aiThinking, setAiThinking] = useState<boolean>(false);

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
    radius: SEEKER_RADIUS,
    role: 'seeker',
    name: seekerName,
  });

  // Entities
  const bumpersRef = useRef<NeonBumper[]>([]);
  const hazardsRef = useRef<HazardPatch[]>([]);
  const orbRef = useRef<PowerUpOrb>({
    x: 1000,
    y: 750,
    radius: 18,
    type: 'laser',
    active: true,
    pulseScale: 1,
  });

  // FX systems
  const particlesRef = useRef<Particle[]>([]);
  const sonarPingsRef = useRef<SonarPing[]>([]);
  const lastPingTimeRef = useRef<number>(0);

  // Slingshot variables
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Camera variables with LERP tracking
  const cameraRef = useRef({
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

  // Power-up duration tracking refs
  const powerUpCollectedRef = useRef<boolean>(false);
  const tagTurnRef = useRef<number>(0);
  const cloakTimerRef = useRef<number>(0);  // frames remaining for cloak
  const magnetTimerRef = useRef<number>(0); // frames remaining for magnet
  const bumperHitCountRef = useRef<number>(0);
  const orbRespawnTimerRef = useRef<number>(0); // ms until orb respawns

  // Unlock config refs (synced from props for use inside game loop)
  const activeSkinRef = useRef<string>('default');
  const activeTrailRef = useRef<string>('default');
  const activeBumperRef = useRef<string>('default');
  const activeMapBgRef = useRef<string>('default');

  // Controls lock during active flings
  const [ballsMoving, setBallsMoving] = useState<boolean>(false);

  // CPU AI timing
  const cpuTimerRef = useRef<number>(0);
  const cpuThinkingRef = useRef<boolean>(false);
  const cpuHasFledRef = useRef<boolean>(false);

  // Last known hider position (for AI targeting)
  // Updated on sonar pings and when hider is within FOG_RADIUS
  const lastKnownHiderPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Seeker's last movement angle (for directional fog of war)
  const seekerMoveAngleRef = useRef<number>(0);

  // Run procedural map generator when a round shifts
  const generateMap = () => {
    // Reset player position coordinates cleared of starting boundaries
    hiderBallRef.current = {
      x: isSuddenDeath ? 300 : 450,
      y: isSuddenDeath ? 450 : 750,
      vx: 0,
      vy: 0,
      radius: 20,
      role: 'hider',
      name: hiderName,
    };

    seekerBallRef.current = {
      x: isSuddenDeath ? 900 : 1550,
      y: isSuddenDeath ? 450 : 750,
      vx: 0,
      vy: 0,
      radius: 24,
      role: 'seeker',
      name: seekerName,
    };

    // Bumpers
    const newBumpers: NeonBumper[] = [];
    const numBumpers = isSuddenDeath ? BUMPER_COUNT_SD : BUMPER_COUNT_NORMAL;
    const colors = ['#ff0055', '#ff00aa', '#00f0ff', '#e0ffff'];

    let tries = 0;
    while (newBumpers.length < numBumpers && tries < 100) {
      tries++;
      const bx = 150 + Math.random() * (mapWidth - 300);
      const by = 150 + Math.random() * (mapHeight - 300);
      
      // Clear from players spawns
      const distH = Math.hypot(bx - hiderBallRef.current.x, by - hiderBallRef.current.y);
      const distS = Math.hypot(bx - seekerBallRef.current.x, by - seekerBallRef.current.y);
      
      if (distH < 180 || distS < 180) continue;

      // Avoid bunching together
      let tooClose = false;
      for (const b of newBumpers) {
        if (Math.hypot(bx - b.x, by - b.y) < 140) tooClose = true;
      }
      if (tooClose) continue;

      newBumpers.push({
        id: `bumper-${newBumpers.length}`,
        x: bx,
        y: by,
        radius: 42 + Math.random() * 15,
        color: colors[newBumpers.length % colors.length],
        pulseTimer: 0,
      });
    }

    bumpersRef.current = newBumpers;

    // Sand and Ice Patches (Zero on sudden death map to intensify bounces)
    const newHazards: HazardPatch[] = [];
    if (!isSuddenDeath) {
      const numSand = SAND_COUNT;
      const numIce = ICE_COUNT;

      // Add Sand
      let sandCount = 0;
      tries = 0;
      while (sandCount < numSand && tries < 150) {
        tries++;
        const sx = 200 + Math.random() * (mapWidth - 400);
        const sy = 200 + Math.random() * (mapHeight - 400);
        
        const distH = Math.hypot(sx - hiderBallRef.current.x, sy - hiderBallRef.current.y);
        const distS = Math.hypot(sx - seekerBallRef.current.x, sy - seekerBallRef.current.y);
        if (distH < 220 || distS < 220) continue;

        let overlap = false;
        for (const b of bumpersRef.current) {
          if (Math.hypot(sx - b.x, sy - b.y) < b.radius + 100) overlap = true;
        }
        for (const h of newHazards) {
          if (Math.hypot(sx - h.x, sy - h.y) < 200) overlap = true;
        }
        if (overlap) continue;

        newHazards.push({
          id: `sand-${sandCount}`,
          x: sx,
          y: sy,
          radius: 120 + Math.random() * 50,
          type: 'sand',
        });
        sandCount++;
      }

      // Add Ice
      let iceCount = 0;
      tries = 0;
      while (iceCount < numIce && tries < 150) {
        tries++;
        const ix = 200 + Math.random() * (mapWidth - 400);
        const iy = 200 + Math.random() * (mapHeight - 400);

        const distH = Math.hypot(ix - hiderBallRef.current.x, iy - hiderBallRef.current.y);
        const distS = Math.hypot(ix - seekerBallRef.current.x, iy - seekerBallRef.current.y);
        if (distH < 220 || distS < 220) continue;

        let overlap = false;
        for (const b of bumpersRef.current) {
          if (Math.hypot(ix - b.x, iy - b.y) < b.radius + 100) overlap = true;
        }
        for (const h of newHazards) {
          if (Math.hypot(ix - h.x, iy - h.y) < 200) overlap = true;
        }
        if (overlap) continue;

        newHazards.push({
          id: `ice-${iceCount}`,
          x: ix,
          y: iy,
          radius: 110 + Math.random() * 45,
          type: 'ice',
        });
        iceCount++;
      }
    }

    hazardsRef.current = newHazards;

    // Power-Up Orb location (randomized middle-zone position)
    if (!isSuddenDeath) {
      // Bias orb spawn toward the Hider's starting area so it's visible on first turn
      const hiderStartX = isSuddenDeath ? 300 : 450;
      const hiderStartY = isSuddenDeath ? 450 : 750;
      const biasRange = 400;
      const ox = hiderStartX - biasRange / 2 + Math.random() * biasRange;
      const oy = hiderStartY - biasRange / 2 + Math.random() * biasRange;

      const pTypes: PowerUpType[] = ['laser', 'superball', 'iron', 'sonar', 'cloak', 'magnet'];
      const randomType = pTypes[Math.floor(Math.random() * pTypes.length)];

      orbRef.current = {
        x: Math.max(100, Math.min(mapWidth - 100, ox)),
        y: Math.max(100, Math.min(mapHeight - 100, oy)),
        radius: 20,
        type: randomType,
        active: true,
        pulseScale: 1,
      };
    } else {
      // Deactivate items on Sudden death
      orbRef.current.active = false;
    }

    // Reset systems
    particlesRef.current = [];
    sonarPingsRef.current = [];
    hiderTrailRef.current = [];
    seekerTrailRef.current = [];
    shakeAmtRef.current = 0;
    slowMotionRef.current = 1.0;
    activeShockwaveRef.current = null;
    hiderExplodedRef.current = false;
    setActiveRole('hider');
    setTurnsSurvived(0);
    setActivePowerUp(null);
    setBallsMoving(false);

    // Reset AI tracking
    cpuHasFledRef.current = false;
    lastKnownHiderPosRef.current = { x: hiderBallRef.current.x, y: hiderBallRef.current.y };

    // Reset meta-progression tracking
    bumperHitCountRef.current = 0;
    powerUpCollectedRef.current = false;
    tagTurnRef.current = 0;
  };

  // Build the map on mount & phase variations
  useEffect(() => {
    if (phase === 'playing') {
      generateMap();
    }
  }, [currentRound, phase, isSuddenDeath]);

  // Sync unlock config into refs so game loop can read them
  useEffect(() => {
    // Pick the last (first non-default) unlocked item in each category
    const pickFirst = (cat: Record<string, boolean>): string => {
      for (const key of Object.keys(cat)) {
        if (key !== 'default' && cat[key]) return key;
      }
      return 'default';
    };
    activeSkinRef.current = pickFirst(unlocks.ballSkins);
    activeTrailRef.current = pickFirst(unlocks.trailColors);
    activeBumperRef.current = pickFirst(unlocks.bumperThemes);
    activeMapBgRef.current = pickFirst(unlocks.mapBackgrounds);
  }, [unlocks]);

  // Handle float text notification animation
  useEffect(() => {
    if (floatMessage) {
      const tid = setTimeout(() => {
        setFloatMessage(null);
      }, 2500);
      return () => clearTimeout(tid);
    }
  }, [floatMessage]);

  // Core Game Loop
  useEffect(() => {
    if (phase !== 'playing') return;

    let animFrame: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = Math.min(25, time - lastTime);
      lastTime = time;

      // Update positions & physics with substepping
      physicsStep(time);

      // ── CPU AI Seeker auto-play ──
      if (config.isCpu && activeRole === 'seeker' && !cpuHasFledRef.current) {
        const hSpeed = Math.hypot(hiderBallRef.current.vx, hiderBallRef.current.vy);
        const sSpeed = Math.hypot(seekerBallRef.current.vx, seekerBallRef.current.vy);
        const bothStopped = hSpeed === 0 && sSpeed === 0;

        if (bothStopped) {
          if (!cpuThinkingRef.current) {
            cpuThinkingRef.current = true;
            cpuTimerRef.current = 0;
            setAiThinking(true);
          }
          cpuTimerRef.current += delta;
          if (cpuTimerRef.current >= AI_THINK_DELAY) {
            cpuThinkingRef.current = false;
            cpuTimerRef.current = 0;
            setAiThinking(false);
            executeAISeekerFling();
            cpuHasFledRef.current = true; // Guard: only fling once per turn
          }
        } else if (cpuThinkingRef.current) {
          // Safety: balls started moving unexpectedly
          cpuThinkingRef.current = false;
          cpuTimerRef.current = 0;
          setAiThinking(false);
        }
      }

      // Render
      draw();

      animFrame = requestAnimationFrame(loop);
    };

    // Sub-stepping engine for exact physical calculations (5 steps per frame)
    const physicsStep = (time: number) => {
      const hider = hiderBallRef.current;
      const seeker = seekerBallRef.current;
      const bumpers = bumpersRef.current;
      const hazards = hazardsRef.current;
      const orb = orbRef.current;

      const subStepsCount = 5;
      const speedScale = slowMotionRef.current;

      for (let s = 0; s < subStepsCount; s++) {
        // Move players by 1/5th increment scaled by current slow-motion factor
        hider.x += (hider.vx / subStepsCount) * speedScale;
        hider.y += (hider.vy / subStepsCount) * speedScale;

        seeker.x += (seeker.vx / subStepsCount) * speedScale;
        seeker.y += (seeker.vy / subStepsCount) * speedScale;

        // --- Magnet power-up: pull hider toward seeker ---
        if (magnetTimerRef.current > 0 && activeRole === 'seeker') {
          const dx = seeker.x - hider.x;
          const dy = seeker.y - hider.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 50 && dist < 600) {
            const pull = MAGNET_PULL_STRENGTH / dist;
            hider.vx += dx * pull;
            hider.vy += dy * pull;
          }
          magnetTimerRef.current--;
        }

        // Decrement cloak timer each frame (only once per frame, not per substep)
        if (s === 0 && cloakTimerRef.current > 0) {
          cloakTimerRef.current--;
        }

        // --- Boundary collisions & clamp updates ---
        const isExploding = slowMotionRef.current < 1.0;
        const hiderRest = isExploding ? BOUNCE_REST_SLOWMO : BOUNCE_REST_NORMAL;
        const seekerRest = isExploding ? BOUNCE_REST_SLOWMO : ((activePowerUp === 'superball') ? BOUNCE_REST_SUPERBALL : BOUNCE_REST_NORMAL);

        // Hider Borders
        if (hider.x - hider.radius < 0) {
          hider.x = hider.radius;
          hider.vx = -hider.vx * hiderRest;
        } else if (hider.x + hider.radius > mapWidth) {
          hider.x = mapWidth - hider.radius;
          hider.vx = -hider.vx * hiderRest;
        }

        if (hider.y - hider.radius < 0) {
          hider.y = hider.radius;
          hider.vy = -hider.vy * hiderRest;
        } else if (hider.y + hider.radius > mapHeight) {
          hider.y = mapHeight - hider.radius;
          hider.vy = -hider.vy * hiderRest;
        }

        // Seeker Borders
        if (seeker.x - seeker.radius < 0) {
          seeker.x = seeker.radius;
          seeker.vx = -seeker.vx * seekerRest;
        } else if (seeker.x + seeker.radius > mapWidth) {
          seeker.x = mapWidth - seeker.radius;
          seeker.vx = -seeker.vx * seekerRest;
        }

        if (seeker.y - seeker.radius < 0) {
          seeker.y = seeker.radius;
          seeker.vy = -seeker.vy * seekerRest;
        } else if (seeker.y + seeker.radius > mapHeight) {
          seeker.y = mapHeight - seeker.radius;
          seeker.vy = -seeker.vy * seekerRest;
        }

        // --- Bumper Collisions ---
        const handleBumperCollision = (ball: PlayerBall, isSeeker: boolean) => {
          for (const b of bumpers) {
            const dist = Math.hypot(ball.x - b.x, ball.y - b.y);
            const rSum = ball.radius + b.radius;
            if (dist < rSum) {
              // Resolve overlap
              const nx = (ball.x - b.x) / dist;
              const ny = (ball.y - b.y) / dist;
              ball.x = b.x + nx * rSum;
              ball.y = b.y + ny * rSum;

              // Collision velocity reflection
              const vn = ball.vx * nx + ball.vy * ny;
              if (vn < 0) {
                let e = BUMPER_REST;
                if (isSeeker && activePowerUp === 'superball') {
                  e = BUMPER_REST_SUPERBALL;
                }
                bumperHitCountRef.current++;
                
                // Reflection formula
                ball.vx = ball.vx - (1 + e) * vn * nx;
                ball.vy = ball.vy - (1 + e) * vn * ny;
                
                // Deliver small static speed kick to ensure rapid launch
                const currentSpeed = Math.hypot(ball.vx, ball.vy);
                const boostFactor = (isSeeker && activePowerUp === 'superball') ? BUMPER_BOOST_SUPERBALL : BUMPER_BOOST_NORMAL;
                if (currentSpeed < BUMPER_MIN_SPEED) {
                  ball.vx = nx * BUMPER_KICK_SPEED * boostFactor;
                  ball.vy = ny * BUMPER_KICK_SPEED * boostFactor;
                } else {
                  ball.vx *= boostFactor;
                  ball.vy *= boostFactor;
                }

                // Trigger pulse animation and screenshake
                b.pulseTimer = 15;
                shakeAmtRef.current = Math.min(shakeAmtRef.current + 8, 15);

                // Create bumper spark particles
                for (let i = 0; i < 6; i++) {
                  particlesRef.current.push({
                    x: b.x + nx * b.radius,
                    y: b.y + ny * b.radius,
                    vx: nx * 3 + (Math.random() - 0.5) * 4,
                    vy: ny * 3 + (Math.random() - 0.5) * 4,
                    radius: 3 + Math.random() * 3,
                    color: b.color,
                    alpha: 1,
                    decay: 0.03 + Math.random() * 0.03,
                  });
                }
              }
            }
          }
        };

        handleBumperCollision(hider, false);
        handleBumperCollision(seeker, true);

        // --- Tag detection (Seeker collides with Hider) ---
        const distToTag = Math.hypot(seeker.x - hider.x, seeker.y - hider.y);
        const tagRadiusSum = hider.radius + seeker.radius;
        if (distToTag < tagRadiusSum) {
          // TAG CONFIRMED! Freeze and blast particles
          triggerTagEvent();
          return; // Stop physics immediately
        }

        // --- Seeker Power-Up Orb pickup ---
        if (orb.active) {
          const distToOrb = Math.hypot(seeker.x - orb.x, seeker.y - orb.y);
          if (distToOrb < seeker.radius + orb.radius) {
            orb.active = false;
            powerUpCollectedRef.current = true;
            // Absorb powerup
            setActivePowerUp(orb.type);
            setPowerUpDuration(1); // 1 active shot
            
            const titles: Record<PowerUpType, string> = {
              laser: 'Laser Sight',
              superball: 'Superball',
              iron: 'Iron Ball',
              sonar: 'Sonar Pulse',
              cloak: 'Cloak',
              magnet: 'Magnet',
            };
            setFloatMessage(titles[orb.type]);

            // Activate timed power-ups
            if (orb.type === 'cloak') {
              cloakTimerRef.current = CLOAK_DURATION;
            } else if (orb.type === 'magnet') {
              magnetTimerRef.current = MAGNET_DURATION;
            }

            // Start orb respawn timer
            orbRespawnTimerRef.current = ORB_RESPAWN_TIME;

            // Spawn bright items particles
            for (let i = 0; i < 20; i++) {
              const ang = Math.random() * Math.PI * 2;
              const sp = 2 + Math.random() * 6;
              particlesRef.current.push({
                x: orb.x,
                y: orb.y,
                vx: Math.cos(ang) * sp,
                vy: Math.sin(ang) * sp,
                radius: 3 + Math.random() * 3,
                color: '#00ffff',
                alpha: 1,
                decay: 0.02 + Math.random() * 0.02,
              });
            }
          }
        }
      }

      // --- Apply Friction deceleration (once per frame, after substepping) ---
      const applyFriction = (ball: PlayerBall, isSeeker: boolean) => {
        let baseFriction = isSeeker ? FRICTION_SEEKER : FRICTION_BASE;

        // Suspend friction heavily during explosive slow motion tag events
        if (slowMotionRef.current < 1.0) {
          baseFriction = FRICTION_SLOWMO;
        }

        let enteredSand = false;
        let enteredIce = false;

        // Check hazard zones
        for (const hp of hazards) {
          const d = Math.hypot(ball.x - hp.x, ball.y - hp.y);
          if (d < hp.radius + ball.radius) {
            if (hp.type === 'sand') {
              enteredSand = true;
            } else if (hp.type === 'ice') {
              enteredIce = true;
            }
          }
        }

        if (enteredSand) {
          if (slowMotionRef.current < 1.0) {
            ball.vx *= baseFriction;
            ball.vy *= baseFriction;
          } else if (isSeeker && activePowerUp === 'iron') {
            ball.vx *= baseFriction;
            ball.vy *= baseFriction;
            // spawn sandy dusty trails
            if (Math.hypot(ball.vx, ball.vy) > 1 && Math.random() < 0.3) {
              particlesRef.current.push({
                x: ball.x,
                y: ball.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: 2,
                color: '#ca8a04',
                alpha: 0.6,
                decay: 0.05,
              });
            }
          } else {
            ball.vx *= baseFriction * FRICTION_SAND_MULT;
            ball.vy *= baseFriction * FRICTION_SAND_MULT;
          }
        } else if (enteredIce) {
          // Iron power-up: immune to ice (and sand)
          if (isSeeker && activePowerUp === 'iron') {
            ball.vx *= baseFriction;
            ball.vy *= baseFriction;
          } else {
            ball.vx *= FRICTION_ICE;
            ball.vy *= FRICTION_ICE;
          }
        } else {
          ball.vx *= baseFriction;
          ball.vy *= baseFriction;
        }

        // Stop completely if extremely slow
        if (Math.hypot(ball.vx, ball.vy) < STOP_THRESHOLD && slowMotionRef.current >= 1.0) {
          ball.vx = 0;
          ball.vy = 0;
        }
      };

      applyFriction(hider, false);
      applyFriction(seeker, true);

      // Check if balls have come to rest
      const hSpeed = Math.hypot(hider.vx, hider.vy);
      const sSpeed = Math.hypot(seeker.vx, seeker.vy);
      const isMoving = hSpeed > 0 || sSpeed > 0;

      if (isMoving && !ballsMoving) {
        setBallsMoving(true);
      }

      // Detect state transition from motion to resting
      if (!isMoving && ballsMoving) {
        setBallsMoving(false);
        // Clean turn swaps
        toggleTurnFlow();
      }

      // Update Particle debris FX
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Particles move relative to slow motion scale so they look realistic but responsive
        const pSpeedScale = Math.max(0.2, slowMotionRef.current);
        p.x += p.vx * pSpeedScale;
        p.y += p.vy * pSpeedScale;

        // Apply physical gravity to massive heavy fragments
        if (p.heavy) {
          p.vy += 0.22 * pSpeedScale; // fall acceleration
        }

        // Spin rotation increments
        if (p.spin !== undefined && p.angle !== undefined) {
          p.angle += p.spin * pSpeedScale;
        }

        // Elastic boundary wall reflections for physical shards
        if (p.type === 'debris' || p.type === 'glass') {
          const bounceRest = 0.74; // Elastic restitution
          
          if (p.x - p.radius < 0) {
            p.x = p.radius;
            p.vx = -p.vx * bounceRest;
            if (p.spin !== undefined) p.spin = -p.spin * 0.8;
          } else if (p.x + p.radius > mapWidth) {
            p.x = mapWidth - p.radius;
            p.vx = -p.vx * bounceRest;
            if (p.spin !== undefined) p.spin = -p.spin * 0.8;
          }

          if (p.y - p.radius < 0) {
            p.y = p.radius;
            p.vy = -p.vy * bounceRest;
            if (p.spin !== undefined) p.spin = -p.spin * 0.8;
          } else if (p.y + p.radius > mapHeight) {
            p.y = mapHeight - p.radius;
            p.vy = -p.vy * bounceRest;
            if (p.spin !== undefined) p.spin = -p.spin * 0.8;
          }
        }

        // Debris survives longer during slow motion
        const decayMultiplier = slowMotionRef.current < 1.0 ? 0.55 : 1.0;
        p.alpha -= p.decay * decayMultiplier;

        if (p.alpha <= 0 || p.radius <= 0) {
          particles.splice(i, 1);
        }
      }

      // Update Sonar Radar Wave emissions
      const pings = sonarPingsRef.current;
      for (let i = pings.length - 1; i >= 0; i--) {
        const ping = pings[i];
        ping.radius += ping.speed;
        ping.alpha = Math.max(0, 1 - (ping.radius / ping.maxRadius));
        if (ping.radius >= ping.maxRadius) {
          pings.splice(i, 1);
        }
      }

      // Orb respawn timer
      if (!orbRef.current.active && !isSuddenDeath && orbRespawnTimerRef.current > 0) {
        orbRespawnTimerRef.current -= 16; // ~60fps frame time
        if (orbRespawnTimerRef.current <= 0) {
          // Respawn orb at a new random position near center
          const ox = (mapWidth / 2) - ORB_SPAWN_RANGE + Math.random() * ORB_SPAWN_RANGE * 2;
          const oy = (mapHeight / 2) - ORB_SPAWN_RANGE + Math.random() * ORB_SPAWN_RANGE * 2;
          const pTypes: PowerUpType[] = ['laser', 'superball', 'iron', 'sonar', 'cloak', 'magnet'];
          orbRef.current = {
            x: ox, y: oy,
            radius: 20,
            type: pTypes[Math.floor(Math.random() * pTypes.length)],
            active: true,
            pulseScale: 1,
          };
        }
      }
      const now = performance.now();
      if (now - lastPingTimeRef.current > SONAR_INTERVAL) {
        lastPingTimeRef.current = now;
        // Only if Seeker can't easily see Hider (Fog of war is active in seeker turn)
        const d = Math.hypot(hider.x - seeker.x, hider.y - seeker.y);
        const inFog = d > FOG_RADIUS;
        
        if (inFog && activeRole === 'seeker' && !isSuddenDeath) {
          sonarPingsRef.current.push({
            x: hider.x,
            y: hider.y,
            radius: 5,
            maxRadius: 280,
            alpha: 1,
            speed: 3,
          });
          // Update last known hider position from sonar
          lastKnownHiderPosRef.current = { x: hider.x, y: hider.y };
        }

        // Also update last known position if hider is within fog radius (visible to seeker)
        if (!inFog && activeRole === 'seeker') {
          lastKnownHiderPosRef.current = { x: hider.x, y: hider.y };
        }
      }

      // Update bumper pulse glows
      for (const b of bumpers) {
        if (b.pulseTimer > 0) b.pulseTimer--;
      }

      // Update orb pulse float scale
      if (orb.active) {
        orb.pulseScale = 1 + Math.sin(time * 0.006) * 0.12;
      }

      // --- Accumulate path tracking trails (once per physics frame) ---
      const hTrailSpeed = Math.hypot(hider.vx, hider.vy);
      const sTrailSpeed = Math.hypot(seeker.vx, seeker.vy);

      if (hTrailSpeed > 0.05) {
        hiderTrailRef.current.push({ x: hider.x, y: hider.y });
        if (hiderTrailRef.current.length > 25) hiderTrailRef.current.shift();
      } else {
        if (hiderTrailRef.current.length > 0) hiderTrailRef.current.shift();
      }

      if (sTrailSpeed > 0.05) {
        seekerTrailRef.current.push({ x: seeker.x, y: seeker.y });
        if (seekerTrailRef.current.length > 25) seekerTrailRef.current.shift();
      } else {
        if (seekerTrailRef.current.length > 0) seekerTrailRef.current.shift();
      }

      // --- Propagate post-tag shockwave ripple ---
      if (activeShockwaveRef.current && activeShockwaveRef.current.active) {
        activeShockwaveRef.current.r += 6.5; 
        if (activeShockwaveRef.current.r >= activeShockwaveRef.current.maxR) {
          activeShockwaveRef.current.active = false;
        }
      }

      // --- Decelerate camera screen-shake vibration ---
      if (shakeAmtRef.current > 0.05) {
        shakeAmtRef.current *= 0.935;
      } else {
        shakeAmtRef.current = 0;
      }

      // --- Recover slow-motion timeline dampening back to normal ---
      if (slowMotionRef.current < 1.0) {
        slowMotionRef.current += 0.009;
        if (slowMotionRef.current > 1.0) slowMotionRef.current = 1.0;
      }

      // Hard cap to avoid pathological spikes
      if (particlesRef.current.length > PARTICLE_MAX) {
        particlesRef.current.splice(0, particlesRef.current.length - PARTICLE_MAX);
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
        // Reset AI fling guard for the new seeker turn
        cpuHasFledRef.current = false;
      } else {
        // Seeker flings and misses!
        // Swap back to Hider
        setActiveRole('hider');

        // Check if Seeker consumed their active single-use powerup
        if (activePowerUp) {
          setPowerUpDuration(prev => {
            const next = prev - 1;
            if (next <= 0) {
              setActivePowerUp(null);
              setFloatMessage('Power-up expired');
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

      // Set hiderExploded to true so the solid ball core shatters out of sight
      hiderExplodedRef.current = true;

      // Record which turn the tag happened on
      tagTurnRef.current = turnsSurvived + 1; // +1 because this turn is currently in progress

      // Tag confirmed! Apply intense screen shake and engage dramatic slow-motion
      shakeAmtRef.current = 42; // Very dramatic screen rattle
      slowMotionRef.current = 0.025; // High-tension 2.5% slow speed

      const centerTagX = (h.x + s.x) / 2;
      const centerTagY = (h.y + s.y) / 2;

      // Initiate golden expanding shockwave
      activeShockwaveRef.current = {
        x: centerTagX,
        y: centerTagY,
        r: 15,
        maxR: 640,
        active: true,
      };

      const ringParts: Particle[] = [];

      // 1. Core combustion sparks (65 glowing fire elements)
      const count = 65;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const speed = 8 + Math.random() * 26;
        ringParts.push({
          x: centerTagX,
          y: centerTagY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2 + Math.random() * 5,
          color: i % 3 === 0 ? '#ea580c' : (i % 3 === 1 ? '#d97706' : '#ffffff'), // Solar Orange, Rich Amber Gold, White flash
          alpha: 1.0,
          decay: 0.012 + Math.random() * 0.01,
          type: 'spark',
        });
      }

      // 2. Physical heavy bouncing shards representing the shattered Hider (35 sky blue cyan slabs)
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 7 + Math.random() * 24;
        ringParts.push({
          x: h.x,
          y: h.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 4.5 + Math.random() * 8.5,
          color: i % 2 === 0 ? '#38bdf8' : '#ffffff', // Sky Blue glow & silver-white chrome highlights
          alpha: 1.0,
          decay: 0.0035 + Math.random() * 0.004, // slides and decays very slowly
          type: 'debris',
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.45,
          heavy: true, // gravity bound
        });
      }

      // 3. Delicate glass fragments bursting out (25 neon ice-blue shards)
      for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 12 + Math.random() * 30;
        ringParts.push({
          x: centerTagX,
          y: centerTagY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3 + Math.random() * 5.5,
          color: '#e0f2fe', // Bright iceberg highlight
          alpha: 1.0,
          decay: 0.005 + Math.random() * 0.006,
          type: 'glass',
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.65,
        });
      }

      particlesRef.current = ringParts;

      // Force extreme Rocket League slow-mo recoil physics: blast player balls outwards!
      const recoilAngle = Math.atan2(h.y - s.y, h.x - s.x);
      
      // Highly boosted recoil speeds so they glide super far and bounce off walls in slow motion
      h.vx = Math.cos(recoilAngle) * 200;
      h.vy = Math.sin(recoilAngle) * 200;
      s.vx = -Math.cos(recoilAngle) * 145;
      s.vy = -Math.sin(recoilAngle) * 145;

      // Conclude round in 1.45 seconds to showcase the slow-mo kinetic bounces and shockwave
      setTimeout(() => {
        // Halt velocity forces when transitioning
        h.vx = 0; h.vy = 0;
        s.vx = 0; s.vy = 0;

        const roundMeta: RoundMeta = {
          turnsSurvived,
          powerUpCollected: powerUpCollectedRef.current,
          bumperHits: bumperHitCountRef.current,
          tagTurn: tagTurnRef.current,
        };

        if (isSuddenDeath) {
          onRoundComplete(turnsSurvived, 'seeker', roundMeta);
        } else {
          onRoundComplete(turnsSurvived, undefined, roundMeta);
        }
      }, 1450);
    };

    animFrame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [phase, activeRole, ballsMoving, activePowerUp, isSuddenDeath, config]);

  // ── AI Opponent (CPU Seeker) ─────────────────────────────────

  const simulateBallPath = (
    startX: number, startY: number,
    vx: number, vy: number,
    radius: number,
    steps: number,
    maxBounces: number,
    friction: number = FRICTION_BASE,
  ): { x: number; y: number }[] => {
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    let cx = startX, cy = startY, cvx = vx, cvy = vy;
    let bounces = 0;
    const mw = mapWidth, mh = mapHeight;
    const bumpers = bumpersRef.current;
    const restitution = 0.65;

    for (let s = 0; s < steps && Math.hypot(cvx, cvy) > STOP_THRESHOLD; s++) {
      cx += cvx;
      cy += cvy;

      let bounced = false;
      // Wall bounces
      if (cx - radius < 0) { cx = radius; cvx = -cvx * restitution; bounced = true; }
      else if (cx + radius > mw) { cx = mw - radius; cvx = -cvx * restitution; bounced = true; }
      if (cy - radius < 0) { cy = radius; cvy = -cvy * restitution; bounced = true; }
      else if (cy + radius > mh) { cy = mh - radius; cvy = -cvy * restitution; bounced = true; }
      if (bounced) bounces++;

      // Bumper bounces (only if we still have budget)
      if (bounces < maxBounces) {
        for (const b of bumpers) {
          const dist = Math.hypot(cx - b.x, cy - b.y);
          if (dist < radius + b.radius) {
            const nx = (cx - b.x) / dist;
            const ny = (cy - b.y) / dist;
            cx = b.x + nx * (radius + b.radius);
            cy = b.y + ny * (radius + b.radius);
            const vn = cvx * nx + cvy * ny;
            if (vn < 0) {
              cvx = cvx - (1 + BUMPER_REST) * vn * nx;
              cvy = cvy - (1 + BUMPER_REST) * vn * ny;
              const speed = Math.hypot(cvx, cvy);
              if (speed < BUMPER_MIN_SPEED) {
                cvx = nx * BUMPER_KICK_SPEED * BUMPER_BOOST_NORMAL;
                cvy = ny * BUMPER_KICK_SPEED * BUMPER_BOOST_NORMAL;
              } else {
                cvx *= BUMPER_BOOST_NORMAL;
                cvy *= BUMPER_BOOST_NORMAL;
              }
            }
            bounces++;
            break;
          }
        }
      }

      if (bounces >= maxBounces) { points.push({ x: cx, y: cy }); break; }

      // Friction
      cvx *= friction;
      cvy *= friction;

      points.push({ x: cx, y: cy });
    }

    return points;
  };

  const executeAISeekerFling = () => {
    const hider = hiderBallRef.current;
    const seeker = seekerBallRef.current;
    const orb = orbRef.current;
    const diff = config.difficulty || 'medium';

    // ── Difficulty parameters ──
    // Easy:   ±15% aim error, ~70% power, 0 bounces simulated
    // Medium: ±8% aim error,  ~85% power, 1 bounce simulated
    // Hard:   ±3% aim error,  ~95% power, 2 bounces simulated, considers power-ups
    const diffConfig = {
      easy:   { aimError: AI_EASY_ERROR,              powerMult: 0.70, maxBounces: 0, considerOrb: false },
      medium: { aimError: AI_EASY_ERROR * 0.53,       powerMult: 0.85, maxBounces: 1, considerOrb: false },
      hard:   { aimError: AI_EASY_ERROR * 0.2,        powerMult: 0.95, maxBounces: 2, considerOrb: true  },
    }[diff];

    const seekerVMax = HIDER_BASE_SPEED * SEEKER_SPEED_MULT;

    // ── Use last known hider position as aim target ──
    // If hider is visible (within fog radius), use real position; otherwise use last known
    const distToHider = Math.hypot(hider.x - seeker.x, hider.y - seeker.y);
    const hiderVisible = distToHider <= FOG_RADIUS || isSuddenDeath;
    const aimTarget = hiderVisible
      ? { x: hider.x, y: hider.y }
      : lastKnownHiderPosRef.current;

    // ── Predict hider future position ──
    const hiderSteps = 30;
    const hiderPath = simulateBallPath(
      hider.x, hider.y, hider.vx, hider.vy,
      hider.radius, hiderSteps, diffConfig.maxBounces + 1,
    );

    // ── Try candidate launch angles and powers ──
    const angles = 36; // every 10 degrees for better coverage
    const basePowers = [0.5, 0.65, 0.8, 0.9, 1.0];

    let bestScore = Infinity;
    let bestDx = 0, bestDy = 0, bestPower = 0.5;

    for (let ai = 0; ai < angles; ai++) {
      const angle = (ai / angles) * Math.PI * 2;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      for (const p of basePowers) {
        const speed = seekerVMax * p;
        const path = simulateBallPath(
          seeker.x, seeker.y, dirX * speed, dirY * speed,
          SEEKER_RADIUS, 50, diffConfig.maxBounces,
          FRICTION_SEEKER,
        );

        // Score: closest approach to any hider position at similar time
        let minDist = Infinity;
        for (let si = 0; si < path.length; si++) {
          const hi = Math.min(si, hiderPath.length - 1);
          const dist = Math.hypot(path[si].x - hiderPath[hi].x, path[si].y - hiderPath[hi].y);
          if (dist < minDist) minDist = dist;
        }

        // Also factor in direct distance to aim target (last known or visible)
        const directDist = Math.hypot(
          seeker.x + dirX * 100 - aimTarget.x,
          seeker.y + dirY * 100 - aimTarget.y,
        );

        // Power-up collection bonus (hard AI only)
        let orbBonus = 0;
        if (diffConfig.considerOrb && orb.active) {
          for (const pt of path) {
            const dOrb = Math.hypot(pt.x - orb.x, pt.y - orb.y);
            if (dOrb < SEEKER_RADIUS + orb.radius + 10) { orbBonus = -150; break; }
          }
        }

        // Combined score: weight closest approach + direct aim + orb bonus
        const score = minDist * 0.6 + directDist * 0.1 + orbBonus;
        if (score < bestScore) {
          bestScore = score;
          bestDx = dirX;
          bestDy = dirY;
          bestPower = p;
        }
      }
    }

    // ── Apply difficulty error to aim and power ──
    let finalDx = bestDx, finalDy = bestDy;
    let finalPower = bestPower * diffConfig.powerMult;

    // Random angle error based on difficulty
    const angleError = (Math.random() - 0.5) * diffConfig.aimError * Math.PI * 2;
    const cosE = Math.cos(angleError);
    const sinE = Math.sin(angleError);
    const edx = finalDx * cosE - finalDy * sinE;
    const edy = finalDx * sinE + finalDy * cosE;
    const eNorm = Math.hypot(edx, edy);
    if (eNorm > 0) { finalDx = edx / eNorm; finalDy = edy / eNorm; }

    // Random power error proportional to difficulty
    const powerError = diffConfig.aimError;
    finalPower *= (1 + (Math.random() - 0.5) * powerError);
    finalPower = Math.max(0.25, Math.min(1.0, finalPower));

    // ── Execute fling using same launch mechanism as human players ──
    const launchSpeed = seekerVMax * finalPower;
    seeker.vx = finalDx * launchSpeed;
    seeker.vy = finalDy * launchSpeed;

    // Track seeker movement angle for directional fog
    seekerMoveAngleRef.current = Math.atan2(seeker.vy, seeker.vx);

    // Launch spark particles (same as human launch)
    for (let i = 0; i < LAUNCH_SPARKS; i++) {
      particlesRef.current.push({
        x: seeker.x, y: seeker.y,
        vx: -seeker.vx * 0.35 + (Math.random() - 0.5) * 5,
        vy: -seeker.vy * 0.35 + (Math.random() - 0.5) * 5,
        radius: 2.5 + Math.random() * 3.5,
        color: '#ffaa00',
        alpha: 0.9,
        decay: 0.02 + Math.random() * 0.03,
      });
    }
  };

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
    const beamLength = (activeRole === 'seeker' && activePowerUp === 'laser') ? 480 : 180;
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
  const draw = () => {
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
    const orb = orbRef.current;
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
      const normalZoom = Math.max(0.42, Math.min(1.0, (window.innerWidth - 100) / (dBetween + 200)));
      
      // Proximity Tension Zoom: Magnifies significantly as Seeker narrows down onto Hider
      if (dBetween < 420) {
        const proximityRatio = Math.max(0, (420 - dBetween) / 420);
        // Elevate zoom dramatically peaking up to 1.95x when on top of each other!
        targetZoom = normalZoom + proximityRatio * 1.05;
      } else {
        targetZoom = normalZoom;
      }
    } else if (hMoving) {
      targetCamX = hider.x;
      targetCamY = hider.y;
      targetZoom = 1.05;
    } else if (sMoving) {
      targetCamX = seeker.x;
      targetCamY = seeker.y;
      targetZoom = 1.05;
    } else {
      // Resting turn layout: Zoom in heavily if they are close, otherwise normal focus
      const activeObj = activeRole === 'hider' ? hider : seeker;
      targetCamX = activeObj.x;
      targetCamY = activeObj.y;
      
      if (dBetween < 260) {
        targetZoom = 1.55; // Intensified tense focus
      } else {
        targetZoom = 1.15;
      }
    }

    // Sudden death camera override
    if (isSuddenDeath) {
      targetCamX = 600;
      targetCamY = 450;
      targetZoom = 0.72; // Full map override
    }

    // Apply LERP smoothly over coordinates
    cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.08;
    cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.08;
    cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * 0.05;

    const cam = cameraRef.current;

    // Calculate Screen shake random offsets
    let shakeX = 0;
    let shakeY = 0;
    if (shakeAmtRef.current > 0.1) {
      shakeX = (Math.random() - 0.5) * shakeAmtRef.current;
      shakeY = (Math.random() - 0.5) * shakeAmtRef.current;
    }

    // Apply viewport matrices translations with screen shake offset
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x + shakeX, -cam.y + shakeY);

    // --- DRAW MAP FLOOR PATTERN ---
    // Map backgrounds: grid (default), hex, blank
    const mapTheme = activeMapBgRef.current;
    if (mapTheme !== 'blank') {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.032)'; // Softest grid gold
      ctx.lineWidth = 1;

      if (mapTheme === 'grid' || mapTheme === 'default') {
        // Default grid
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
      } else if (mapTheme === 'hex') {
        // Hex pattern
        const r = 30;
        const hexHeight = r * Math.sqrt(3);
        const rows = Math.ceil(mapHeight / hexHeight) + 2;
        const cols = Math.ceil(mapWidth / (r * 1.5)) + 2;
        for (let row = -1; row < rows; row++) {
          for (let col = -1; col < cols; col++) {
            const cx = col * r * 1.5;
            const cy = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * Math.PI * 2;
              const x = cx + r * Math.cos(a);
              const y = cy + r * Math.sin(a);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      }
    }

    // Draw Map Outer Border Walls
    ctx.strokeStyle = '#d97706'; // Rich Sand Gold
    ctx.lineWidth = 12;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(217, 119, 6, 0.25)';
    ctx.strokeRect(0, 0, mapWidth, mapHeight);
    ctx.shadowBlur = 0; // reset

    // --- DRAW TERRAIN HAZARDS ---
    for (const haz of hazards) {
      ctx.beginPath();
      ctx.arc(haz.x, haz.y, haz.radius, 0, Math.PI * 2);
      
      if (haz.type === 'sand') {
        // Sand trap
        ctx.fillStyle = 'rgba(63, 29, 11, 0.32)'; // Sienna deep shade
        ctx.fill();
        ctx.strokeStyle = '#d97706'; // Gold outline
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sand icon
        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⨳', haz.x, haz.y + 5);
      } else if (haz.type === 'ice') {
        // Ice patch
        ctx.fillStyle = 'rgba(186, 230, 253, 0.16)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ice icon
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('❄', haz.x, haz.y + 5);
      }
    }

    // --- DRAW POWER-UP ITEM ORB ---
    if (orb.active && !isSuddenDeath) {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#22d3ee';
      
      // Outer pulse ring
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius * orb.pulseScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner glowing core
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Mini text tag
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#22d3ee';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(orb.type.toUpperCase(), orb.x, orb.y - orb.radius - 8);
      ctx.restore();
    }

    // --- DRAW SECTIONS OF SONAR PING SENSORS ---
    for (const ping of pings) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${ping.alpha})`;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#22d3ee';
      ctx.stroke();
      ctx.restore();
    }

    // --- DRAW NEON STATIC BUMPERS ---
    for (const b of bumpers) {
      ctx.save();
      const currentRadius = b.radius + (b.pulseTimer > 0 ? b.pulseTimer * 0.5 : 0);
      
      // Warm amber base
      ctx.beginPath();
      ctx.arc(b.x, b.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
      ctx.fill();

      // Pulse glows (Sand-Gold/Sienna core indicators)
      ctx.lineWidth = b.pulseTimer > 0 ? 5.5 : 3.5;
      const bumperColor = b.color === '#ff0055' || b.color === '#ff00aa' ? '#ea580c' : '#f59e0b';

      // --- Bumper theme overrides --
      const theme = activeBumperRef.current;
      if (theme === 'dotted') {
        ctx.setLineDash([4, 4]);
      } else if (theme === 'dashed') {
        ctx.setLineDash([8, 3]);
      } else if (theme === 'neon') {
        ctx.shadowBlur = (b.pulseTimer > 0 ? 20 : 14);
        ctx.shadowColor = '#ffffff';
      } else {
        ctx.shadowBlur = b.pulseTimer > 0 ? 14 : 6;
        ctx.shadowColor = bumperColor;
      }

      ctx.strokeStyle = bumperColor;
      ctx.stroke();
      ctx.setLineDash([]); // reset dash

      // Core details
      ctx.beginPath();
      ctx.arc(b.x, b.y, currentRadius * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Static cross indicator
      ctx.beginPath();
      ctx.moveTo(b.x - 8, b.y); ctx.lineTo(b.x + 8, b.y);
      ctx.moveTo(b.x, b.y - 8); ctx.lineTo(b.x, b.y + 8);
      ctx.strokeStyle = bumperColor;
      ctx.stroke();

      ctx.restore();
    }

    // --- DRAW EXPANDING POST-TAG SHOCKWAVE ---
    if (activeShockwaveRef.current && activeShockwaveRef.current.active) {
      const sw = activeShockwaveRef.current;
      const alpha = Math.max(0, 1 - (sw.r / sw.maxR));
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(217, 119, 6, ${alpha})`; // Rich sand-gold ripple
      ctx.lineWidth = 8 * alpha;
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#d97706';
      ctx.stroke();
      ctx.restore();
    }

    // --- HIGH-END TRAILING PATHS ENGINE ---
    // Trail color map
    const TRAIL_COLORS: Record<string, string> = {
      default: '186, 230, 253', // ice (RGB)
      blue: '34, 211, 238',     // cyan
      green: '132, 204, 22',   // lime
      red: '249, 115, 22',     // orange
      purple: '192, 132, 252', // purple
      white: '226, 232, 240',  // white
    };
    const trailRGB = TRAIL_COLORS[activeTrailRef.current] || TRAIL_COLORS.default;

    // Draw Hider Trail
    const hTrail = hiderTrailRef.current;
    if (hTrail.length > 2) {
      ctx.save();
      for (let i = 1; i < hTrail.length; i++) {
        const ratio = i / hTrail.length;
        ctx.beginPath();
        ctx.moveTo(hTrail[i-1].x, hTrail[i-1].y);
        ctx.lineTo(hTrail[i].x, hTrail[i].y);
        ctx.strokeStyle = `rgba(${trailRGB}, ${ratio * 0.45})`;
        ctx.lineWidth = hider.radius * 0.9 * ratio;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Seeker Trail (Molten Amber gold firecomet)
    const sTrail = seekerTrailRef.current;
    if (sTrail.length > 2) {
      ctx.save();
      for (let i = 1; i < sTrail.length; i++) {
        const ratio = i / sTrail.length;
        ctx.beginPath();
        ctx.moveTo(sTrail[i-1].x, sTrail[i-1].y);
        ctx.lineTo(sTrail[i].x, sTrail[i].y);
        ctx.strokeStyle = `rgba(${trailRGB}, ${ratio * 0.65})`; // higher alpha for seeker
        ctx.lineWidth = seeker.radius * 0.95 * ratio;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

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
        ctx.shadowBlur = 5;
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

    // --- DRAW PARTICLES (optimized: reduced shadowBlur) ---
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      // Only apply shadowBlur to larger/important particles
      if (p.type === 'spark' && p.radius > 3) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
      } else {
        ctx.shadowBlur = 0;
      }

      if ((p.type === 'debris' || p.type === 'glass') && p.angle !== undefined) {
        // Render 3D irregular rotating shards (Rocket League particle shards!)
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        if (p.type === 'glass') {
          // Sharp glass lance shard
          ctx.moveTo(-p.radius, 0);
          ctx.lineTo(0, -p.radius * 1.6);
          ctx.lineTo(p.radius, 0);
          ctx.lineTo(0, p.radius * 0.9);
        } else {
          // Chunk heavy polygon slab debris
          ctx.moveTo(-p.radius, -p.radius * 0.6);
          ctx.lineTo(p.radius * 0.8, -p.radius * 1.3);
          ctx.lineTo(p.radius, p.radius);
          ctx.lineTo(-p.radius * 0.6, p.radius * 0.8);
        }
        ctx.closePath();
        ctx.fill();

        // High gloss 3D light highlight reflection strip
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-p.radius * 0.4, 0);
        ctx.lineTo(p.radius * 0.4, 0);
        ctx.stroke();

      } else {
        // Fast dynamic circular sparks
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.restore();
    }

    // --- SKIN COLOR MAP ---
    const SKIN_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
      default: { fill: '#f8fafc', stroke: '#38bdf8', glow: '#38bdf8' },
      blue: { fill: '#3b82f6', stroke: '#1d4ed8', glow: '#3b82f6' },
      green: { fill: '#10b981', stroke: '#059669', glow: '#10b981' },
      red: { fill: '#ef4444', stroke: '#dc2626', glow: '#ef4444' },
      purple: { fill: '#a855f7', stroke: '#9333ea', glow: '#a855f7' },
      pink: { fill: '#ec4899', stroke: '#db2777', glow: '#ec4899' },
    };
    const hColor = SKIN_COLORS[activeSkinRef.current] || SKIN_COLORS.default;
    const sColor = SKIN_COLORS[activeSkinRef.current] || SKIN_COLORS.default;

    // On mobile, scale up ball rendering so they're visible on small screens
    const mobileRadiusScale = isMobile ? 1.8 : 1;

    // --- DRAW HIDER BALL --
    // Rule: Hide if distance is greater than 350px and not Seeker active Radar, and turn === seeker
    // Cloak power-up: hider is always hidden regardless of distance
    const shroudDistance = Math.hypot(hider.x - seeker.x, hider.y - seeker.y);
    const isCloaked = cloakTimerRef.current > 0;
    const shroudEnabled = (shroudDistance > FOG_RADIUS || isCloaked) && activeRole === 'seeker' && !isSuddenDeath && (activePowerUp !== 'sonar');

    if (!shroudEnabled && !hiderExplodedRef.current) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(hider.x, hider.y, hider.radius * mobileRadiusScale, 0, Math.PI * 2);
      ctx.fillStyle = hColor.fill;
      ctx.fill();
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = hColor.stroke;
      ctx.shadowBlur = 10;
      ctx.shadowColor = hColor.glow;
      ctx.stroke();

      // Mini hider letter
      ctx.shadowBlur = 0;
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#0f172a'; // slate dark
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', hider.x, hider.y);

      // Colorblind shape overlay — square for Hider
      if (config.colorblindMode) {
        const s = hider.radius * 0.7 * mobileRadiusScale;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(hider.x - s, hider.y - s, s * 2, s * 2);
      }

      // Turn halo marker ring if Hider's turn
      if (activeRole === 'hider' && !ballsMoving) {
        ctx.beginPath();
        ctx.arc(hider.x, hider.y, (hider.radius + 12) * mobileRadiusScale, 0, Math.PI * 2);
        ctx.strokeStyle = hColor.stroke;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- DRAW SEEKER BALL ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(seeker.x, seeker.y, seeker.radius * mobileRadiusScale, 0, Math.PI * 2);
    ctx.fillStyle = sColor.fill;
    ctx.fill();
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = sColor.stroke;
    ctx.shadowBlur = 18;
    ctx.shadowColor = sColor.glow;
    ctx.stroke();

    // Text "S" inside
    ctx.shadowBlur = 0;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', seeker.x, seeker.y);

    // Colorblind shape overlay — triangle for Seeker
    if (config.colorblindMode) {
      const s = seeker.radius * 0.7 * mobileRadiusScale;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(seeker.x, seeker.y - s);
      ctx.lineTo(seeker.x + s, seeker.y + s * 0.7);
      ctx.lineTo(seeker.x - s, seeker.y + s * 0.7);
      ctx.closePath();
      ctx.stroke();
    }

    // Turn halo indicator
    if (activeRole === 'seeker' && !ballsMoving) {
      ctx.beginPath();
      ctx.arc(seeker.x, seeker.y, (seeker.radius + 12) * mobileRadiusScale, 0, Math.PI * 2);
      ctx.strokeStyle = sColor.stroke;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
    }

    // AI thinking indicator — pulsing ellipsis above seeker ball
    if (config.isCpu && activeRole === 'seeker' && cpuThinkingRef.current && !ballsMoving) {
      ctx.setLineDash([]);
      const pulsePhase = performance.now() * 0.005;
      const dotCount = 3;
      const dotRadius = 3;
      const dotSpacing = 8;
      const totalW = (dotCount - 1) * dotSpacing;
      const baseY = seeker.y - seeker.radius - 20;
      for (let d = 0; d < dotCount; d++) {
        const offset = Math.sin(pulsePhase + d * 0.8) * 2;
        ctx.beginPath();
        ctx.arc(seeker.x - totalW / 2 + d * dotSpacing, baseY + offset, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${0.5 + Math.sin(pulsePhase + d * 0.8) * 0.5})`;
        ctx.fill();
      }
    }
    ctx.restore();

    // --- DRAW FOG OF WAR SHROUD (directional cone reveal) ---
    if (activeRole === 'seeker' && !isSuddenDeath && activePowerUp !== 'sonar') {
      ctx.save();

      ctx.fillStyle = 'rgba(6, 8, 12, 0.95)';

      // Draw full-map dark overlay
      ctx.beginPath();
      ctx.rect(0, 0, mapWidth, mapHeight);

      // Cut out a directional cone (wide arc) in the seeker's last movement direction
      // plus a small circle around the seeker for close-range vision
      const coneAngle = Math.PI * 0.6; // ~108° cone
      const coneRadius = FOG_RADIUS * 1.3; // cone extends slightly further
      const closeRadius = FOG_RADIUS * 0.4; // small close-range circle

      const sx = seeker.x;
      const sy = seeker.y;
      const sa = seekerMoveAngleRef.current;

      // Cone path
      ctx.moveTo(sx, sy);
      ctx.arc(sx, sy, coneRadius, sa - coneAngle / 2, sa + coneAngle / 2);
      ctx.closePath();

      // Close-range circle
      ctx.moveTo(sx + closeRadius, sy);
      ctx.arc(sx, sy, closeRadius, 0, Math.PI * 2, true);

      ctx.fill();

      // Draw faint boundary lines
      ctx.beginPath();
      // Cone edges
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(sa - coneAngle / 2) * coneRadius, sy + Math.sin(sa - coneAngle / 2) * coneRadius);
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(sa + coneAngle / 2) * coneRadius, sy + Math.sin(sa + coneAngle / 2) * coneRadius);
      // Cone arc
      ctx.moveTo(sx + Math.cos(sa - coneAngle / 2) * coneRadius, sy + Math.sin(sa - coneAngle / 2) * coneRadius);
      ctx.arc(sx, sy, coneRadius, sa - coneAngle / 2, sa + coneAngle / 2);
      // Close-range circle
      ctx.moveTo(sx + closeRadius, sy);
      ctx.arc(sx, sy, closeRadius, 0, Math.PI * 2);

      ctx.strokeStyle = 'rgba(217, 119, 6, 0.22)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }

    // --- DRAW MINIMAP ---
    drawMinimap();

    ctx.restore(); // Restore camera matrices scales
  };

  // --- Minimap drawing ---
  const drawMinimap = () => {
    const mc = minimapRef.current;
    if (!mc) return;
    const mctx = mc.getContext('2d');
    if (!mctx) return;

    const mw = mc.width;
    const mh = mc.height;
    const scaleX = mw / mapWidth;
    const scaleY = mh / mapHeight;

    // Clear
    mctx.clearRect(0, 0, mw, mh);

    // Background
    mctx.fillStyle = 'rgba(6, 8, 12, 0.85)';
    mctx.fillRect(0, 0, mw, mh);

    // Border
    mctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
    mctx.lineWidth = 1;
    mctx.strokeRect(0, 0, mw, mh);

    // Hazards
    for (const h of hazards) {
      mctx.beginPath();
      mctx.arc(h.x * scaleX, h.y * scaleY, h.radius * scaleX, 0, Math.PI * 2);
      mctx.fillStyle = h.type === 'sand' ? 'rgba(217, 119, 6, 0.25)' : 'rgba(34, 211, 238, 0.2)';
      mctx.fill();
    }

    // Bumpers
    for (const b of bumpers) {
      mctx.beginPath();
      mctx.arc(b.x * scaleX, b.y * scaleY, b.radius * scaleX, 0, Math.PI * 2);
      mctx.fillStyle = 'rgba(217, 119, 6, 0.5)';
      mctx.fill();
    }

    // Orb
    if (orbRef.current.active) {
      mctx.beginPath();
      mctx.arc(orbRef.current.x * scaleX, orbRef.current.y * scaleY, 3, 0, Math.PI * 2);
      mctx.fillStyle = '#22d3ee';
      mctx.fill();
    }

    // Hider (always show on minimap)
    const hider = hiderBallRef.current;
    mctx.beginPath();
    mctx.arc(hider.x * scaleX, hider.y * scaleY, 3, 0, Math.PI * 2);
    mctx.fillStyle = '#38bdf8';
    mctx.fill();

    // Seeker
    const seeker = seekerBallRef.current;
    mctx.beginPath();
    mctx.arc(seeker.x * scaleX, seeker.y * scaleY, 3, 0, Math.PI * 2);
    mctx.fillStyle = '#d97706';
    mctx.fill();
  };

  // --- Helpers for Ice & coordination labelings ---
  const ixCoord = (x: number) => x;
  const iyCoord = (y: number) => y;

  // --- TOUCH / MOUSE CONTROLS MAPPINGS ---
  const handleStart = (clientX: number, clientY: number) => {
    if (ballsMoving || phase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Transform viewport screen click coordinates to map space coordinates
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    // Convert to target coordinates with scale translation
    // Mouse coords: (sx, sy). We need to transform these using current camera scale/zoom
    const cam = cameraRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    // Inverse matrix formulas:
    // (sx - cw/2) / zoom + cam.x = mapX
    const mapX = (sx - cw / 2) / cam.zoom + cam.x;
    const mapY = (sy - ch / 2) / cam.zoom + cam.y;

    const activeBall = activeRole === 'hider' ? hiderBallRef.current : seekerBallRef.current;
    const dist = Math.hypot(mapX - activeBall.x, mapY - activeBall.y);

    // Increase touch target bounding circle offset slightly for mobile ease
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

    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    const cam = cameraRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    const mapX = (sx - cw / 2) / cam.zoom + cam.x;
    const mapY = (sy - ch / 2) / cam.zoom + cam.y;

    dragCurrentRef.current = { x: mapX, y: mapY };
  };

  const handleEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Trigger sling fling launch!
    const activeBall = activeRole === 'hider' ? hiderBallRef.current : seekerBallRef.current;
    
    // Drag opposite direction vector formula
    const dx = activeBall.x - dragCurrentRef.current.x;
    const dy = activeBall.y - dragCurrentRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist < MIN_DRAG_DIST) return; // ignore static tiny drags to avoid false releases

    const maxDragVec = MAX_DRAG;
    const dragPower = Math.min(1.0, dist / maxDragVec);

    // Max speeds limit. Seeker receives +50% velocity boost
    const baseVMax = HIDER_BASE_SPEED;
    const seekerVMax = baseVMax * SEEKER_SPEED_MULT;
    let currentLimit = activeRole === 'seeker' ? seekerVMax : baseVMax;

    // Laser power-up: +20% launch speed
    if (activePowerUp === 'laser') {
      currentLimit *= LASER_SPEED_MULT;
    }

    const launchSpeed = currentLimit * dragPower;

    // Apply impulse physics
    activeBall.vx = (dx / dist) * launchSpeed;
    activeBall.vy = (dy / dist) * launchSpeed;

    // Track seeker movement angle for directional fog
    if (activeRole === 'seeker') {
      seekerMoveAngleRef.current = Math.atan2(activeBall.vy, activeBall.vx);
    }

    // Launch sparks particle
    for (let i = 0; i < LAUNCH_SPARKS; i++) {
      particlesRef.current.push({
        x: activeBall.x,
        y: activeBall.y,
        vx: -activeBall.vx * 0.35 + (Math.random() - 0.5) * 5,
        vy: -activeBall.vy * 0.35 + (Math.random() - 0.5) * 5,
        radius: 2.5 + Math.random() * 3.5,
        color: activeRole === 'seeker' ? '#ffaa00' : '#ffffff',
        alpha: 0.9,
        decay: 0.02 + Math.random() * 0.03,
      });
    }
  };

  // Resize listener with high-DPI support
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.parentElement?.clientWidth || window.innerWidth;
      const h = canvas.parentElement?.clientHeight || (window.innerHeight - 80);
      // Set CSS dimensions so layout fills the viewport
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      // Backing store matches CSS pixels (no DPR multiply — we handle DPR via setTransform)
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // initial set
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative flex flex-col h-screen select-none overflow-hidden bg-[#020502]">
      
      {/* Top Banner HUD display */}
      <div className="w-full bg-neutral-950/80 backdrop-blur-md border-b border-emerald-500/25 px-4 py-3 flex justify-between items-center z-10 font-mono text-[11px] h-14 shrink-0 shadow-lg">
        
        {/* Left Side: Game details */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-zinc-500 text-[9px] uppercase tracking-wider">Round</span>
            <span className="text-white font-sans font-bold uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Swords className="w-4 h-4 text-emerald-400" /> {currentRound + 1}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-zinc-500 text-[9px] uppercase tracking-wider">Score</span>
            <span className="text-emerald-400 font-sans font-black text-sm tracking-widest leading-none">
              {turnsSurvived}
            </span>
          </div>
        </div>

        {/* Center: Turn indicator */}
        <div className="flex items-center gap-2">
          {isSuddenDeath ? (
            <div className="px-3 py-1 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-lg text-fuchsia-400 font-black animate-pulse leading-none text-[10px] tracking-widest uppercase">
              Sudden Death
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-black/60 border border-emerald-500/10 rounded-full px-3 py-1">
              <span className="text-zinc-500 text-[9px] uppercase mr-1">Turn:</span>
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

        {/* Right: Power-up badge */}
        <div className="flex items-center gap-2">
          {activePowerUp && (
            <div className={`px-2.5 py-1 rounded border leading-none text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${
              activePowerUp === 'laser' ? 'bg-blue-950/20 text-blue-400 border-blue-500/20' :
              activePowerUp === 'superball' ? 'bg-fuchsia-950/20 text-fuchsia-400 border-fuchsia-500/20' :
              activePowerUp === 'iron' ? 'bg-yellow-950/20 text-yellow-400 border-yellow-500/20' :
              activePowerUp === 'cloak' ? 'bg-gray-950/30 text-gray-300 border-gray-500/20' :
              activePowerUp === 'magnet' ? 'bg-red-950/20 text-red-400 border-red-500/20' :
              'bg-purple-950/30 text-purple-400 border-purple-500/20'
            }`}>
              <Zap className="w-3 h-3 fill-current" /> {activePowerUp === 'laser' ? 'Laser' : activePowerUp === 'superball' ? 'Super' : activePowerUp === 'iron' ? 'Iron' : activePowerUp === 'cloak' ? 'Cloak' : activePowerUp === 'magnet' ? 'Magnet' : activePowerUp}
            </div>
          )}

          {/* Minimap */}
          <canvas
            ref={minimapRef}
            width={120}
            height={90}
            className="rounded border border-amber-500/20 shrink-0"
            style={{ imageRendering: 'pixelated' }}
          />

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

      {/* Aim instruction */}
      {!ballsMoving && !aiThinking && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-neutral-950/90 border border-white/5 rounded-full text-[10px] text-zinc-400 font-mono tracking-widest shadow-xl pointer-events-none flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
          Drag back to aim, release to launch
        </div>
      )}

      {/* CPU Thinking Overlay */}
      {aiThinking && config.isCpu && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 px-5 py-3 bg-emerald-950/40 border border-emerald-500/30 rounded-full text-xs text-emerald-400 font-mono font-bold tracking-widest shadow-xl shadow-emerald-500/10 pointer-events-none flex items-center gap-3 animate-pulse">
          <Cpu className="w-4 h-4 text-emerald-400" />
          CPU thinking...
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
            e.preventDefault();
            if (e.touches.length > 0) {
              handleStart(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
              handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleEnd();
          }}
          className="block w-full h-full cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
}
