/**
 * Procedural sound engine for Turn Tag.
 * Web Audio API synthesis — zero asset files.
 * All sounds designed to match the neon-noir cinematic feel.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let pinkNoiseBuf: AudioBuffer | null = null;
let brownNoise2sBuf: AudioBuffer | null = null;
let brownNoise1sBuf: AudioBuffer | null = null;

// ── Core helpers ────────────────────────────────────────────────

export function initAudio(): AudioContext {
  if (ctx && ctx.state !== 'closed') {
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  ctx = new AudioContext();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.45;
  masterGain.connect(ctx.destination);
  return ctx;
}

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') return initAudio();
  return ctx;
}

function getMaster(): GainNode {
  if (!masterGain) initAudio();
  return masterGain!;
}

function generatePinkNoise(ctx: AudioContext, duration: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  let sum = 0;
  const coeffs = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < len; i++) {
    const mask = i & -i;
    for (let j = 0; j < 8; j++) {
      if ((mask >> j) & 1) coeffs[j] = Math.random() * 2 - 1;
      sum += coeffs[j];
    }
    data[i] = sum * 0.04;
  }
  return buf;
}

function getPinkNoise(ctx: AudioContext): AudioBuffer {
  if (!pinkNoiseBuf) pinkNoiseBuf = generatePinkNoise(ctx, 1);
  return pinkNoiseBuf;
}

function generateBrownNoise(ctx: AudioContext, duration: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  let val = 0;
  for (let i = 0; i < len; i++) {
    val += (Math.random() * 2 - 1) * 0.04;
    val = Math.max(-1, Math.min(1, val));
    data[i] = val;
  }
  return buf;
}

function getBrownNoise2s(ctx: AudioContext): AudioBuffer {
  if (!brownNoise2sBuf) brownNoise2sBuf = generateBrownNoise(ctx, 2);
  return brownNoise2sBuf;
}

function getBrownNoise1s(ctx: AudioContext): AudioBuffer {
  if (!brownNoise1sBuf) brownNoise1sBuf = generateBrownNoise(ctx, 1);
  return brownNoise1sBuf;
}

// ── Event Sounds ────────────────────────────────────────────────

/** Rubber band snap + air whoosh on slingshot release */
export function playLaunch(): void {
  const c = getCtx();
  const m = getMaster();

  // Rubber band snap — fast sawtooth chirp
  const snap = c.createOscillator();
  const snapG = c.createGain();
  snap.type = 'sawtooth';
  snap.frequency.setValueAtTime(150, c.currentTime);
  snap.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.08);
  snapG.gain.setValueAtTime(0.25, c.currentTime);
  snapG.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
  snap.connect(snapG).connect(m);
  snap.start(c.currentTime);
  snap.stop(c.currentTime + 0.15);

  // Air whoosh — bandpass-filtered noise burst
  const whoosh = c.createBufferSource();
  whoosh.buffer = getPinkNoise(c);
  const wf = c.createBiquadFilter();
  wf.type = 'bandpass';
  wf.frequency.setValueAtTime(400, c.currentTime);
  wf.frequency.exponentialRampToValueAtTime(2000, c.currentTime + 0.15);
  wf.Q.value = 0.8;
  const wg = c.createGain();
  wg.gain.setValueAtTime(0.20, c.currentTime);
  wg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
  whoosh.connect(wf).connect(wg).connect(m);
  whoosh.start(c.currentTime);
  whoosh.stop(c.currentTime + 0.22);
}

/** Metallic spring recoil "boing" on bumper hit */
export function playBumperHit(): void {
  const c = getCtx();
  const m = getMaster();

  // Spring — sine with pitch wobble + feedback delay
  const boing = c.createOscillator();
  const boingG = c.createGain();
  boing.type = 'sine';
  boing.frequency.setValueAtTime(1200, c.currentTime);
  boing.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.12);
  boingG.gain.setValueAtTime(0.30, c.currentTime);
  boingG.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
  boing.connect(boingG);

  // Short delay for springy feel
  const d = c.createDelay(0.1);
  d.delayTime.value = 0.04;
  const fb = c.createGain();
  fb.gain.value = 0.25;
  boingG.connect(d);
  d.connect(fb);
  fb.connect(d);
  d.connect(m);
  boingG.connect(m);

  boing.start(c.currentTime);
  boing.stop(c.currentTime + 0.3);

  // Overtonal ping
  const ping = c.createOscillator();
  const pingG = c.createGain();
  ping.type = 'triangle';
  ping.frequency.setValueAtTime(2400, c.currentTime);
  ping.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.06);
  pingG.gain.setValueAtTime(0.10, c.currentTime);
  pingG.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
  ping.connect(pingG).connect(m);
  ping.start(c.currentTime + 0.02);
  ping.stop(c.currentTime + 0.12);
}

