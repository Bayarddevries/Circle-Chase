/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Debug overlay system for Circle Chase.
 * Zero overhead when disabled — all capture is gated behind an enabled flag.
 */

export interface DebugFrameEntry {
  type: 'frame';
  timestamp: number;
  frame: number;
  phase: string;
  turnNumber: number;
  activeRole: string;
  hider: { x: number; y: number; vx: number; vy: number };
  seeker: { x: number; y: number; vx: number; vy: number };
  activePowerUp: string | null;
  ballsMoving: boolean;
  roundMeta: {
    turnsSurvived: number;
    bumperHits: number;
    powerUpCollector: string | null;
    tagTurn: number;
  };
}

export interface DebugEventEntry {
  type: 'event';
  timestamp: number;
  frame: number;
  eventType: 'collision' | 'score_change' | 'tag_attempt' | 'powerup_collect' | 'powerup_stolen' | 'turn_swap' | 'round_start' | 'round_end' | 'tag_freeze' | 'near_miss' | 'bumper_hit';
  data: Record<string, unknown>;
}

export type DebugEntry = DebugFrameEntry | DebugEventEntry;

export interface DebugState {
  enabled: boolean;
  visible: boolean;
  log: DebugEntry[];
  frameCounter: number;
  lastFrameTime: number;
  maxLogSize: number;
}

export function createDebugState(): DebugState {
  return {
    enabled: false,
    visible: false,
    log: [],
    frameCounter: 0,
    lastFrameTime: 0,
    maxLogSize: 10000,
  };
}

export function debugLogFrame(state: DebugState, data: Omit<DebugFrameEntry, 'type'>): void {
  if (!state.enabled) return;
  state.log.push({ type: 'frame', ...data });
  if (state.log.length > state.maxLogSize) {
    state.log = state.log.slice(-state.maxLogSize);
  }
}

export function debugLogEvent(state: DebugState, eventType: DebugEventEntry['eventType'], data: Record<string, unknown>): void {
  if (!state.enabled) return;
  state.log.push({
    type: 'event',
    timestamp: performance.now(),
    frame: state.frameCounter,
    eventType,
    data,
  });
  if (state.log.length > state.maxLogSize) {
    state.log = state.log.slice(-state.maxLogSize);
  }
}

export function debugToggleEnabled(state: DebugState): boolean {
  state.enabled = !state.enabled;
  if (state.enabled) {
    state.log = [];
    state.frameCounter = 0;
  }
  return state.enabled;
}

export function debugToggleVisible(state: DebugState): boolean {
  state.visible = !state.visible;
  return state.visible;
}

export function debugIncrementFrame(state: DebugState): void {
  if (state.enabled) {
    state.frameCounter++;
    state.lastFrameTime = performance.now();
  }
}

/**
 * Render the debug overlay onto the canvas context.
 * Called at the end of the draw function, after camera transform is restored.
 */
export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  state: DebugState,
  canvasWidth: number,
  canvasHeight: number,
): void {
  if (!state.visible || !state.enabled) return;

  const recentFrames = state.log.filter(e => e.type === 'frame').slice(-30) as DebugFrameEntry[];
  const recentEvents = state.log.filter(e => e.type === 'event').slice(-20) as DebugEventEntry[];

  // Background panel
  const panelX = 8;
  const panelY = 8;
  const panelW = 320;
  const panelH = canvasHeight - 16;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  let y = panelY + 16;
  const lineHeight = 14;
  const textX = panelX + 8;

  ctx.font = '11px monospace';
  ctx.fillStyle = '#00ff00';
  ctx.fillText('=== DEBUG OVERLAY ===', textX, y); y += lineHeight + 4;

  if (recentFrames.length === 0) {
    ctx.fillStyle = '#888';
    ctx.fillText('Waiting for frames...', textX, y);
    ctx.restore();
    return;
  }

  const latest = recentFrames[recentFrames.length - 1];

  // Game state
  ctx.fillStyle = '#ffff00';
  ctx.fillText(`Phase: ${latest.phase}  Turn: ${latest.turnNumber}  Frame: ${latest.frame}`, textX, y); y += lineHeight;
  ctx.fillText(`Active: ${latest.activeRole}  Moving: ${latest.ballsMoving}`, textX, y); y += lineHeight;
  ctx.fillText(`PowerUp: ${latest.activePowerUp ?? 'none'}`, textX, y); y += lineHeight + 4;

  // Hider
  ctx.fillStyle = '#00ffff';
  ctx.fillText(`HIDER (${latest.hider.x.toFixed(0)}, ${latest.hider.y.toFixed(0)})`, textX, y); y += lineHeight;
  ctx.fillText(`  vel: (${latest.hider.vx.toFixed(1)}, ${latest.hider.vy.toFixed(1)})`, textX, y); y += lineHeight;

  // Seeker
  ctx.fillStyle = '#ff8800';
  ctx.fillText(`SEEKER (${latest.seeker.x.toFixed(0)}, ${latest.seeker.y.toFixed(0)})`, textX, y); y += lineHeight;
  ctx.fillText(`  vel: (${latest.seeker.vx.toFixed(1)}, ${latest.seeker.vy.toFixed(1)})`, textX, y); y += lineHeight + 4;

  // Round meta
  ctx.fillStyle = '#ff00ff';
  ctx.fillText(`Turns: ${latest.roundMeta.turnsSurvived}  Bumpers: ${latest.roundMeta.bumperHits}`, textX, y); y += lineHeight;
  ctx.fillText(`PU Collector: ${latest.roundMeta.powerUpCollector ?? 'none'}`, textX, y); y += lineHeight + 4;

  // Distance between balls
  const dist = Math.hypot(latest.hider.x - latest.seeker.x, latest.hider.y - latest.seeker.y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Distance: ${dist.toFixed(1)}px`, textX, y); y += lineHeight + 4;

  // Recent events
  ctx.fillStyle = '#888888';
  ctx.fillText(`--- Events (${state.log.filter(e => e.type === 'event').length} total) ---`, textX, y); y += lineHeight;

  for (const evt of recentEvents.slice(-8)) {
    const color = evt.eventType === 'tag_attempt' ? '#ff0000'
      : evt.eventType === 'collision' ? '#ffff00'
      : evt.eventType === 'powerup_collect' ? '#00ff00'
      : evt.eventType === 'score_change' ? '#00ffff'
      : evt.eventType === 'near_miss' ? '#ff8800'
      : '#aaaaaa';
    ctx.fillStyle = color;
    const dataStr = JSON.stringify(evt.data).substring(0, 60);
    ctx.fillText(`[${evt.frame}] ${evt.eventType}: ${dataStr}`, textX, y);
    y += lineHeight;
  }

  // Log size
  ctx.fillStyle = '#666666';
  ctx.fillText(`Log: ${state.log.length} entries`, textX, panelH - 8);

  ctx.restore();
}
