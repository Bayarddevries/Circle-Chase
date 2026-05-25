# Turn Tag — Menu Text Polish

> **Status: ✅ COMPLETE** — All changes applied and verified (2026-05-25).
>
> **Brand lock:** This document assumes the name has been set to **Turn Tag** and roles are **Runner** (was Hider) and **Chaser** (was Seeker).
> Apply all changes in this doc after the Hider/Seeker → Runner/Chaser rename is done.

## Files to Edit

| File | Changes |
|------|---------|
| `src/components/MainMenu.tsx` | Title, subtitle, labels, footer, placeholder text |
| `src/components/MatchOverlay.tsx` | All overlay screens (intro, round over, match over, sudden death) |
| `src/components/HelpManual.tsx` | Section headers, role names, power-up descriptions, button text |
| `src/components/GameCanvas.tsx` | 6 power-up HUD messages, float messages |
| `src/App.tsx` | Footer text if applicable |

---

## ✅ 1. MainMenu.tsx

### Line 48 — Header badge
```
OLD: CHAMPIONSHIP SLATE PROTOCOL ACTIVE
NEW: TURN TAG
```

### Line 51–53 — Main title
```
OLD: <h1>...Night Golf Chase</h1>
NEW: <h1>Turn Tag</h1>

OLD: <p>...Turn-Based Cinematic Physics Evasion & Evocative Stealth Drift</p>
NEW: <p>The Turn-Based Tag 'Em Up</p>
```

### Line 61–63 — Form section header
```
OLD: CHALLENGE REGISTRY
NEW: MATCH SETUP
```

### Line 68–69 — Player 1 label
```
OLD: Pilot Alpha (Hider Starting)
NEW: Runner
```

### Line 79 — Player 1 placeholder
```
OLD: placeholder="PILOT ALPHA"
NEW: placeholder="Runner name"
```

### Line 86–87 — Player 2 label
```
OLD: Pilot Beta (Seeker Starting)
NEW: Chaser
```

### Line 97 — Player 2 placeholder
```
OLD: placeholder="PILOT BETA"
NEW: placeholder="Chaser name"
```

### Line 106–108 — Series selector label
```
OLD: Match Series Duration
NEW: Best of
```

### Line 122 — Button text
```
OLD: {rounds} RDS
NEW: {rounds}
```

### Line 141–143 — Colorblind toggle label
```
OLD: <span>COLORBLIND MODE</span>
NEW: <span>COLORBLIND</span>
```

### Line 155 — CPU toggle label
```
OLD: CPU OPPONENT
NEW: CPU PLAYER
```

### Line 207–211 — Footer
```
OLD: <span>...Goal: Escape longest as Hider / Catch fast as Seeker</span>
NEW: <span>Survive as Runner. Catch as Chaser. First to {bestOf} wins.</span>

OLD: © 2026 Night Cyber Golfing Corp
NEW: © 2026 Bayard deVries
```

---

## ✅ 2. MatchOverlay.tsx

### Round Intro (lines 72–127)

```
OLD: ROLE ASSIGNMENT
NEW: Runner vs Chaser

OLD: <p>...Prepare to swap device controls</p>
NEW: <p>Hand the device after your turn</p>
```

**Runner card** (around line 88–98):
```
OLD: THE ELUSIVE
NEW: Runner

OLD: Hider (badge text)
NEW: Runner

OLD: <p>Launch first to escape. Hide in the Fog of War. Stay clear of the Seeker's path.</p>
NEW: <p>Launch first. Hide in the fog. Stay out of reach.</p>
```

**Chaser card** (around line 100–110):
```
OLD: THE HUNTER
NEW: Chaser

OLD: Seeker (badge text)
NEW: Chaser

OLD: <p>Gets +50% speed, -15% less friction, and a Laser Sight power-up availability on map.</p>
NEW: <p>+50% speed, -15% friction, and power-ups on the map.</p>
```

