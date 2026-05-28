#!/usr/bin/env python3
"""
Turn Tag — Automated Playtest Runner

Runs N matches of Circle Chase in a headless browser, extracts structured
game logs via the debug overlay, and outputs JSON for analysis.

Architecture:
  1. Opens headless Chromium via Playwright
  2. Navigates to the game URL
  3. Sets window.__debugRequested = true (enables debug logging)
  4. Clicks through: menu → round_intro → playing → ... → match_over
  5. Shots are fired via window.__shoot(angle, power) — direct game API, no mouse events
  6. Extracts window.__gameLog after each match
  7. Outputs structured JSON for analyze.py

Usage:
    python tests/playtest/run_matches.py [--matches 10] [--output results.json] [--url URL]

See docs/PLAYTESTING.md for full documentation.
"""

import asyncio
import json
import random
import sys
import time
import argparse
from pathlib import Path
from playwright.async_api import async_playwright
import math

# ── Configuration ──────────────────────────────────────────────────────────

DEFAULT_MATCHES = 10
DEFAULT_OUTPUT = Path(__file__).parent / "results" / "latest.json"
GAME_URL = "http://localhost:3000"

# Timeouts (seconds)
TIMEOUT_NAVIGATE = 15
TIMEOUT_PHASE = 10
TIMEOUT_BALLS_STOP = 5
TIMEOUT_OVERLAY = 5

# Delay after shooting before checking if balls stopped (seconds)
SHOT_SETTLE_TIME = 2.0

# ── Helpers ────────────────────────────────────────────────────────────────

async def wait_for_phase(page, phase, timeout=TIMEOUT_PHASE):
    """Wait until the game reaches a specific phase.

    Returns True if phase reached, False on timeout.
    Reads window.__gamePhase which is updated by App.tsx on every phase change.
    """
    try:
        await page.wait_for_function(
            f"() => window.__gamePhase === '{phase}'",
            timeout=timeout * 1000
        )
        return True
    except Exception:
        return False


async def get_game_phase(page):
    """Read current game phase from the DOM.

    Returns the phase string (e.g. 'menu', 'round_intro', 'playing',
    'round_over', 'match_over') or 'unknown' if not set.
    """
    return await page.evaluate("() => window.__gamePhase || 'unknown'")


async def extract_game_log(page):
    """Extract the full debug game log from the browser.

    Reads window.__gameLog which is populated by debugOverlay.ts when
    debug mode is enabled. Returns a list of DebugEntry objects
    (frame entries + event entries).
    """
    log = await page.evaluate("() => window.__gameLog || []")
    return log


async def click_element(page, selector, timeout=TIMEOUT_OVERLAY):
    """Click an element if it exists.

    Returns True if element was found and clicked, False otherwise.
    """
    try:
        el = await page.wait_for_selector(selector, timeout=timeout * 1000)
        if el:
            await el.click()
            return True
    except Exception:
        return False


async def wait_for_balls_stop(page, timeout=TIMEOUT_BALLS_STOP):
    """Wait until balls stop moving (physics settled).

    Polls the game's frame counter via window.__gameLog to detect when
    physics has settled. Falls back to a fixed delay if no log data.
    """
    initial_count = await page.evaluate("() => (window.__gameLog || []).length")
    if initial_count > 0:
        for _ in range(int(timeout * 5)):  # check every 200ms
            await asyncio.sleep(0.2)
            current_count = await page.evaluate("() => (window.__gameLog || []).length")
            if current_count == initial_count:
                return True
            initial_count = current_count
        return True

    await asyncio.sleep(timeout)
    return True


async def get_ball_positions(page):
    """Read current ball positions from the game's exposed state.

    Returns dict with hider {x,y} and seeker {x,y} positions, or None.
    """
    try:
        state = await page.evaluate("() => window.__gameState || null")
        if state and 'hider' in state and 'seeker' in state:
            return {
                'hider': (state['hider']['x'], state['hider']['y']),
                'seeker': (state['seeker']['x'], state['seeker']['y']),
                'activeRole': state.get('activeRole', 'hider'),
            }
    except Exception:
        pass
    return None