/** Sharp air snap — Chaser passes close without tagging */
export function playNearMiss(): void {
  const c = getCtx();
  const m = getMaster();

  // Air snap — bandpass noise sweep
  const snap = c.createBufferSource();
  snap.buffer = getPinkNoise(c);
  const sf = c.createBiquadFilter();
  sf.type = 'bandpass';
  sf.frequency.setValueAtTime(3000, c.currentTime);
  sf.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.08);
  sf.Q.value = 3;
  const sg = c.createGain();
  sg.gain.setValueAtTime(0.20, c.currentTime);
  sg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  snap.connect(sf).connect(sg).connect(m);
  snap.start(c.currentTime);
  snap.stop(c.currentTime + 0.12);

  // Sub buzz
  const buzz = c.createOscillator();
  const buzzG = c.createGain();
  buzz.type = 'sawtooth';
  buzz.frequency.setValueAtTime(100, c.currentTime);
  buzz.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.06);
  buzzG.gain.setValueAtTime(0.12, c.currentTime);
  buzzG.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
  buzz.connect(buzzG).connect(m);
  buzz.start(c.currentTime);
  buzz.stop(c.currentTime + 0.1);
}

/** Heavy tackle impact — crack + boom + crunch + rumble tail */
export function playTag(): void {
  const c = getCtx();
  const m = getMaster();
  const t = c.currentTime;

  // 1. Sharp crack — white noise burst
  const sr = c.sampleRate;
  const crackLen = Math.floor(sr * 0.03);
  const crackBuf = c.createBuffer(1, crackLen, sr);
  const cd = crackBuf.getChannelData(0);
  for (let i = 0; i < crackLen; i++) cd[i] = (Math.random() * 2 - 1) * (1 - i / crackLen);
  const crack = c.createBufferSource();
  crack.buffer = crackBuf;
  const chp = c.createBiquadFilter();
  chp.type = 'highpass';
  chp.frequency.value = 2000;
  const cg = c.createGain();
  cg.gain.setValueAtTime(0.50, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  crack.connect(chp).connect(cg).connect(m);
  crack.start(t);
  crack.stop(t + 0.05);

  // 2. Sub-boom
  const boom = c.createOscillator();
  const bg = c.createGain();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(100, t);
  boom.frequency.exponentialRampToValueAtTime(30, t + 0.6);
  bg.gain.setValueAtTime(0.70, t);
  bg.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  boom.connect(bg).connect(m);
  boom.start(t);
  boom.stop(t + 0.85);

  // 3. Mid punch
  const punch = c.createOscillator();
  const pg = c.createGain();
  punch.type = 'triangle';
  punch.frequency.setValueAtTime(250, t);
  punch.frequency.exponentialRampToValueAtTime(60, t + 0.2);
  pg.gain.setValueAtTime(0.40, t);
  pg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  punch.connect(pg).connect(m);
  punch.start(t);
  punch.stop(t + 0.3);

  // 4. Brown noise crunch
  const crunch = c.createBufferSource();
  crunch.buffer = getBrownNoise1s(c);
  const clp = c.createBiquadFilter();
  clp.type = 'lowpass';
  clp.frequency.setValueAtTime(1200, t);
  clp.frequency.exponentialRampToValueAtTime(150, t + 0.3);
  const ccg = c.createGain();
  ccg.gain.setValueAtTime(0.45, t);
  ccg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  crunch.connect(clp).connect(ccg).connect(m);
  crunch.start(t);
  crunch.stop(t + 0.55);

  // 5. Rumble tail
  const rumble = c.createBufferSource();
  rumble.buffer = getBrownNoise2s(c);
  const rlp = c.createBiquadFilter();
  rlp.type = 'lowpass';
  rlp.frequency.value = 120;
  const rg = c.createGain();
  rg.gain.setValueAtTime(0.15, t + 0.1);
  rg.gain.linearRampToValueAtTime(0.12, t + 0.3);
  rg.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  rumble.connect(rlp).connect(rg).connect(m);
  rumble.start(t + 0.05);
  rumble.stop(t + 0.95);
}

/** Crystal shatter chime on orb collect */
export function playOrbCollect(): void {
  const c = getCtx();
  const m = getMaster();
  const t = c.currentTime;

  [880, 1320, 1760].forEach((freq, i) => {
    const tone = c.createOscillator();
    const g = c.createGain();
    tone.type = 'sine';
    const start = t + i * 0.06;
    tone.frequency.setValueAtTime(freq, start);
    if (i === 2) tone.detune.setValueAtTime(10, start);
    g.gain.setValueAtTime(0.20, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
    tone.connect(g).connect(m);
    tone.start(start);
    tone.stop(start + 0.25);
  });

  const spark = c.createOscillator();
  const sg = c.createGain();
  spark.type = 'sine';
  spark.frequency.setValueAtTime(4000, t);
  sg.gain.setValueAtTime(0.10, t);
  sg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  spark.connect(sg).connect(m);
  spark.start(t);
  spark.stop(t + 0.1);
}

/** Tiny tick for each completed turn */
export function playTurnIncrement(): void {
  const c = getCtx();
  const m = getMaster();
  const tick = c.createOscillator();
  const g = c.createGain();
  tick.type = 'sine';
  tick.frequency.value = 900;
  g.gain.setValueAtTime(0.08, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
  tick.connect(g).connect(m);
  tick.start(c.currentTime);
  tick.stop(c.currentTime + 0.04);
}

/** Descending two-note for round end */
export function playRoundOver(): void {
  const c = getCtx();
  const m = getMaster();
  const t = c.currentTime;

  [400, 300].forEach((freq, i) => {
    const tone = c.createOscillator();
    const g = c.createGain();
    tone.type = 'triangle';
    const start = t + i * 0.15;
    tone.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.15, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    tone.connect(g).connect(m);
    tone.start(start);
    tone.stop(start + 0.3);
  });
}

/** Ascending major chord for match end */
export function playMatchOver(): void {
  const c = getCtx();
  const m = getMaster();
  const t = c.currentTime;

  [262, 330, 392].forEach((freq, i) => {
    const tone = c.createOscillator();
    const g = c.createGain();
    tone.type = 'sine';
    const start = t + i * 0.12;
    tone.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.18, start);
    g.gain.linearRampToValueAtTime(0.15, start + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, start + 1.0);
    tone.connect(g).connect(m);
    tone.start(start);
    tone.stop(start + 1.2);
  });
}

/** Micro-click for UI buttons */
export function playUIClick(): void {
  const c = getCtx();
  const m = getMaster();
  const click = c.createOscillator();
  const g = c.createGain();
  click.type = 'sine';
  click.frequency.value = 1000;
  g.gain.setValueAtTime(0.06, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.01);
  click.connect(g).connect(m);
  click.start(c.currentTime);
  click.stop(c.currentTime + 0.02);
}

/** Soft pop for turn start / round intro */
export function playTurnStart(): void {
  const c = getCtx();
  const m = getMaster();
  const pop = c.createOscillator();
  const g = c.createGain();
  pop.type = 'sine';
  pop.frequency.value = 600;
  g.gain.setValueAtTime(0.10, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
  pop.connect(g).connect(m);
  pop.start(c.currentTime);
  pop.stop(c.currentTime + 0.04);
}

// ── Proximity Drone ─────────────────────────────────────────────

interface DroneNodes {
  noise: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  sub: OscillatorNode;
  subGain: GainNode;
  subFilter: BiquadFilterNode;
}

let droneNodes: DroneNodes | null = null;
let _droneRunning = false;

export function isDroneRunning(): boolean {
  return _droneRunning;
}

function droneGainAt(dist: number): number {
  return Math.pow(dist, 2.5) * 0.18;
}

function droneFreqAt(dist: number): number {
  return 50 + dist * dist * 350;
}

/** Start the proximity drone at an optional initial distance (0–1) */
export function startDrone(distance = 0): void {
  const c = getCtx();
  if (_droneRunning) {
    updateDrone(distance);
    return;
  }

  const noise = c.createBufferSource();
  noise.buffer = getBrownNoise2s(c);
  noise.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = droneFreqAt(distance);
  filter.Q.value = 1.5;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(droneGainAt(distance), c.currentTime + 0.5);

  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 40;
  const subGain = c.createGain();
  subGain.gain.setValueAtTime(0, c.currentTime);
  subGain.gain.linearRampToValueAtTime(distance * 0.08 * 0.6, c.currentTime + 0.5);
  const subFilter = c.createBiquadFilter();
  subFilter.type = 'lowpass';
  subFilter.frequency.value = 100;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  sub.connect(subFilter);
  subFilter.connect(subGain);
  subGain.connect(c.destination);

  noise.start(c.currentTime);
  sub.start(c.currentTime);

  droneNodes = { noise, filter, gain, sub, subGain, subFilter };
  _droneRunning = true;
}

/** Update drone parameters based on normalized distance (0 = far, 1 = close) */
export function updateDrone(distance: number): void {
  if (!_droneRunning || !droneNodes) return;
  const c = getCtx();
  const now = c.currentTime;
  droneNodes.filter.frequency.linearRampToValueAtTime(droneFreqAt(distance), now + 0.15);
  droneNodes.gain.gain.linearRampToValueAtTime(droneGainAt(distance), now + 0.15);
  if (droneNodes.subGain) {
    droneNodes.subGain.gain.linearRampToValueAtTime(distance * 0.08, now + 0.15);
  }
}

/** Stop the drone with a smooth fade */
export function stopDrone(): void {
  if (!_droneRunning || !droneNodes) return;
  const c = getCtx();
  const now = c.currentTime;
  droneNodes.gain.gain.linearRampToValueAtTime(0, now + 0.3);
  if (droneNodes.subGain) droneNodes.subGain.gain.linearRampToValueAtTime(0, now + 0.3);
  droneNodes.noise.stop(now + 0.35);
  droneNodes.sub.stop(now + 0.35);
  _droneRunning = false;
  droneNodes = null;
}

/** Cleanup all audio resources */
export function cleanup(): void {
  if (_droneRunning) stopDrone();
  pinkNoiseBuf = null;
  brownNoise2sBuf = null;
  brownNoise1sBuf = null;
  if (ctx) {
    ctx.close();
    ctx = null;
    masterGain = null;
  }
}