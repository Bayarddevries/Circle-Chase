# Chase Tag — Sound Implementation Plan

## Overview

Add a complete sound system to Chase Tag using the **Web Audio API** (no external audio files — everything is synthesized procedurally). This keeps the bundle small and avoids asset loading issues on mobile/PWA.

**Target file:** `src/audio/SoundEngine.ts` (new)
**Integration point:** `src/components/GameCanvas.tsx` (event hooks)
**Estimated effort:** 4-6 hours
**No new npm packages required** — Web Audio API is built into all browsers.

---

## Architecture

### Single Audio Context

Create one `AudioContext` on first user interaction (browser autopause policy). All sounds are synthesized from oscillators, noise buffers, and gain envelopes — zero MP3/WAV files.

```
src/audio/
├── SoundEngine.ts    — Core engine: context, master gain, SFX methods
└── sounds.ts         — Individual sound synthesizers (pure functions)
```

### Why Procedural Over Audio Files

- **Bundle size:** 0 bytes added vs 50-200KB for audio files
- **Latency:** No network fetch or decode delay
- **Dynamic:** Pitch/volume can scale with game state (ball speed, bumper size, etc.)
- **Mobile-friendly:** Works offline immediately, no cache issues

---

## SoundEngine API

```typescript
class SoundEngine {
  init(): void              // Call on first user click/touch (unlocks AudioContext)
  setMasterVolume(v: number) // 0.0 – 1.0, persisted to localStorage
  setMuted(m: boolean)       // Toggle, persisted to localStorage

  // Gameplay SFX
  launch(power: number)      // Whoosh — pitch scales with launch power (0-1)
  bumperHit(bumperRadius: number)  // Metallic clang — pitch varies by bumper size
  wallBounce(velocity: number)     // Soft thud — volume scales with velocity
  tag()                      // Bass explosion + reverb tail
  sonarPing()                // Soft expanding beep
  powerUpCollect()           // Crystalline chime
  powerUpActivate()          // Subtle activation hum
  sandEnter()                // Muffled friction noise
  iceEnter()                 // Crystalline slide
  cloakActivate()            // Muffled shimmer
  magnetPull()               // Low drone
  suddenDeathStart()         // Tension sting
  roundStart()               // Clean start beep
  matchWin()                 // Victory fanfare (3-note arpeggio)
  buttonClick()              // Subtle UI click
  buttonHover()              // Subtle UI hover (very quiet)

  // Music
  startMusic()               // Looping ambient synthwave track
  stopMusic()                // Fade out
  setMusicVolume(v: number)  // 0.0 – 1.0
  pauseMusic()               // Pause (tab hidden)
  resumeMusic()              // Resume (tab visible)
}
```

### Singleton Export

```typescript
// src/audio/SoundEngine.ts
export const soundEngine = new SoundEngine();
```

Import and call from GameCanvas event hooks.

---

## Sound Design Specs

### 1. Launch Whoosh
- **Synthesis:** White noise burst through bandpass filter
- **Duration:** 150-300ms (scales with power)
- **Pitch:** Bandpass center 800Hz (low power) → 2400Hz (high power)
- **Envelope:** Fast attack (5ms), decay matching duration
- **Volume:** 0.3-0.6 based on power

### 2. Bumper Hit Clang
- **Synthesis:** FM synthesis (carrier 200Hz, modulator 3.5x) + short noise burst
- **Duration:** 80-150ms
- **Pitch:** Carrier frequency scales inversely with bumper radius (bigger = lower)
  - Small bumper (r=42): ~400Hz
  - Large bumper (r=57): ~250Hz
- **Envelope:** Instant attack, 60ms decay
- **Volume:** 0.4-0.7 based on collision velocity

### 3. Wall Bounce Thud
- **Synthesis:** Sine wave burst at 80Hz + noise
- **Duration:** 40-80ms
- **Volume:** 0.1-0.3 based on velocity (quiet, not annoying on repeated bounces)

### 4. Tag Explosion
- **Synthesis:** Layered — (a) 60Hz sine sweep down to 20Hz over 200ms, (b) noise burst 200ms, (c) 3 delayed reverb taps
- **Duration:** 600ms total
- **Screen shake sync:** Trigger at same frame as existing shake
- **Volume:** 0.8 (loudest sound in the game)

