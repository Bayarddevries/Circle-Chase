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
  FOG_ALPHA,
  FOG_EDGE_ALPHA,
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
  CLOAK_DURATION,
  MAGNET_DURATION,
  MAGNET_PULL_STRENGTH,
  LASER_SPEED_MULT,
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

interface GameCanvasProps {
  phase: GamePhase;
  config: MatchConfig;
  currentRound: number;
  isSuddenDeath: boolean;
  onRoundComplete: (turns: number, suddenDeathWinnerRole?: PlayerRole) => void;
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
    powerUpCollected: false,
    bumperHits: 0,
    tagTurn: 0,
  });
  const currentTurnNumberRef = useRef<number>(0); // which turn we're on (for quick tag detection)
  const totalDistanceRef = useRef<number>(0);       // accumulated distance for avg
  const distanceSamplesRef = useRef<number>(0);     // number of distance samples
  const minDistanceRef = useRef<number>(Infinity);  // closest approach this seeker turn
  const comboCountRef = useRef<number>(0);          // consecutive bumper hits
  const nearMissTriggeredRef = useRef<boolean>(false);

  // Game state parameters
  const [activeRole, setActiveRole] = useState<PlayerRole>('hider');
  const [turnsSurvived, setTurnsSurvived] = useState<number>(0);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpDuration, setPowerUpDuration] = useState<number>(0); // consumed after 1 shot
  
  // Floating status message
  const [floatMessage, setFloatMessage] = useState<string | null>(null);
  const [floatTimer, setFloatTimer] = useState<number>(0);

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

  // Controls lock during active flings
  const [ballsMoving, setBallsMoving] = useState<boolean>(false);

  // Run procedural map generator when a round shifts
  const generateMap = () => {
    // Reset player position coordinates cleared of starting boundaries
    hiderBallRef.current = {
      x: isSuddenDeath ? 300 : 450,
      y: isSuddenDeath ? 450 : 750,
      vx: 0,
      vy: 0,
      radius: ORB_RADIUS,
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
      let bx = BUMPER_SPAWN_CLEAR/2 + Math.random() * (mapWidth - BUMPER_SPAWN_CLEAR);
      let by = BUMPER_SPAWN_CLEAR/2 + Math.random() * (mapHeight - BUMPER_SPAWN_CLEAR);
      
      // Bias early bumper placements near center-corridor so they show in starting views
      if (tries < 40 && newBumpers.length < 3) {
        bx = (mapWidth / 2) + (Math.random() - 0.5) * (mapWidth * 0.42);
        by = (mapHeight / 2) + (Math.random() - 0.5) * (mapHeight * 0.42);
      }
      
      // Clear from players spawns
      const distH = Math.hypot(bx - hiderBallRef.current.x, by - hiderBallRef.current.y);
      const distS = Math.hypot(bx - seekerBallRef.current.x, by - seekerBallRef.current.y);
      
      if (distH < BUMPER_SPAWN_CLEAR || distS < BUMPER_SPAWN_CLEAR) continue;

      // Avoid bunching together
      let tooClose = false;
      for (const b of newBumpers) {
        if (Math.hypot(bx - b.x, by - b.y) < BUMPER_MIN_SEP) tooClose = true;
      }
      if (tooClose) continue;

      newBumpers.push({
        id: `bumper-${newBumpers.length}`,
        x: bx,
        y: by,
        radius: BUMPER_MIN_RADIUS + Math.random() * BUMPER_RADIUS_VAR,
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
        const sx = HAZARD_SPAWN_CLEAR/2 + Math.random() * (mapWidth - HAZARD_SPAWN_CLEAR);
        const sy = HAZARD_SPAWN_CLEAR/2 + Math.random() * (mapHeight - HAZARD_SPAWN_CLEAR);
        
        const distH = Math.hypot(sx - hiderBallRef.current.x, sy - hiderBallRef.current.y);
        const distS = Math.hypot(sx - seekerBallRef.current.x, sy - seekerBallRef.current.y);
        if (distH < HAZARD_SPAWN_CLEAR || distS < HAZARD_SPAWN_CLEAR) continue;

        let overlap = false;
        for (const b of bumpersRef.current) {
          if (Math.hypot(sx - b.x, sy - b.y) < b.radius + HAZARD_BUMPER_CLEAR) overlap = true;
        }
        for (const h of newHazards) {
          if (Math.hypot(sx - h.x, sy - h.y) < HAZARD_MIN_SEP) overlap = true;
        }
        if (overlap) continue;

        newHazards.push({
          id: `sand-${sandCount}`,
          x: sx,
          y: sy,
          radius: SAND_MIN_RADIUS + Math.random() * SAND_RADIUS_VAR,
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
        if (distH < HAZARD_SPAWN_CLEAR || distS < HAZARD_SPAWN_CLEAR) continue;

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
          radius: ICE_MIN_RADIUS + Math.random() * ICE_RADIUS_VAR,
          type: 'ice',
        });
        iceCount++;
      }
    }

    hazardsRef.current = newHazards;

    // Power-Up Orb location (randomized middle-zone position)
    if (!isSuddenDeath) {
      const ox = (mapWidth / 2) - 150 + Math.random() * 300;
      const oy = (mapHeight / 2) - 150 + Math.random() * 300;
      
      const pTypes: PowerUpType[] = ['laser', 'superball', 'iron', 'sonar'];
      const randomType = pTypes[Math.floor(Math.random() * pTypes.length)];

      orbRef.current = {
        x: ox,
        y: oy,
        radius: ORB_RADIUS,
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

  // Core Game Loop
  useEffect(() => {
    if (phase !== 'playing') return;

    let animFrame: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = Math.min(DELTA_CAP, time - lastTime);
      lastTime = time;

      // Update positions & physics with substepping
      physicsStep(time);

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

      const subStepsCount = SUBSTEPS;
      const speedScale = slowMotionRef.current;

      for (let s = 0; s < subStepsCount; s++) {
        // Move players by 1/5th increment scaled by current slow-motion factor
        hider.x += (hider.vx / subStepsCount) * speedScale;
        hider.y += (hider.vy / subStepsCount) * speedScale;

        seeker.x += (seeker.vx / subStepsCount) * speedScale;
        seeker.y += (seeker.vy / subStepsCount) * speedScale;

        // --- Boundary collisions & clamp updates ---
        // Normal border restitution = 0.60
        // If Seeker has Superball powerup, Seeker gets 1.0 bounciness off border walls
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
                // Base bumper restitution = 1.40
                // If seeker has superball active, bounciness is 2x!
                let e = BUMPER_REST;
                if (isSeeker && activePowerUp === 'superball') {
                  e = BUMPER_REST_SUPERBALL;
                }
                
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
                b.pulseTimer = BUMPER_PULSE_DURATION;
                shakeAmtRef.current = Math.min(shakeAmtRef.current + SHAKE_BUMPER_ADD, SHAKE_MAX);

                // Create bumper spark particles
                particlesRef.current.push(...spawnBumperParticles(b.x, b.y, b.radius, nx, ny, b.color));
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
            // Absorb powerup
            setActivePowerUp(orb.type);
            setPowerUpDuration(1); // 1 active shot
            
            const titles: Record<PowerUpType, string> = {
              laser: 'Laser Sight Opt-In!',
              superball: 'Superball Rebound Activator!',
              iron: 'Iron Ball Anti-Sand Mass!',
              sonar: 'Sonar Pulse Radar Activated!',
              cloak: 'Cloak Invisibility Active!',
              magnet: 'Magnet Pull Engaged!',
            };
            setFloatMessage(`PERK ACQUIRED: ${titles[orb.type].toUpperCase()}`);

            // Spawn bright orb collect particles
            particlesRef.current.push(...spawnOrbParticles(orb.x, orb.y));
          }
        }
      }

      // --- Apply Friction deceleration (once per frame, after substepping) ---
      const applyFriction = (ball: PlayerBall, isSeeker: boolean) => {
        // Base friction deceleration rates
        // Seeker receives a -15% less friction boost
        let baseFriction = FRICTION_BASE;
        if (isSeeker) {
          baseFriction = FRICTION_SEEKER;
        }

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
          // Sand trap slow penalty: EXTRA 8% reduction.
          // Unless seeker has the Iron Ball powerup active!
          // Sand trap does not slow down balls during slow-motion rocket league explosions
          if (slowMotionRef.current < 1.0) {
            ball.vx *= baseFriction;
            ball.vy *= baseFriction;
          } else if (isSeeker && activePowerUp === 'iron') {
            // Iron ball travels unaffected! Draw trails
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
            // Unprotected slow
            ball.vx *= baseFriction * FRICTION_SAND_MULT;
            ball.vy *= baseFriction * FRICTION_SAND_MULT;
          }
        } else if (enteredIce) {
          // Ice patches reduces velocity by only 1% per frame, bypassing base floor
          ball.vx *= FRICTION_ICE;
          ball.vy *= FRICTION_ICE;
        } else {
          // Standard felt deceleration
          ball.vx *= baseFriction;
          ball.vy *= baseFriction;
        }

        // Stop completely if extremely slow to toggle next turn, except during active tags
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
      updateParticles(particlesRef.current, slowMotionRef.current, mapWidth, mapHeight);

      // Update sonar pings
      updateSonarPings(sonarPingsRef.current);
      lastPingTimeRef.current = maybeSpawnSonarPing(
        sonarPingsRef.current,
        lastPingTimeRef.current,
        performance.now(),
        hider.x, hider.y,
        seeker.x, seeker.y,
        activeRole,
        isSuddenDeath,
      );

      // Update bumper pulse glows
      for (const b of bumpers) {
        if (b.pulseTimer > 0) b.pulseTimer--;
      }

      // Update orb pulse float scale
      if (orb.active) {
        orb.pulseScale = 1 + Math.sin(time * ORB_PULSE_SPEED) * ORB_PULSE_AMP;
      }

      // --- Accumulate path tracking trails (once per physics frame) ---
      const hTrailSpeed = Math.hypot(hider.vx, hider.vy);
      const sTrailSpeed = Math.hypot(seeker.vx, seeker.vy);

      if (hTrailSpeed > TRAIL_MIN_SPEED) {
        hiderTrailRef.current.push({ x: hider.x, y: hider.y });
        if (hiderTrailRef.current.length > TRAIL_MAX_POINTS) hiderTrailRef.current.shift();
      } else {
        if (hiderTrailRef.current.length > 0) hiderTrailRef.current.shift();
      }

      if (sTrailSpeed > TRAIL_MIN_SPEED) {
        seekerTrailRef.current.push({ x: seeker.x, y: seeker.y });
        if (seekerTrailRef.current.length > TRAIL_MAX_POINTS) seekerTrailRef.current.shift();
      } else {
        if (seekerTrailRef.current.length > 0) seekerTrailRef.current.shift();
      }

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
        
        if (isSuddenDeath) {
          onRoundComplete(turnsSurvived, 'seeker');
        } else {
          onRoundComplete(turnsSurvived);
        }
      }, TAG_FREEZE_TIME);
    };

    animFrame = requestAnimationFrame(loop);
    return () => {
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

        // Drawn sand slowdown label text
        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SAND SLOWDOWN', haz.x, haz.y);
      } else if (haz.type === 'ice') {
        // Ice patch
        ctx.fillStyle = 'rgba(186, 230, 253, 0.16)'; // Frosty Silver Blue
        ctx.fill();
        ctx.strokeStyle = '#38bdf8'; // Sky light outline
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ICE GLIDE', haz.x, haz.y);
      }
    }

    // --- DRAW POWER-UP ITEM ORB ---
    if (orb.active && !isSuddenDeath) {
      ctx.save();
      ctx.shadowBlur = 16;
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

    // --- DRAW SONAR PINGS ---
    drawSonarPings(ctx, pings);

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
      ctx.strokeStyle = bumperColor;
      ctx.shadowBlur = b.pulseTimer > 0 ? 25 : 12;
      ctx.shadowColor = bumperColor;
      ctx.stroke();

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
    // Draw Hider Trail (Sky/Cyan Platinum stardust)
    const hTrail = hiderTrailRef.current;
    if (hTrail.length > 2) {
      ctx.save();
      for (let i = 1; i < hTrail.length; i++) {
        const ratio = i / hTrail.length;
        ctx.beginPath();
        ctx.moveTo(hTrail[i-1].x, hTrail[i-1].y);
        ctx.lineTo(hTrail[i].x, hTrail[i].y);
        ctx.strokeStyle = `rgba(186, 230, 253, ${ratio * 0.45})`; // ice path glow
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
        ctx.strokeStyle = `rgba(217, 119, 6, ${ratio * 0.65})`; // sand-gold comet
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

    // --- DRAW HIDER BALL (Radiant White/Cyan Glow) ---
    // Rule: Hide if distance is greater than 350px and not Seeker active Radar, and turn === seeker
    const shroudDistance = Math.hypot(hider.x - seeker.x, hider.y - seeker.y);
    const shroudEnabled = shroudDistance > FOG_RADIUS && activeRole === 'seeker' && !isSuddenDeath && (activePowerUp !== 'sonar');

    if (!shroudEnabled && !hiderExplodedRef.current) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(hider.x, hider.y, hider.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc'; // Pearl Silver-White
      ctx.fill();
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#38bdf8'; // Cyan glowing outline
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#38bdf8';
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
        const s = hider.radius * 0.7;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(hider.x - s, hider.y - s, s * 2, s * 2);
      }

      // Turn halo marker ring if Hider's turn
      if (activeRole === 'hider' && !ballsMoving) {
        ctx.beginPath();
        ctx.arc(hider.x, hider.y, hider.radius + 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- DRAW SEEKER BALL (Molten Gold and Copper) ---
    ctx.save();

    // Colorblind shape overlay — triangle for Seeker
    if (config.colorblindMode) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const sxCoord = seeker.x + Math.cos(angle) * (seeker.radius + 6.5);
        const syCoord = seeker.y + Math.sin(angle) * (seeker.radius + 6.5);
        if (i === 0) {
          ctx.moveTo(sxCoord, syCoord);
        } else {
          ctx.lineTo(sxCoord, syCoord);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#d97706';
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(seeker.x, seeker.y, seeker.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#d97706'; // Rich Amber Gold
    ctx.fill();
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#ea580c'; // Solar orange rim
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#d97706';
    ctx.stroke();

    // Text "S" inside
    ctx.shadowBlur = 0;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', seeker.x, seeker.y);

    // Turn halo indicator
    if (activeRole === 'seeker' && !ballsMoving) {
      ctx.beginPath();
      ctx.arc(seeker.x, seeker.y, seeker.radius + 12, 0, Math.PI * 2);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
    }
    ctx.restore();

    // --- DRAW FOG OF WAR SHROUD (Premium compositing effect) ---
    if (activeRole === 'seeker' && !isSuddenDeath && activePowerUp !== 'sonar') {
      ctx.save();
      
      // Let's create an offscreen backing layer manually inside canvas context state to avoid clearing grid lines!
      // 1. Draw solid dark overlay everywhere except inside Seeker visual center
      ctx.fillStyle = `rgba(6, 8, 12, ${FOG_ALPHA})`;
      
      ctx.beginPath();
      // Outer rect
      ctx.rect(0, 0, mapWidth, mapHeight);
      // Inner circle (opposite direction to subtract)
      const revealRadius = 350;
      ctx.arc(seeker.x, seeker.y, revealRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill(); // Paints everywhere except the circle!

      // Draw faint boundary line around the Fog of War threshold
      ctx.beginPath();
      ctx.arc(seeker.x, seeker.y, revealRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(217, 119, 6, ${FOG_EDGE_ALPHA})`;
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    }

    restoreCameraTransform(ctx); // Restore camera matrices

    // ==========================================
    // --- DRAW HUD TACTICAL MINIMAP OVERLAY ---
    // ==========================================
    ctx.save();
    
    // Position minimap at the top-right corner of the canvas viewport
    const miniW = 190;
    const miniH = 142; // maintaining golden aspect ratio (~4:3 match for standard 2000x1500 layout)
    const padding = 16;
    const miniX = w - miniW - padding;
    const miniY = padding;

    // 1. Semi-translucent cyber background card
    ctx.fillStyle = 'rgba(7, 10, 15, 0.78)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; // Glowing teal frame border
    ctx.lineWidth = 1.8;
    
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(miniX, miniY, miniW, miniH, 12);
    } else {
      ctx.rect(miniX, miniY, miniW, miniH);
    }
    ctx.fill();
    ctx.stroke();

    // 2. Map projection scale factors
    const scaleX = miniW / mapWidth;
    const scaleY = miniH / mapHeight;
    const mapToMiniX = (mx: number) => miniX + mx * scaleX;
    const mapToMiniY = (my: number) => miniY + my * scaleY;

    // 3. Draw grid inside the minimap
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.lineWidth = 0.8;
    const miniGridSize = 200 * scaleX; // larger step size
    for (let gx = miniX; gx < miniX + miniW; gx += miniGridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, miniY);
      ctx.lineTo(gx, miniY + miniH);
      ctx.stroke();
    }
    for (let gy = miniY; gy < miniY + miniH; gy += miniGridSize) {
      ctx.beginPath();
      ctx.moveTo(miniX, gy);
      ctx.lineTo(miniX + miniW, gy);
      ctx.stroke();
    }

    // 4. Draw terrain hazard zones
    for (const haz of hazards) {
      const hx = mapToMiniX(haz.x);
      const hy = mapToMiniY(haz.y);
      const hr = haz.radius * scaleX;
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fillStyle = haz.type === 'sand' ? 'rgba(217, 119, 6, 0.16)' : 'rgba(56, 189, 248, 0.14)';
      ctx.fill();
    }

    // 5. Draw interactive bumpers
    for (const bump of bumpers) {
      const bx = mapToMiniX(bump.x);
      const by = mapToMiniY(bump.y);
      const br = bump.radius * scaleX;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.fill();
    }

    // 6. Draw active power-up orb
    if (orb && orb.active && !isSuddenDeath) {
      const ox = mapToMiniX(orb.x);
      const oy = mapToMiniY(orb.y);
      ctx.beginPath();
      ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee'; // luminous cyan
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#22d3ee';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 7. Draw Player Seeker (Vivid Orange Triangle)
    const sx = mapToMiniX(seeker.x);
    const sy = mapToMiniY(seeker.y);
    
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
      const tx = sx + Math.cos(angle) * 5.5;
      const ty = sy + Math.sin(angle) * 5.5;
      if (i === 0) {
        ctx.moveTo(tx, ty);
      } else {
        ctx.lineTo(tx, ty);
      }
    }
    ctx.closePath();
    ctx.fillStyle = '#f97316';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 8. Draw Player Hider (Radiant Circle - hidden if shroud is active)
    if (!shroudEnabled && !hiderExplodedRef.current) {
      const hx = mapToMiniX(hider.x);
      const hy = mapToMiniY(hider.y);
      ctx.beginPath();
      ctx.arc(hx, hy, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // 9. Render Holographic Monospace Details & HUD Status
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('TACTICAL RADAR', miniX + 10, miniY + 10);

    // Live blink turn status light
    ctx.beginPath();
    const indX = miniX + miniW - 12;
    const indY = miniY + 14;
    ctx.arc(indX, indY, 3, 0, Math.PI * 2);
    ctx.fillStyle = activeRole === 'hider' ? '#38bdf8' : '#f97316';
    ctx.fill();

    ctx.restore();
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
    <div className="relative flex flex-col h-screen select-none overflow-hidden bg-[#020502]">
      
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

        {/* Right Side: Active power-up badge item */}
        <div className="flex items-center gap-2">
          {activePowerUp && (
            <div className={`px-2.5 py-1 rounded border leading-none text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${
              activePowerUp === 'laser' ? 'bg-blue-950/20 text-blue-400 border-blue-500/20' :
              activePowerUp === 'superball' ? 'bg-fuchsia-950/20 text-fuchsia-400 border-fuchsia-500/20' :
              activePowerUp === 'iron' ? 'bg-yellow-950/20 text-yellow-400 border-yellow-500/20' :
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
