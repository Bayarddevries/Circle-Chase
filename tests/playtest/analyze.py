#!/usr/bin/env python3
"""
Turn Tag — Playtest Analyzer

Consumes the JSON output from run_matches.py and produces a structured
playtest report with anomaly detection and balance analysis.

Usage:
    python tests/playtest/analyze.py results.json [--output report.md]
"""

import json
import sys
import argparse
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime

# ── Analysis Functions ─────────────────────────────────────────────────────

def detect_anomalies(matches):
    """Scan game logs for anomalies and bugs."""
    anomalies = []

    for match in matches:
        match_num = match.get("match_num", "?")
        game_log = match.get("game_log", [])

        # Track per-round state
        round_scores = {"hider": 0, "seeker": 0}
        round_num = 0

        for entry in game_log:
            if entry.get("type") != "event":
                continue

            et = entry.get("eventType")
            data = entry.get("data", {})
            frame = entry.get("frame", "?")

            # Check for negative scores
            if et == "round_end":
                hs = data.get("hiderScore", 0)
                ss = data.get("seekerScore", 0)
                if hs < 0 or ss < 0:
                    anomalies.append({
                        "match": match_num,
                        "type": "negative_score",
                        "severity": "critical",
                        "detail": f"Frame {frame}: hider={hs}, seeker={ss}",
                    })

            # Check for zero-duration rounds (round_end immediately after round_start)
            if et == "round_start":
                round_num += 1

            # Check for extremely high turn counts (possible stuck ball)
            if et == "turn_swap":
                turns = data.get("turnsSurvived", 0)
                if turns > 50:
                    anomalies.append({
                        "match": match_num,
                        "type": "excessive_turns",
                        "severity": "warning",
                        "detail": f"Frame {frame}: {turns} turns survived (possible stuck ball)",
                    })

            # Check for tag attempts with zero distance (ball collision bug)
            if et == "tag_attempt":
                dist = data.get("distance", None)
                if dist is not None and dist < 0:
                    anomalies.append({
                        "match": match_num,
                        "type": "negative_distance",
                        "severity": "critical",
                        "detail": f"Frame {frame}: tag distance={dist}",
                    })

            # Check for bumper hits exceeding reasonable limits
            if et == "bumper_hit":
                combo = data.get("comboCount", 0)
                if combo > 20:
                    anomalies.append({
                        "match": match_num,
                        "type": "excessive_combo",
                        "severity": "info",
                        "detail": f"Frame {frame}: bumper combo={combo}",
                    })

        # Check for console errors
        for err in match.get("console_errors", []):
            anomalies.append({
                "match": match_num,
                "type": "console_error",
                "severity": "critical",
                "detail": err[:200],
            })

    return anomalies


def analyze_balance(matches):
    """Extract balance metrics from game logs."""
    stats = {
        "total_matches": len(matches),
        "completed_matches": 0,
        "total_rounds": 0,
        "total_turns": 0,
        "runner_wins": 0,
        "chaser_wins": 0,
        "ties": 0,
        "avg_turns_per_round": 0,
        "avg_round_duration_frames": 0,
        "powerups_collected": Counter(),
        "bumper_hits_total": 0,
        "near_misses": 0,
        "score_breakdown": {
            "hider_avg": 0,
            "seeker_avg": 0,
        },
    }

    all_hider_scores = []
    all_seeker_scores = []
    all_turns = []

    for match in matches:
        if not match.get("completed"):
            continue

        stats["completed_matches"] += 1
        game_log = match.get("game_log", [])

        for entry in game_log:
            if entry.get("type") != "event":
                continue

            et = entry.get("eventType")
            data = entry.get("data", {})

            if et == "round_end":
                stats["total_rounds"] += 1
                winner = data.get("roundWinner")
                if winner == "hider" or winner == "runner":
                    stats["runner_wins"] += 1
                elif winner == "seeker" or winner == "chaser":
                    stats["chaser_wins"] += 1
                elif winner == "tie":
                    stats["ties"] += 1

                turns = data.get("turnsSurvived", 0)
                all_turns.append(turns)

                hb = data.get("hiderBreakdown", {})
                sb = data.get("seekerBreakdown", {})
                if hb:
                    all_hider_scores.append(sum(hb.values()) if isinstance(hb, dict) else 0)
                if sb:
                    all_seeker_scores.append(sum(sb.values()) if isinstance(sb, dict) else 0)

            if et == "powerup_collect":
                pu = data.get("orbType", "unknown")
                stats["powerups_collected"][pu] += 1

            if et == "bumper_hit":
                stats["bumper_hits_total"] += 1

            if et == "near_miss":
                stats["near_misses"] += 1

    # Averages
    if all_turns:
        stats["avg_turns_per_round"] = round(sum(all_turns) / len(all_turns), 1)
        stats["max_turns"] = max(all_turns)
        stats["min_turns"] = min(all_turns)

    if all_hider_scores:
        stats["score_breakdown"]["hider_avg"] = round(sum(all_hider_scores) / len(all_hider_scores), 1)

    if all_seeker_scores:
        stats["score_breakdown"]["seeker_avg"] = round(sum(all_seeker_scores) / len(all_seeker_scores), 1)

    return stats