### 5. Sonar Ping
- **Synthesis:** Sine 1200Hz → 800Hz sweep over 150ms
- **Duration:** 200ms
- **Volume:** 0.3 (subtle, informational)
- **Spatial:** Pan toward Hider's direction from Seeker's position (stereo)

### 6. Power-Up Collect
- **Synthesis:** Two detuned sine oscillators (523Hz + 525Hz) with fast attack, 100ms decay
- **Duration:** 150ms
- **Volume:** 0.4
- **Followed by:** powerUpActivate() — 500ms low hum at 200Hz, volume 0.15

### 7. Sand Enter
- **Synthesis:** Filtered noise (lowpass 400Hz), 100ms
- **Duration:** 100ms
- **Volume:** 0.2 (subtle texture)

### 8. Ice Enter
- **Synthesis:** High-frequency sine sweep 2000Hz → 3000Hz, 80ms
- **Duration:** 80ms
- **Volume:** 0.25

### 9. Cloak Activate
- **Synthesis:** Reverse-sweep sine 1500Hz → 200Hz with reverb-like delay taps
- **Duration:** 300ms
- **Volume:** 0.3

### 10. Magnet Pull
- **Synthesis:** Low sawtooth 100Hz with slow LFO on amplitude (3Hz)
- **Duration:** 500ms
- **Volume:** 0.35

### 11. Sudden Death Sting
- **Synthesis:** Dissonant chord (200Hz + 211Hz + 311Hz) with slow attack
- **Duration:** 800ms
- **Volume:** 0.6

### 12. Round Start Beep
- **Synthesis:** Clean sine 880Hz, 100ms
- **Volume:** 0.3

### 13. Match Win Fanfare
- **Synthesis:** 3-note arpeggio (C5 → E5 → C6), each note 150ms, sine waves
- **Duration:** 500ms
- **Volume:** 0.5

### 14. UI Click
- **Synthesis:** Short sine 600Hz, 30ms
- **Volume:** 0.15

### 15. UI Hover
- **Synthesis:** Short sine 1000Hz, 20ms
- **Volume:** 0.05 (barely audible)

---

## Background Music

### Approach: Procedural Synthwave Loop

Generate a looping ambient track using oscillators — no audio files.

**Structure:**
- **Pad:** Two detuned sawtooth oscillators (root note + fifth), lowpass filtered at 800Hz, very slow LFO on filter cutoff (0.1Hz)
- **Bass:** Square wave at root note, 50% duty cycle, lowpass 200Hz
- **Arp:** Sine wave playing a 16th-note arpeggio pattern (root → fifth → octave → fifth), tempo-synced
- **Kick:** Sine 60Hz with fast pitch sweep (60→30Hz in 50ms), on every beat

**Key:** A minor (fits the dark neon aesthetic)
**Tempo:** 110 BPM (moderate, not frantic)
**Loop length:** 4 bars = ~8.7 seconds

**Dynamic intensity:**
- Normal play: Pad + bass only (calm)
- Last 3 seconds of slow-mo tag: Add arp + kick (tension)
- Sudden death: Full mix + tempo increase to 130 BPM

**Volume:** Default 0.2 (well below SFX), user-adjustable

---

## Integration Points in GameCanvas.tsx

Add `soundEngine.init()` call on first user interaction (click/touch on canvas). Then hook into existing game events:

| Game Event | Sound Call | Location in GameCanvas |
|---|---|---|
| Ball launched | `launch(power)` | End of slingshot release handler |
| Ball hits bumper | `bumperHit(bumper.radius)` | Bumper collision detection |
| Ball hits wall | `wallBounce(velocity)` | Wall collision detection |
| Tag occurs | `tag()` | Tag detection block |
| Sonar triggers | `sonarPing()` | Sonar timer callback |
| Orb collected | `powerUpCollect()` | Orb collection check |
| Power-up activated | `powerUpActivate()` | Power-up activation |
| Ball enters sand | `sandEnter()` | Sand friction application |
| Ball enters ice | `iceEnter()` | Ice friction application |
| Cloak activated | `cloakActivate()` | Cloak power-up handler |
| Magnet activated | `magnetPull()` | Magnet power-up handler |
| Sudden death starts | `suddenDeathStart()` | Sudden death transition |
| Round starts | `roundStart()` | Round init |
| Match won | `matchWin()` | Match over detection |
| Button clicked | `buttonClick()` | UI button handlers |
| Music starts | `startMusic()` | After first round begins |
| Music stops | `stopMusic()` | Return to main menu |