**Mission Guidelines box** (lines 113–118):
```
OLD: <span>Mission Guidelines:</span>
NEW: <span>Quick Tips</span>

OLD: <p>Each player executes slingshot maneuvers. Hider gains 1 survival score for each turn completed before being tagged. Swipe backwards from your indicator to aim!</p>
NEW: <p>Runner scores 1 point per turn survived. Chaser scores by tagging. Drag back to aim, release to launch.</p>
```

**ENGAGE button** (line 125):
```
OLD: ENGAGE ROUND {currentRound + 1}
NEW: Start Round {currentRound + 1}
```

### Round Over (lines 166–223)

**Header badge** (line 169):
```
OLD: TAG CONFIRMED
NEW: Tag!
```

**Left stat card** (lines 180–185):
```
OLD: TAGGED IN TURN
NEW: Turns Survived
```

**Right stat card** (lines 188–194):
```
OLD: SURVIVAL BONUS
NEW: Score
```

**Score section header** (line 199):
```
OLD: UPDATED LEADERBOARD
NEW: Scoreboard
```

**Player labels** (lines 203, 209):
```
OLD: {config.p1Name} (Pilot Alpha)
NEW: {config.p1Name}

OLD: {config.p2Name} (Pilot Beta)
NEW: {config.p2Name}
```

**Button** (line 221):
```
OLD: PROCEED TO NEXT SEQUENCE
NEW: Next Round
```

### Sudden Death (lines 131–162)

**Subtext** (line 138):
```
OLD: DRAW PROTOCOL INITIATED (TIE: {p1TotalScore} - {p2TotalScore})
NEW: Tied at {p1TotalScore} - {p2TotalScore}
```

**Instructions section** (line 144):
```
OLD: CRITICAL INSTRUCTIONS
NEW: Sudden Death Rules
```

**Button** (line 160):
```
OLD: LAUNCH FINAL DEATHMATCH
NEW: Final Round
```

### Match Over (lines 227–291)

**Header badge** (line 232):
```
OLD: CHAMPION PORT DECIDED
NEW: Match Over
```

**"VS" divider** (line 246):
```
OLD: VS
NEW: v
```

**Runner-up label** (line 248):
```
OLD: RUNNER-UP
NEW: Runner-Up
```

**Round log section** (line 256):
```
OLD: Round Logs Histology
NEW: Round Log
```

**Round history labels** (lines 262–263, 268):
```
OLD: {record.hiderName} (H) escaped {record.seekerName} (S)
NEW: Runner: {record.hiderName} | Chaser: {record.seekerName}

OLD: Hider Score Saved
NEW: (remove this sublabel entirely, or make it "Points")
```

**Button** (line 289):
```
OLD: MAIN TERMINAL
NEW: Main Menu
```

---

## ✅ 3. HelpManual.tsx

### Header (line 27)
```
OLD: OPERATIONS MANUAL
NEW: How to Play
```

### Section 1 (line 37)
```
OLD: 1. Turn-Based Evasion
NEW: 1. How Turns Work

OLD: <p>Two players share the same screen to play a high-tech game of hide-and-seek.
      You alternate shoots. <span class="...">Hider flings first</span>,
      then the <span class="...">Seeker flings</span>...</p>
NEW: <p>Two players share one screen. Take turns launching your ball with the slingshot.
      The <span class="...">Runner launches first</span>, then the
      <span class="...">Chaser launches</span>. The round ends when the Chaser tags the Runner.
      Runner scores points for each turn survived.</p>
```

### Section 2 (line 49)
```
OLD: 2. Touch & Hook Controls
NEW: 2. Slingshot Controls

OLD: <p>Touch/Click and drag backwards from your circle to aim...</p>
NEW: (keep text, it's fine)
```

### Seeker's Instinct (line 60)
```
OLD: Seeker's Instinct
NEW: Chaser Advantage

OLD: <li><strong>Distance Veil:</strong> Hider is hidden in a dark Fog of War if beyond 350px.</li>
NEW: <li><strong>Distance Veil:</strong> Runner is hidden in fog beyond 350px.</li>
```

