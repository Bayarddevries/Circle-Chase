/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Centralized game constants for Circle Chase.
 * All magic numbers live here so tuning is one place.
 */

// ── Map ──────────────────────────────────────────────
export const MAP_WIDTH = 2000;
export const MAP_HEIGHT = 1500;
export const SD_MAP_WIDTH = 1200;
export const SD_MAP_HEIGHT = 900;

// ── Player balls ─────────────────────────────────────
export const HIDER_RADIUS = 20;
export const SEEKER_RADIUS = 24;
export const HIDER_BASE_SPEED = 15;
export const SEEKER_SPEED_MULT = 1.5;            // +50% vs Hider
export const SEEKER_FRICTION_BONUS = 0.0035;     // Seeker friction = base + this

// ── Physics ──────────────────────────────────────────
export const SUBSTEPS = 5;
export const DELTA_CAP = 25;                     // ms, max frame delta
export const FRICTION_BASE = 0.982;
export const FRICTION_SEEKER = FRICTION_BASE + SEEKER_FRICTION_BONUS;
export const FRICTION_SLOWMO = 0.997;
export const FRICTION_SAND_MULT = 0.92;          // extra slow on sand
export const FRICTION_ICE = 0.99;                // ice patch multiplier
export const STOP_THRESHOLD = 0.08;              // below this, ball stops
export const BOUNCE_REST_NORMAL = 0.65;
export const BOUNCE_REST_SLOWMO = 0.93;
export const BOUNCE_REST_SUPERBALL = 1.0;        // Seeker + superball off walls
export const BUMPER_REST = 1.4;
export const BUMPER_REST_SUPERBALL = 3.0;        // Seeker + superball off bumpers
export const BUMPER_BOOST_NORMAL = 1.25;
export const BUMPER_BOOST_SUPERBALL = 1.6;
export const BUMPER_MIN_SPEED = 4;
export const BUMPER_KICK_SPEED = 8;
export const PARTICLE_BOUNCE_REST = 0.74;
export const PARTICLE_GRAVITY = 0.22;

// ── Slingshot ────────────────────────────────────────
export const MAX_DRAG = 160;
export const MIN_DRAG_DIST = 12;                 // ignore tiny drags
export const TOUCH_TARGET_PAD = 50;              // extra hit area for touch
export const LAUNCH_SPARKS = 14;

// ── Camera ───────────────────────────────────────────
export const CAM_LERP_POS = 0.08;
export const CAM_LERP_ZOOM = 0.05;
export const CAM_ZOOM_REST_CLOSE = 1.55;
export const CAM_ZOOM_REST_FAR = 1.15;
export const CAM_ZOOM_MOVING = 1.05;
export const CAM_ZOOM_MIN = 0.42;
export const CAM_ZOOM_MAX = 1.0;
export const CAM_ZOOM_SUDDEN_DEATH = 0.72;
export const CAM_SD_X = 600;
export const CAM_SD_Y = 450;
export const PROXIMITY_ZOOM_THRESHOLD = 420;
export const PROXIMITY_ZOOM_BOOST = 1.05;

// ── Screen shake ─────────────────────────────────────
export const SHAKE_DECAY = 0.935;
export const SHAKE_TAG_AMOUNT = 42;
export const SHAKE_BUMPER_ADD = 8;
export const SHAKE_MAX = 15;

// ── Slow motion ──────────────────────────────────────
export const SLOWMO_TAG_SPEED = 0.025;
export const SLOWMO_RECOVERY = 0.009;

// ── Fog of war ───────────────────────────────────────
export const FOG_RADIUS = 350;
export const FOG_ALPHA = 0.95;
export const FOG_EDGE_ALPHA = 0.22;

// ── Sonar ────────────────────────────────────────────
export const SONAR_INTERVAL = 3000;              // ms
export const SONAR_SPEED = 3;
export const SONAR_MAX_RADIUS = 280;
export const SONAR_START_RADIUS = 5;

// ── Bumpers ──────────────────────────────────────────
export const BUMPER_COUNT_NORMAL = 6;
export const BUMPER_COUNT_SD = 8;
export const BUMPER_MIN_RADIUS = 42;
export const BUMPER_RADIUS_VAR = 15;
export const BUMPER_SPAWN_CLEAR = 180;           // min dist from player spawns
export const BUMPER_MIN_SEP = 140;               // min dist between bumpers
export const BUMPER_PULSE_DURATION = 15;
export const BUMPER_PARTICLES = 6;

// ── Hazards ──────────────────────────────────────────
export const SAND_COUNT = 4;
export const ICE_COUNT = 4;
export const SAND_MIN_RADIUS = 120;
export const SAND_RADIUS_VAR = 50;
export const ICE_MIN_RADIUS = 110;
export const ICE_RADIUS_VAR = 45;
export const HAZARD_SPAWN_CLEAR = 220;           // min dist from player spawns
export const HAZARD_MIN_SEP = 200;               // min dist between hazards
export const HAZARD_BUMPER_CLEAR = 100;          // min dist from bumper edge

// ── Power-up orb ─────────────────────────────────────
export const ORB_RADIUS = 18;
export const ORB_SPAWN_RANGE = 150;              // +/- from map center
export const ORB_PULSE_SPEED = 0.006;
export const ORB_PULSE_AMP = 0.12;
export const ORB_RESPAWN_TIME = 10000;           // ms
export const ORB_COLLECT_PARTICLES = 20;

// ── Power-up durations (frames at 60fps) ──
export const CLOAK_DURATION = 180;    // 3 seconds
export const MAGNET_DURATION = 300;   // 5 seconds
export const MAGNET_PULL_STRENGTH = 0.15;
export const LASER_SPEED_MULT = 1.2;  // 20% speed boost

// ── Particles ────────────────────────────────────────
export const TAG_SPARKS = 65;
export const TAG_DEBRIS = 35;
export const TAG_GLASS = 25;
export const TAG_SHOCKWAVE_MAX_R = 640;
export const TAG_SHOCKWAVE_SPEED = 6.5;
export const TAG_RECOIL_HIDER = 200;
export const TAG_RECOIL_SEEKER = 145;
export const TAG_FREEZE_TIME = 1450;             // ms
export const PARTICLE_MAX = 500;                 // hard cap

// ── Trails ───────────────────────────────────────────
export const TRAIL_MAX_POINTS = 25;
export const TRAIL_MIN_SPEED = 0.05;

// ── AI ───────────────────────────────────────────────
export const AI_EASY_ERROR = 0.15;               // ±15% aim error
export const AI_THINK_DELAY = 1000;              // ms

// ── Meta-progression ─────────────────────────────────
export const CREDITS_BASE_MULT = 1;
export const CREDITS_POWERUP_BONUS = 0.5;
export const LEADERBOARD_MAX = 10;

// ── Scoring ──────────────────────────────────────────
export const DISTANCE_BONUS_MAX = 50;
export const QUICK_TAG_THRESHOLD = 3;
export const QUICK_TAG_BONUS = 25;
export const COMBO_BONUS_PER_STEP = 10;
export const NEAR_MISS_THRESHOLD = 50;
export const NEAR_MISS_BONUS = 10;
export const POWER_UP_BONUS = 15;
export const SURVIVAL_STREAK_THRESHOLD = 10;
export const SURVIVAL_STREAK_BONUS = 10;

// ── Timing ───────────────────────────────────────────
export const FLOAT_MESSAGE_DURATION = 2500;      // ms
