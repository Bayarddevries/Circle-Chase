# Circle Chase

## v1.3 - Next Sprint
- [ ] AI Opponent (Seeker) with 3 difficulty levels | From review: top priority; enables solo play
- [ ] Power-up balance rework (Laser speed buff, Iron ice immunity) | Address imbalance: Superball OP, Laser/IRON weak
- [ ] New power-ups: Cloak (Hider invisibility), Magnet (Seeker pull) | Increases strategic depth
- [ ] Orb respawn timer (10s if not collected) | Keeps map dynamic
- [ ] Fog of war rework (directional cone, sonar cooldown 5s) | More cat-mouse tactics
- [ ] Minimap in HUD | Aids orientation when camera zoomed
- [ ] Meta-progression & unlock system | Credits, shop (skins, themes), leaderboard, badges (localStorage)
- [ ] DPI-aware canvas scaling | Crisp on retina displays; high impact low effort
- [ ] Touch input safety (preventDefault) | Prevents accidental scroll; essential for mobile
- [ ] Reduce shadowBlur usage | Performance: lower blur radii, use gradients, selective glow

## v1.4 - Polish & Accessibility
- [ ] Colorblind mode (shape overlays for Hider/Seeker, palette toggle) | Accessibility improvement
- [ ] Hazard icons (⨳ for sand, ❄️ for ice) | Faster recognition than text labels
- [ ] Typo fix: "Collogation" → "Collection" in HelpManual.tsx
- [ ] Title branding consistency | "Neon Night Golf Chase" vs "NIGHT GOLF CHASE"
- [ ] Power-up placement bias | Ensure orb spawns within active player's initial view region

## v2.0 - Major Features
- [ ] Game mode variants (Time Attack, Endless)
- [ ] Map template system (Open Arena, Bumper Maze, etc.) | Adds strategic variety
- [ ] Audio (Web Audio API) | Whoosh, clang, explosion, chime
- [ ] Replay system | Record positions and tag events for sharing highlights
- [ ] PWA support | Add to Home Screen, offline play
- [ ] Accessibility: ARIA live regions | Screen reader announcements for turn changes, scores
- [ ] GameCanvas refactor into modules | Split monolith into physics, renderer, input, map, particles, camera
- [ ] Online multiplayer (WebRTC) | Remote play
- [ ] Android app store (Capacitor/TWA wrapper) | Deploy to Play Store

## Backlog / Ideas
- [ ] FPS counter (debug mode) | Monitor performance during spikes
- [ ] Particle system hard cap (e.g., 500) | Defensive against pathological bursts
- [ ] Pre-render static background (grid, floor) | Cache to offscreen canvas
- [ ] Minimap expansion (fog overlay) | Could show explored area
- [ ] Alternate color schemes | Let players pick cyan/amber, blue/orange, green/red
- [ ] Statistics tracking | Total turns survived, avg survival time, power-up usage, bounces
- [ ] Scoring bonus for distance/risk | Extra points for staying away from Seeker; chase points for quick tags
- [ ] Time Attack mode (already in v2?) but separate variant with countdown timer
