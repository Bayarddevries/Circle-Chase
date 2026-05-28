# Turn Tag Playtesting Tools

## Quick Start

### 1. Manual Play + Export (Phase C)

1. Start the dev server: `npm run dev`
2. Open the game in your browser
3. Press `D` to enable debug recording (green "● REC" indicator appears in HUD)
4. Play a match normally
5. Press `E` at any time to download a JSON file with the full match log
6. Analyze the export: `python3 tools/analyze_match.py turn-tag-match-*.json`

### 2. Debug Overlay

- `D` — Toggle debug logging on/off
- `D` (when enabled) — Toggle the visual overlay panel
- `Shift+D` — Fully disable and clear log
- `E` — Export match data as JSON download

The overlay panel shows:
- Phase, turn number, frame count
- Active role, balls moving state
- Ball positions and velocities (Hider/Seeker)
- Round meta (turns survived, bumper hits, power-up collector)
- Distance between balls
- Recent events (collisions, tags, power-ups, near misses)

### 3. Analyzer

```bash
# Single match
python3 tools/analyze_match.py path/to/match.json

# Multiple matches
python3 tools/analyze_match.py match1.json match2.json match3.json

# Batch (all JSON in a directory)
python3 tools/analyze_match.py --batch path/to/exports/
```

The analyzer produces:
- Summary table (frames, events, turns, tags, near misses, bumpers, power-ups)
- Distance analysis (min/max/avg between balls)
- Velocity analysis (hider vs seeker speeds)
- Event breakdown by type
- Phase timeline with estimated durations
- **Anomaly detection** (stuck balls, missing events, short matches, frozen positions)
- Raw event log (last 20 events)

Reports are saved as `-report.md` alongside each JSON file.

## Data Format

The exported JSON contains:
```json
{
  "version": 1,
  "exportedAt": "2025-01-01T00:00:00.000Z",
  "phase": "match_over",
  "config": { "p1Name": "...", "p2Name": "...", ... },
  "debugLog": [
    { "type": "frame", "frame": 0, "phase": "playing", "hider": { "x": ..., "y": ..., "vx": ..., "vy": ... }, ... },
    { "type": "event", "eventType": "turn_swap", "data": { "newRole": "seeker" }, ... },
    ...
  ]
}
```

## Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| D | Toggle debug recording |
| D (when on) | Toggle overlay panel |
| Shift+D | Fully disable debug |
| E | Export match JSON |
