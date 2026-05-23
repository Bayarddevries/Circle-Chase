# Circle Chase — Tasks

## Branding & Naming
- [ ] Rename game — "Night Golf Chase" is bad; pick something better
- [ ] Define consistent naming conventions for Hider/Seeker roles
- [ ] Standardize title branding across index.html, MainMenu, and all UI

## Visual Design
- [ ] Establish consistent colour scheme / design language
- [ ] Improve power-up orb visuals — better colour coding, distinct shapes per type
- [ ] Improve player ball markers — clearer identity, better contrast
- [ ] Redesign hazard zones — clearer slow/fast zone visuals with icons (⨳ sand, ❄️ ice)
- [ ] Remove AI copy from UI — simplify all text labels

## Gameplay
- [ ] AI Opponent — single-player mode with difficulty levels (Easy/Med/Hard)
- [ ] Power-up balance rework — Laser speed buff, Iron ice immunity, new Cloak/Magnet
- [ ] Orb respawn timer (10s) if not collected
- [ ] Fog of war rework — directional cone, sonar cooldown
- [ ] Better define slow/fast zones with clearer visual language

## Polish
- [ ] Minimap in HUD
- [ ] Colorblind mode — shape overlays + palette toggle
- [ ] Fix typo "Collogation" in HelpManual.tsx
- [ ] PWA support — installable, offline-capable
- [ ] ARIA live regions for accessibility

## Infrastructure
- [ ] Set up GitHub Actions CI/CD for auto-deploy to GitHub Pages
- [ ] Online multiplayer — WebRTC or server-based

## Completed
- [x] Project scaffolded (React + TypeScript + Vite + TailwindCSS)
- [x] Main menu, canvas physics, slingshot controls
- [x] Procedural map generation (bumpers, hazards, power-up orb)
- [x] Turn-based gameplay, tag detection, score tracking
- [x] Fog of War, sonar ping, particle effects, slow-mo
- [x] Power-up system (laser, superball, iron, sonar)
- [x] Sudden Death mode, round/match flow screens
- [x] Help manual modal
- [x] DPI scaling, touch safety, shadowBlur reduction
- [x] Particle cap (500), constants extraction
- [x] Meta-progression scaffold (credits, shop, leaderboard, badges)
- [x] GitHub Pages deployment workflow