async def smart_shoot(page):
    """Fire a shot using the game's __shoot() API with aiming toward the opponent.

    Reads ball positions from window.__gameState, calculates an aim angle
    toward the opponent ball (with some randomness for variety), and calls
    window.__shoot(angleDeg, power).

    Returns True if shot was fired, False on failure.
    """
    try:
        positions = await get_ball_positions(page)
        if not positions:
            # Fallback: random shot
            angle = random.uniform(0, 360)
            power = random.uniform(0.4, 0.9)
            result = await page.evaluate(f"() => window.__shoot({angle}, {power})")
            return result and result.get('ok', False)

        active_role = positions['activeRole']
        if active_role == 'hider':
            ax, ay = positions['hider']
            tx, ty = positions['seeker']
        else:
            ax, ay = positions['seeker']
            tx, ty = positions['hider']

        # Aim toward opponent with random offset (±30 degrees)
        base_angle = math.degrees(math.atan2(ty - ay, tx - ax))
        angle = base_angle + random.uniform(-30, 30)
        power = random.uniform(0.4, 0.95)

        result = await page.evaluate(f"() => window.__shoot({angle}, {power})")
        if result and result.get('ok'):
            return True
        else:
            # Fallback: random shot
            angle = random.uniform(0, 360)
            power = random.uniform(0.4, 0.9)
            result2 = await page.evaluate(f"() => window.__shoot({angle}, {power})")
            return result2 and result2.get('ok', False)

    except Exception as e:
        print(f"  [smart_shoot error: {e}]")
        return False


# ── Match Flow ─────────────────────────────────────────────────────────────

async def run_one_match(page, match_num, game_url):
    """Run a single match from menu to match_over.

    Flow:
      1. Navigate to game URL
      2. Set __debugRequested flag (picked up by GameCanvas on mount)
      3. Click START to begin match
      4. For each round: click "Start Round N" → shoot until round ends → click "PROCEED"
      5. Extract __gameLog at match_over

    Returns structured dict with match data.
    """
    match_data = {
        "match_num": match_num,
        "start_time": time.time(),
        "rounds_played": 0,
        "shots_fired": 0,
        "errors": [],
        "completed": False,
    }

    try:
        # ── Step 1: Navigate ──
        await page.goto(game_url, wait_until="networkidle")
        await asyncio.sleep(1)

        # Enable debug overlay via JS flags
        await page.evaluate("window.__debugRequested = true")
        await page.evaluate("window.__forceDebug = true")
        await asyncio.sleep(0.3)

        # ── Step 3: Start match ──
        started = False

        if await click_element(page, "#btn-main-start", timeout=5):
            started = True
        elif await click_element(page, "button:has-text('START')", timeout=3):
            started = True
        elif await click_element(page, "button:has-text('SURVIVE')", timeout=3):
            started = True

        if not started:
            await page.keyboard.press("Enter")
            await asyncio.sleep(1)

        # ── Step 4: Play rounds until match_over ──
        max_rounds = 10
        rounds_played = 0
        shots_fired = 0
        max_iterations = 300
        iteration = 0

        while rounds_played < max_rounds and iteration < max_iterations:
            iteration += 1
            phase = await get_game_phase(page)

            if phase == "match_over":
                match_data["completed"] = True
                break

            if phase == "menu":
                await click_element(page, "#btn-main-start", timeout=2)
                await asyncio.sleep(1)
                continue

            if phase == "round_intro" or phase == "sudden_death_intro":
                rounds_played += 1
                # Re-enable debug (flags persist but re-set as safety)
                await page.evaluate("window.__debugRequested = true; window.__forceDebug = true")
                # Click "Start Round N" button (button text from MatchOverlay)
                clicked = await click_element(page, "button:has-text('Start Round')", timeout=3)
                if not clicked:
                    # Fallback: try ENGAGE (old name, may not exist)
                    clicked = await click_element(page, "button:has-text('ENGAGE')", timeout=2)
                if not clicked:
                    # Fallback: try any button that looks like a start/proceed action
                    clicked = await click_element(page, "button:has-text('CONTINUE')", timeout=2)
                await asyncio.sleep(0.5)
                # Wait for playing phase
                await wait_for_phase(page, "playing", timeout=5)
                continue

            if phase == "round_over":
                clicked = await click_element(page, "button:has-text('PROCEED')", timeout=3)
                if not clicked:
                    clicked = await click_element(page, "button:has-text('Continue')", timeout=2)
                await asyncio.sleep(0.5)
                continue

            if phase == "playing":
                # Fire a shot using the direct API
                shot_ok = await smart_shoot(page)
                if shot_ok:
                    shots_fired += 1
                    await asyncio.sleep(SHOT_SETTLE_TIME)
                else:
                    # If __shoot failed, wait and retry next iteration
                    await asyncio.sleep(0.5)
                continue

            if phase == "tag_freeze":
                await asyncio.sleep(0.5)
                continue

            # Unknown phase — wait and retry
            await asyncio.sleep(0.5)

        # ── Step 5: Extract game log ──
        game_log = await extract_game_log(page)
        match_data["game_log"] = game_log
        match_data["log_entries"] = len(game_log)
        match_data["rounds_played"] = rounds_played
        match_data["shots_fired"] = shots_fired

        # Count event types
        event_counts = {}
        for entry in game_log:
            if entry.get("type") == "event":
                et = entry.get("eventType", "unknown")
                event_counts[et] = event_counts.get(et, 0) + 1
        match_data["event_counts"] = event_counts

    except Exception as e:
        match_data["errors"].append(str(e))

    match_data["end_time"] = time.time()
    match_data["duration"] = match_data["end_time"] - match_data["start_time"]

    return match_data


