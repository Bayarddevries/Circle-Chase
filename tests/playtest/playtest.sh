#!/bin/bash
# Turn Tag — Full Playtest Pipeline
# Runs N matches and generates a report.
#
# Usage:
#   ./playtest.sh [matches] [game-url]
#
# Examples:
#   ./playtest.sh 10                              # 10 matches on localhost:3000
#   ./playtest.sh 5 https://bayarddevries.github.io/Circle-Chase/  # 5 matches on live site

set -e

MATCHES="${1:-10}"
URL="${2:-http://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
REPORT_DIR="$SCRIPT_DIR/reports"
PYTHON="/home/bayarddevries/.hermes/hermes-agent/venv/bin/python"

mkdir -p "$RESULTS_DIR" "$REPORT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$RESULTS_DIR/playtest_${TIMESTAMP}.json"
REPORT_FILE="$REPORT_DIR/report_${TIMESTAMP}.md"

echo "🎮 Turn Tag Playtest Pipeline"
echo "   Matches: $MATCHES"
echo "   URL: $URL"
echo "   Results: $RESULTS_FILE"
echo "   Report: $REPORT_FILE"
echo ""

# Step 1: Run matches
echo "▶ Running $MATCHES matches..."
$PYTHON "$SCRIPT_DIR/run_matches.py" \
    --matches "$MATCHES" \
    --output "$RESULTS_FILE" \
    --url "$URL" \
    --headless

echo ""

# Step 2: Analyze results
echo "▶ Analyzing results..."
$PYTHON "$SCRIPT_DIR/analyze.py" \
    "$RESULTS_FILE" \
    --output "$REPORT_FILE"

echo ""
echo "✅ Playtest complete!"
echo "   cat $REPORT_FILE"