def generate_report(anomalies, balance, output_path=None):
    """Generate a Markdown playtest report."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    lines = []
    lines.append("# 🎮 Turn Tag Playtest Report")
    lines.append(f"\n**Generated:** {now}\n")

    # Summary
    lines.append("## 📊 Summary\n")
    lines.append(f"| Metric | Value |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Matches Requested | {balance['total_matches']} |")
    lines.append(f"| Matches Completed | {balance['completed_matches']} |")
    lines.append(f"| Total Rounds Played | {balance['total_rounds']} |")
    lines.append(f"| Runner Wins | {balance['runner_wins']} |")
    lines.append(f"| Chaser Wins | {balance['chaser_wins']} |")
    lines.append(f"| Ties | {balance['ties']} |")
    lines.append(f"| Avg Turns/Round | {balance['avg_turns_per_round']} |")
    lines.append(f"| Max Turns (single round) | {balance.get('max_turns', 'N/A')} |")
    lines.append(f"| Bumper Hits (total) | {balance['bumper_hits_total']} |")
    lines.append(f"| Near Misses | {balance['near_misses']} |")
    lines.append("")

    # Scoring
    lines.append("## 🏆 Score Analysis\n")
    lines.append(f"| | Hider (Runner) | Seeker (Chaser) |")
    lines.append(f"|---|---|---|")
    lines.append(f"| Average Score | {balance['score_breakdown']['hider_avg']} | {balance['score_breakdown']['seeker_avg']} |")
    lines.append(f"| Win Rate | {balance['runner_wins']}/{balance['total_rounds']} | {balance['chaser_wins']}/{balance['total_rounds']} |")
    lines.append("")

    # Power-ups
    if balance["powerups_collected"]:
        lines.append("## ⚡ Power-Up Collection\n")
        for pu, count in balance["powerups_collected"].most_common():
            lines.append(f"- **{pu}**: {count} collected")
        lines.append("")

    # Anomalies
    lines.append("## 🐛 Anomalies & Bugs\n")
    if not anomalies:
        lines.append("✅ No anomalies detected.\n")
    else:
        critical = [a for a in anomalies if a["severity"] == "critical"]
        warnings = [a for a in anomalies if a["severity"] == "warning"]
        info = [a for a in anomalies if a["severity"] == "info"]

        lines.append(f"**Total anomalies: {len(anomalies)}** ({len(critical)} critical, {len(warnings)} warnings, {len(info)} info)\n")

        if critical:
            lines.append("### 🔴 Critical\n")
            for a in critical:
                lines.append(f"- Match {a['match']}: **{a['type']}** — {a['detail']}")
            lines.append("")

        if warnings:
            lines.append("### 🟡 Warnings\n")
            for a in warnings:
                lines.append(f"- Match {a['match']}: **{a['type']}** — {a['detail']}")
            lines.append("")

        if info:
            lines.append("### 🔵 Info\n")
            for a in info:
                lines.append(f"- Match {a['match']}: **{a['type']}** — {a['detail']}")
            lines.append("")

    # Balance assessment
    lines.append("## ⚖️ Balance Assessment\n")
    if balance["total_rounds"] > 0:
        runner_rate = balance["runner_wins"] / balance["total_rounds"] * 100
        chaser_rate = balance["chaser_wins"] / balance["total_rounds"] * 100

        if 40 <= runner_rate <= 60:
            lines.append("✅ **Balanced** — Win rates are within 40/60 split.\n")
        elif runner_rate > 60:
            lines.append(f"⚠️ **Runner-favored** — Runner wins {runner_rate:.0f}% of rounds.\n")
        else:
            lines.append(f"⚠️ **Chaser-favored** — Chaser wins {chaser_rate:.0f}% of rounds.\n")

        if balance["avg_turns_per_round"] < 3:
            lines.append("⚠️ Rounds are ending very quickly (< 3 turns avg). May indicate overly aggressive AI or weak Runner survival.\n")
        elif balance["avg_turns_per_round"] > 15:
            lines.append("⚠️ Rounds are lasting very long (> 15 turns avg). May indicate balls getting stuck or easily avoidable AI.\n")

    lines.append("---")
    lines.append(f"*Report generated by Turn Tag Playtest Analyzer*")

    report = "\n".join(lines)

    if output_path:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            f.write(report)
        print(f"📄 Report written to: {output_path}")

    return report


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Turn Tag Playtest Analyzer")
    parser.add_argument("input", type=str, help="JSON results from run_matches.py")
    parser.add_argument("--output", type=str, default=None, help="Output Markdown report path")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ Input file not found: {input_path}")
        return 1

    with open(input_path) as f:
        data = json.load(f)

    matches = data.get("matches", [])

    if not matches:
        print("❌ No match data found in input file.")
        return 1

    print(f"🔬 Analyzing {len(matches)} matches...")

    anomalies = detect_anomalies(matches)
    balance = analyze_balance(matches)

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        output_path = input_path.parent / "reports" / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"

    report = generate_report(anomalies, balance, output_path)
    print(report[:500] + "...")

    return 0


if __name__ == "__main__":
    sys.exit(main())