# ── Main ───────────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="Turn Tag Playtest Runner")
    parser.add_argument("--matches", type=int, default=DEFAULT_MATCHES,
                        help=f"Number of matches to run (default: {DEFAULT_MATCHES})")
    parser.add_argument("--output", type=str, default=str(DEFAULT_OUTPUT),
                        help=f"Output JSON file (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--url", type=str, default=GAME_URL,
                        help=f"Game URL (default: {GAME_URL})")
    parser.add_argument("--headless", action="store_true", default=True,
                        help="Run headless (default: True)")
    parser.add_argument("--visible", action="store_true",
                        help="Run with visible browser (overrides --headless)")
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    game_url = args.url
    headless = not args.visible

    print(f"🎮 Turn Tag Playtest Runner")
    print(f"   Matches: {args.matches}")
    print(f"   URL: {game_url}")
    print(f"   Output: {output_path}")
    print(f"   Mode: {'visible' if not headless else 'headless'}")
    print()

    all_results = {
        "metadata": {
            "game": "Turn Tag (Circle Chase)",
            "url": game_url,
            "matches_requested": args.matches,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        },
        "matches": [],
        "summary": {},
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            locale="en-US",
        )

        for i in range(1, args.matches + 1):
            print(f"  Match {i}/{args.matches}...", end=" ", flush=True)

            page = await context.new_page()

            # Capture console errors
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text)
                        if msg.type == "error" else None)

            match_data = await run_one_match(page, i, game_url)
            match_data["console_errors"] = console_errors

            status = "OK" if match_data["completed"] else "FAIL"
            duration = match_data.get("duration", 0)
            log_entries = match_data.get("log_entries", 0)
            shots = match_data.get("shots_fired", 0)
            errors = len(match_data.get("errors", [])) + len(console_errors)

            print(f"{status} {duration:.1f}s | {shots} shots | {log_entries} logs | {errors} errors")

            all_results["matches"].append(match_data)
            await page.close()

        await browser.close()

    # ── Summary ──
    completed = sum(1 for m in all_results["matches"] if m["completed"])
    total_errors = sum(len(m.get("errors", [])) for m in all_results["matches"])
    total_console = sum(len(m.get("console_errors", [])) for m in all_results["matches"])
    total_log_entries = sum(m.get("log_entries", 0) for m in all_results["matches"])
    total_shots = sum(m.get("shots_fired", 0) for m in all_results["matches"])
    avg_duration = (sum(m.get("duration", 0) for m in all_results["matches"])
                    / max(len(all_results["matches"]), 1))

    all_results["summary"] = {
        "matches_completed": completed,
        "matches_failed": args.matches - completed,
        "total_shots_fired": total_shots,
        "total_game_errors": total_errors,
        "total_console_errors": total_console,
        "total_log_entries": total_log_entries,
        "avg_match_duration": round(avg_duration, 2),
    }

    with open(output_path, "w") as f:
        json.dump(all_results, f, indent=2)

    print()
    print(f"Summary: {completed}/{args.matches} matches completed")
    print(f"   Total shots fired: {total_shots}")
    print(f"   Total log entries: {total_log_entries}")
    print(f"   Game errors: {total_errors} | Console errors: {total_console}")
    print(f"   Avg duration: {avg_duration:.1f}s")
    print(f"   Output: {output_path}")

    return 0 if completed == args.matches else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
