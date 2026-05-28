#!/usr/bin/env python3
"""
Turn Tag Match Analyzer
Reads exported match JSON files and produces structured Markdown reports.

Usage:
    python3 analyze_match.py <match.json>           # single match
    python3 analyze_match.py <match1.json> <match2.json> ...  # compare matches
    python3 analyze_match.py --batch <dir>          # analyze all JSON in directory
"""

import json
import sys
import os
from pathlib import Path
from collections import Counter


def load_match(path: str) -> dict:
    with open(path) as f:
        return json.load(f)


def analyze_single(match: dict) -> str:
    log = match.get("debugLog", [])
    config = match.get("config", {})
    exported_at = match.get("exportedAt", "unknown")

    frames = [e for e in log if e.get("type") == "frame"]
    events = [e for e in log if e.get("type") == "event"]

    # ── Basic stats ──
    total_frames = len(frames)
    total_events = len(events)
    event_types = Counter(e.get("eventType", "unknown") for e in events)

    # ── Ball movement analysis ──
    hider_positions = [(f["hider"]["x"], f["hider"]["y"]) for f in frames if "hider" in f]
    seeker_positions = [(f["seeker"]["x"], f["seeker"]["y"]) for f in frames if "seeker" in f]

    # Distance over time
    distances = []
    for f in frames:
        if "hider" in f and "seeker" in f:
            d = ((f["hider"]["x"] - f["seeker"]["x"])**2 + (f["hider"]["y"] - f["seeker"]["y"])**2) ** 0.5
            distances.append(d)

    min_dist = min(distances) if distances else 0
    max_dist = max(distances) if distances else 0
    avg_dist = sum(distances) / len(distances) if distances else 0

    # ── Turn analysis ──
    turn_swaps = [e for e in events if e.get("eventType") == "turn_swap"]
    num_turns = len(turn_swaps)

    # ── Tag analysis ──
    tags = [e for e in events if e.get("eventType") == "tag_attempt"]
    num_tags = len(tags)

    # ── Power-up analysis ──
    powerup_collects = [e for e in events if e.get("eventType") == "powerup_collect"]
    powerup_types = Counter(e.get("data", {}).get("orbType", "unknown") for e in powerup_collects)

    # ── Bumper hits ──
    bumper_hits = [e for e in events if e.get("eventType") == "bumper_hit"]
    num_bumper_hits = len(bumper_hits)

    # ── Near misses ──
    near_misses = [e for e in events if e.get("eventType") == "near_miss"]
    num_near_misses = len(near_misses)

    # ── Velocity analysis ──
    hider_speeds = [(f["hider"]["vx"]**2 + f["hider"]["vy"]**2)**0.5 for f in frames if "hider" in f]
    seeker_speeds = [(f["seeker"]["vx"]**2 + f["seeker"]["vy"]**2)**0.5 for f in frames if "seeker" in f]

    max_hider_speed = max(hider_speeds) if hider_speeds else 0
    max_seeker_speed = max(seeker_speeds) if seeker_speeds else 0
    avg_hider_speed = sum(hider_speeds) / len(hider_speeds) if hider_speeds else 0
    avg_seeker_speed = sum(seeker_speeds) / len(seeker_speeds) if seeker_speeds else 0

    # ── Phase timeline ──
    phases = []
    last_phase = None
    phase_start = 0
    for i, f in enumerate(frames):
        p = f.get("phase", "?")
        if p != last_phase:
            if last_phase is not None:
                phases.append((last_phase, phase_start, i - 1))
            last_phase = p
            phase_start = i
    if last_phase is not None:
        phases.append((last_phase, phase_start, len(frames) - 1))

    # ── Build report ──
    p1 = config.get("p1Name", "P1")
    p2 = config.get("p2Name", "P2")
    best_of = config.get("bestOfRounds", "?")
    is_cpu = config.get("isCpu", False)
    difficulty = config.get("difficulty", "N/A")
    game_mode = config.get("gameMode", "standard")

    lines = []
    lines.append(f"# Turn Tag Match Report")
    lines.append(f"")
    lines.append(f"**Exported:** {exported_at}")
    lines.append(f"**Players:** {p1} vs {p2}")
    lines.append(f"**Mode:** {game_mode} | Best of: {best_of} | CPU: {is_cpu} ({difficulty})")
    lines.append(f"**Final phase:** {match.get('phase', 'unknown')}")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"")
    lines.append(f"## Summary")
    lines.append(f"")
    lines.append(f"| Metric | Value |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Total frames logged | {total_frames} |")
    lines.append(f"| Total events | {total_events} |")
    lines.append(f"| Turn swaps | {num_turns} |")
    lines.append(f"| Tags | {num_tags} |")
    lines.append(f"| Near misses | {num_near_misses} |")
    lines.append(f"| Bumper hits | {num_bumper_hits} |")
    lines.append(f"| Power-ups collected | {len(powerup_collects)} |")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"")
    lines.append(f"## Distance Analysis")
    lines.append(f"")
    lines.append(f"| Metric | Value |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Min distance | {min_dist:.1f} px |")
    lines.append(f"| Max distance | {max_dist:.1f} px |")
    lines.append(f"| Avg distance | {avg_dist:.1f} px |")
    lines.append(f"")
    if min_dist < 50:
        lines.append(f"⚠️ **Very close encounter detected** — balls within {min_dist:.0f}px. {'Tag likely occurred.' if num_tags > 0 else 'No tag recorded — possible near-miss.'}")
        lines.append(f"")
    lines.append(f"---")
    lines.append(f"")
    lines.append(f"## Velocity Analysis")
    lines.append(f"")
    lines.append(f"| Metric | Hider | Seeker |")
    lines.append(f"|--------|-------|--------|")
    lines.append(f"| Max speed | {max_hider_speed:.1f} | {max_seeker_speed:.1f} |")
    lines.append(f"| Avg speed | {avg_hider_speed:.1f} | {avg_seeker_speed:.1f} |")
    lines.append(f"")
    if max_seeker_speed > max_hider_speed * 1.5:
        lines.append(f"📊 Seeker max speed is significantly higher — seeker speed multiplier is working.")
        lines.append(f"")
    lines.append(f"---")
    lines.append(f"")
    lines.append(f"## Event Breakdown")
    lines.append(f"")
    lines.append(f"| Event Type | Count |")
    lines.append(f"|------------|-------|")
    for etype, count in event_types.most_common():
        lines.append(f"| {etype} | {count} |")
    lines.append(f"")
    if powerup_types:
        lines.append(f"### Power-ups Collected")
        lines.append(f"")
        lines.append(f"| Type | Count |")
        lines.append(f"|------|-------|")
        for ptype, count in powerup_types.most_common():
            lines.append(f"| {ptype} | {count} |")
        lines.append(f"")
    lines.append(f"---")
    lines.append(f"")
    lines.append(f"## Phase Timeline")
    lines.append(f"")
    lines.append(f"| Phase | Frames | Duration (est.) |")
    lines.append(f"|-------|--------|-----------------|")
    for phase, start, end in phases:
        duration_frames = end - start + 1
        est_seconds = duration_frames / 60  # assuming 60fps
        lines.append(f"| {phase} | {start}-{end} ({duration_frames} frames) | ~{est_seconds:.1f}s |")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"")
    lines.append(f"## Issues & Anomalies")
    lines.append(f"")
    issues = []

    # Check for stuck balls (no movement for extended period)
    if total_frames > 100:
        zero_speed_frames = sum(
            1 for f in frames
            if abs(f.get("hider", {}).get("vx", 0)) < 0.01
            and abs(f.get("hider", {}).get("vy", 0)) < 0.01
            and abs(f.get("seeker", {}).get("vx", 0)) < 0.01
            and abs(f.get("seeker", {}).get("vy", 0)) < 0.01
        )
        stuck_ratio = zero_speed_frames / total_frames
        if stuck_ratio > 0.8 and num_turns < 2:
            issues.append(f"🔴 **Balls stuck**: {zero_speed_frames}/{total_frames} frames ({stuck_ratio:.0%}) with zero velocity. Only {num_turns} turn swaps detected. Possible turn-swap bug.")

    # Check for missing events
    if total_frames > 0 and total_events == 0:
        issues.append(f"🟡 **No events logged**: {total_frames} frames captured but zero events. Event logging may not be triggering.")

    # Check for very short matches
    if num_turns < 2 and num_tags == 0:
        issues.append(f"🟡 **Very short match**: Only {num_turns} turn swaps and no tags. Match may have ended prematurely.")

    # Check for repeated positions (ball not moving despite non-zero velocity)
    if len(hider_positions) > 10:
        unique_hider = len(set(hider_positions))
        if unique_hider < len(hider_positions) * 0.1:
            issues.append(f"🔴 **Hider position stuck**: Only {unique_hider} unique positions out of {len(hider_positions)} frames. Ball may be frozen.")

    if len(seeker_positions) > 10:
        unique_seeker = len(set(seeker_positions))
        if unique_seeker < len(seeker_positions) * 0.1:
            issues.append(f"🔴 **Seeker position stuck**: Only {unique_seeker} unique positions out of {len(seeker_positions)} frames. Ball may be frozen.")

    if issues:
        for issue in issues:
            lines.append(f"- {issue}")
    else:
        lines.append(f"✅ No anomalies detected.")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"")
    lines.append(f"## Raw Event Log (last 20)")
    lines.append(f"")
    lines.append(f"```")
    for evt in events[-20:]:
        frame = evt.get("frame", "?")
        etype = evt.get("eventType", "?")
        data = json.dumps(evt.get("data", {}))[:80]
        lines.append(f"  [{frame:>6}] {etype}: {data}")
    lines.append(f"```")
    lines.append(f"")

    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    paths = []
    if sys.argv[1] == "--batch":
        dir_path = sys.argv[2] if len(sys.argv) > 2 else "."
        dir_path = Path(dir_path)
        paths = sorted(dir_path.glob("*.json"))
        if not paths:
            print(f"No JSON files found in {dir_path}")
            sys.exit(1)
        print(f"Found {len(paths)} match files in {dir_path}")
    else:
        paths = sys.argv[1:]

    for path in paths:
        path = str(path)
        print(f"\n{'='*60}")
        print(f"Analyzing: {path}")
        print(f"{'='*60}\n")
        try:
            match = load_match(path)
            report = analyze_single(match)
            print(report)

            # Save report alongside the JSON
            report_path = path.replace(".json", "-report.md")
            with open(report_path, "w") as f:
                f.write(report)
            print(f"\nReport saved to: {report_path}")
        except Exception as e:
            print(f"Error analyzing {path}: {e}")


if __name__ == "__main__":
    main()