### Hider's Covert Sonar (line 71)
```
OLD: Hider's Covert Sonar
NEW: Runner Ability

OLD: <li><strong>Sonar Pings:</strong> Map broadcasts an acoustic shockwave from Hider's location every 3 seconds...</li>
NEW: <li><strong>Sonar Pings:</strong> The Runner's location is revealed by a shockwave every 3 seconds.</li>

OLD: <li><strong>First Strike:</strong> Commences shooting first in every round.</li>
NEW: <li><strong>First Launch:</strong> Runner goes first each round.</li>
```

### Terrain Grid (lines 83–100)
```
OLD: Terrain Grid Hazards
NEW: Terrain

OLD: Sand Traps (Slow)
NEW: Sand (Slow)

OLD: Ice Patches (Turbo)
NEW: Ice (Fast)

OLD: Chased Bumper
NEW: Bumper (Boost)
```

### Power-up section (lines 104–128)
```
OLD: Seeker Power-up Orbs
NEW: Chaser Power-ups
```

**Individual power-ups** — replace descriptions:
```
OLD: Extends the slingshot predictive path trajectory by 2.5x for long range snipes.
NEW: Longer aim line for long-range snipes.

OLD: Fling rebounds bounce off border walls and hazards with 2x intensity!
NEW: Balls bounce off walls and hazards at double speed.

OLD: Gain massive virtual weight, plowing through slow sand completely unaffected.
NEW: Ignore sand slowdown.

OLD: Fades the shrouds of War Fog, revealing the Hider's coordinate precisely!
NEW: Reveals the Runner's exact position.
```

### Close button (line 140)
```
OLD: DISMISS MANUAL
NEW: Got It
```

---

## ✅ 4. GameCanvas.tsx — HUD Power-Up Messages

Around line 399–405:

```typescript
OLD: laser: 'Laser Sight Opt-In!',
NEW: laser: 'Laser Sight',

OLD: superball: 'Superball Rebound Activator!',
NEW: superball: 'Superball',

OLD: iron: 'Iron Ball Anti-Sand Mass!',
NEW: iron: 'Iron Ball',

OLD: sonar: 'Sonar Pulse Radar Activated!',
NEW: sonar: 'Sonar Pulse',

OLD: cloak: 'Cloak Invisibility Active!',
NEW: cloak: 'Cloak',

OLD: magnet: 'Magnet Pull Engaged!',
NEW: magnet: 'Magnet',
```

Around line 590 (float message):
```
OLD: 'PERK EXPIRED'
NEW: (keep as-is, or change to 'Power-up faded')
```

---

## ✅ Implementation Order

1. **Hider/Seeker → Runner/Chaser** (across all 4 components + types.ts) — do this first
2. **"Night Golf Chase" → "Turn Tag"** — title, subtitle, footer
3. **Button text simplification** — PROCEED TO NEXT SEQUENCE → Next Round, etc.
4. **Section headers** — ROLE ASSIGNMENT → Runner vs Chaser, OPERATIONS MANUAL → How to Play, etc.
5. **Power-up HUD strings** — strip the fluff
6. **Footer cleanup** — remove Night Cyber Golfing Corp
7. **Verify build** — `npm run build` must pass

## String Match Checklist (grep before/after)

```bash
# Verify old strings are gone
grep -n "Night Golf Chase" src/components/*.tsx
grep -n "Night Cyber Golfing Corp" src/components/*.tsx
grep -n "Pilot Alpha" src/components/*.tsx
grep -n "Pilot Beta" src/components/*.tsx
grep -n "PROCEED TO" src/components/*.tsx
grep -n "LAUNCH FINAL" src/components/*.tsx
grep -n "DISMISS MANUAL" src/components/*.tsx
grep -n "Opt-In\|Activator\|Activated\|Engaged\|Anti-Sand\|Mass!" src/components/*.tsx
grep -n "Operations Manual" src/components/*.tsx
grep -n "Histology" src/components/*.tsx
grep -n "LEADERBOARD" src/components/*.tsx
grep -n "PROTOCOL INITIATED" src/components/*.tsx
grep -n "PORT DECIDED" src/components/*.tsx
grep -n "CHALLENGE REGISTRY" src/components/*.tsx
grep -n "CHAMPIONSHIP SLATE" src/components/*.tsx
```