### Volume Scaling

Pass relevant game state to sound calls so audio feels connected to the action:
- `launch(power)` — power is 0-1 normalized drag distance
- `bumperHit(radius)` — radius determines pitch
- `wallBounce(velocity)` — velocity determines volume
- `tag()` — always full volume

---

## Settings UI

Add to MainMenu.tsx (below existing toggles):

```
[🔊 Master Volume ──────●────]  slider 0-100%
[🔉 Music Volume ────●──────]  slider 0-100%
[🔇 Mute All]                   toggle button
```

Persist to localStorage:
- `chase-tag-master-volume` (default: 0.7)
- `chase-tag-music-volume` (default: 0.3)
- `chase-tag-muted` (default: false)

---

## Mobile / PWA Considerations

1. **AudioContext resume:** Browsers suspend AudioContext on page load. Must call `audioContext.resume()` inside a user gesture handler (click/touch). The `init()` method handles this.

2. **Tab visibility:** Pause music when tab is hidden (`visibilitychange` event), resume when visible.

3. **iOS Safari:** Requires `AudioContext` creation inside user gesture. Same init pattern covers this.

4. **Battery:** Procedural audio is CPU-light. Oscillators are native Web Audio nodes — no script processing per frame for music.

5. **Offline:** Zero network requests for audio. Works fully offline once JS is cached.

---

## Implementation Order

1. **SoundEngine.ts** — Core class with AudioContext, master gain, init, volume controls, mute
2. **sounds.ts** — Individual sound functions (start with launch, bumper, tag — the 3 most important)
3. **GameCanvas integration** — Add init call + 3 core sound hooks, verify they fire
4. **Remaining SFX** — Add all other sounds one at a time, test each
5. **Music system** — Pad + bass first, then arp, then kick, then dynamic intensity
6. **Settings UI** — Volume sliders in MainMenu, localStorage persistence
7. **Mobile polish** — visibilitychange handler, iOS testing, volume defaults

---

## Testing Checklist

- [ ] All 15 SFX trigger at correct game events
- [ ] Launch pitch scales with power
- [ ] Bumper pitch varies by size
- [ ] Tag is loudest sound, syncs with screen shake
- [ ] Sonar ping is subtle and directional
- [ ] Music loops seamlessly (no gap at loop point)
- [ ] Music intensity increases during slow-mo tag
- [ ] Music pauses on tab hidden, resumes on visible
- [ ] Volume sliders affect SFX and music independently
- [ ] Mute toggle silences everything
- [ ] Settings persist across page reloads
- [ ] No audio glitches or clicks on rapid repeated sounds
- [ ] Works on first tap without pre-loading audio files
- [ ] Build passes with zero errors
- [ ] No new npm packages in package.json

---

## File Summary

| File | Action | Purpose |
|---|---|---|
| `src/audio/SoundEngine.ts` | Create | Core audio context, master gain, music loop, public API |
| `src/audio/sounds.ts` | Create | Pure functions for each SFX synthesizer |
| `src/components/GameCanvas.tsx` | Modify | Add ~15 `soundEngine.*()` calls at event hooks |
| `src/components/MainMenu.tsx` | Modify | Add volume sliders and mute toggle |
| `src/constants.ts` | Modify | Add audio-related constants (default volumes, music tempo) |

---

## Constraints

- **No new npm packages.** Web Audio API only.
- **No audio files.** Everything synthesized.
- **No `any` types.** Full TypeScript.
- **Build must pass** before marking complete.
- **Keep GameCanvas changes minimal.** Sound calls are one-liners at existing event points.
