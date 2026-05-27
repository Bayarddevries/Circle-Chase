#!/usr/bin/env python3
"""
Turn Tag — Automated Playtest Runner

Runs N matches of Circle Chase in a headless browser, extracts structured
game logs via the debug overlay, and outputs JSON for analysis.

Architecture:
  1. Opens headless Chromium via Playwright
  2. Navigates to the game URL
  3. Sets window.__debugRequested = true (enables debug logging on GameCanvas mount)
  4. Clicks through menu → round_intro → playing → ... → match_over
  5. Simulates slingshot shots via canvas mouse events
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
SHOT_SETTLE_TIME = 1.5

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

    Polls the game at 200ms intervals by checking if the frame counter
    in window.__gameLog has stopped advancing (indicating physics is idle).
    Falls back to a fixed delay if no game log data is available.
    """
    # If we have game log entries, check if frame counter is still advancing
    initial_count = await page.evaluate("() => (window.__gameLog || []).length")
    if initial_count > 0:
        for _ in range(int(timeout * 5)):  # check every 200ms
            await asyncio.sleep(0.2)
            current_count = await page.evaluate("() => (window.__gameLog || []).length")
            if current_count == initial_count:
                # No new frames → balls likely stopped
                return True
            initial_count = current_count
        return True

    # Fallback: fixed delay
    await asyncio.sleep(timeout)
    return True


async def simulate_slingshot(page, canvas_selector="canvas"):
    """Simulate a slingshot shot: click-drag-release on the canvas.

    Generates a random aim direction and power, then dispatches
    mouse down → move → mouse up events to the canvas element.

    Returns True if the shot was dispatched, False if canvas not found.

    Note: The game's slingshot expects drag start near the active ball
    and drag away from it (pull-back). This simulation drags in a random
    direction which may not perfectly mimic player behavior but is
    sufficient for playtesting physics and collision systems.
    """
    canvas = await page.query_selector(canvas_selector)
    if not canvas:
        return False

    box = await canvas.bounding_box()
    if not box:
        return False

    # Random start position (somewhere on the canvas)
    start_x = box["x"] + box["width"] * random.uniform(0.2, 0.8)
    start_y = box["y"] + box["height"] * random.uniform(0.2, 0.8)

    # Random drag direction and power
    angle = random.uniform(0, 2 * math.pi)
    power = random.uniform(30, 120)
    end_x = start_x + power * math.cos(angle)
    end_y = start_y + power * math.sin(angle)

    # Clamp to canvas bounds
    end_x = max(box["x"] + 10, min(box["x"] + box["width"] - 10, end_x))
    end_y = max(box["y"] + 10, min(box["y"] + box["height"] - 10, end_y))

    # Perform drag: move → down → move → up
    await page.mouse.move(start_x, start_y)
    await page.mouse.down()
    await asyncio.sleep(random.uniform(0.05, 0.15))
    await page.mouse.move(end_x, end_y)
    await asyncio.sleep(random.uniform(0.05, 0.15))
    await page.mouse.up()
    return True


# ── Match Flow ─────────────────────────────────────────────────────────────

async def run_one_match(page, match_num, game_url):
    """Run a single match from menu to match_or match_over.

    Flow:
      1. Navigate to game URL
      2. Set __debugRequested flag (picked up by GameCanvas on mount)
      3. Click START to begin match
      4. For each round: click ENGAGE → simulate shots until round ends → click PROCEED
      5. Extract __gameLog at match_over

    Returns structured dict with:
      - match_num: int
      - completed: bool (reached match_over)
      - duration: float (seconds)
      - game_log: list of DebugEntry
      - log_entries: int (count)
      - event_counts: dict of event type → count
      - console_errors: list of js error strings
      - errors: list of python-side error strings
    """
    match_data = {
        "match_num": match_num,
        "start_time": time.time(),
        "events": [],
        "rounds": [],
        "errors": [],
        "completed": False,
    }

    try:
        # ── Step 1: Navigate ──
        await page.goto(game_url, wait_until="networkidle")
        await asyncio.sleep(1)

        # ── Step 2: Enable debug overlay via JS flag ──
        # This sets a global that GameCanvas reads on mount.
        # The flag is in App.tsx's global keydown handler, AND consumed
        # by GameCanvas's useEffect on mount. Either path enables it.
        await page.evaluate("window.__debugRequested = true")
        await asyncio.sleep(0.3)

        # ── Step 3: Start match ──
        started = False

        # Try clicking the main START button (selector from MainMenu)
        if await click_element(page, "#btn-main-start", timeout=5):
            started = True
        elif await click_element(page, "button:has-text('START')", timeout=3):
            started = True
        elif await click_element(page, "button:has-text('SURVIVE')", timeout=3):
            started = True

        if not started:
            # Fallback: press Enter which may trigger the focused button
            await page.keyboard.press("Enter")
            await asyncio.sleep(1)

        # ── Step 4: Play rounds until match_over ──
        max_rounds = 10
        round_num = 0
        max_iterations = 300  # Safety limit to prevent infinite loops
        iteration = 0

        while round_num < max_rounds and iteration < max_iterations:
            iteration += 1
            phase = await get_game_phase(page)

            if phase == "match_over":
                match_data["completed"] = True
                break

            if phase == "menu":
                # Still on menu — try clicking START again
                await click_element(page, "#btn-main-start", timeout=2)
                await asyncio.sleep(1)
                continue

            if phase == "round_intro" or phase == "sudden_death_intro":
                round_num += 1
                # Ensure debug is enabled (in case it didn't catch on first mount)
                await page.evaluate("""
                    if (!window.__gameLog || window.__gameLog.length === 0) {
                        window.__debugRequested = true;
                    }
                """)
                await click_element(page, "button:has-text('ENGAGE')", timeout=3)
                await asyncio.sleep(0.5)
                # Wait for playing phase
                await wait_for_phase(page, "playing", timeout=5)
                continue

            if phase == "round_over":
                await click_element(page, "button:has-text('PROCEED')", timeout=3)
                await asyncio.sleep(0.5)
                continue

            if phase == "playing":
                # Simulate a shot
                shot_ok = await simulate_slingshot(page)
                if shot_ok:
                    await asyncio.sleep(SHOT_SETTLE_TIME)
                continue

            if phase == "tag_freeze":
                # Tag animation playing — wait for it to resolve
                await asyncio.sleep(0.5)
                continue

            # Unknown phase — wait and retry
            await asyncio.sleep(0.5)

        # ── Step 5: Extract game log ──
        game_log = await extract_game_log(page)
        match_data["game_log"] = game_log
        match_data["log_entries"] = len(game_log)

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
            errors = len(match_data.get("errors", [])) + len(console_errors)

            print(f"{status} {duration:.1f}s | {log_entries} log entries | {errors} errors")

            all_results["matches"].append(match_data)
            await page.close()

        await browser.close()

    # ── Summary ──
    completed = sum(1 for m in all_results["matches"] if m["completed"])
    total_errors = sum(len(m.get("errors", [])) for m in all_results["matches"])
    total_console = sum(len(m.get("console_errors", [])) for m in all_results["matches"])
    total_log_entries = sum(m.get("log_entries", 0) for m in all_results["matches"])
    avg_duration = (sum(m.get("duration", 0) for m in all_results["matches"])
                    / max(len(all_results["matches"]), 1))

    all_results["summary"] = {
        "matches_completed": completed,
        "matches_failed": args.matches - completed,
        "total_game_errors": total_errors,
        "total_console_errors": total_console,
        "total_log_entries": total_log_entries,
        "avg_match_duration": round(avg_duration, 2),
    }

    with open(output_path, "w") as f:
        json.dump(all_results, f, indent=2)

    print()
    print(f"Summary: {completed}/{args.matches} matches completed")
    print(f"   Total log entries: {total_log_entries}")
    print(f"   Game errors: {total_errors} | Console errors: {total_console}")
    print(f"   Avg duration: {avg_duration:.1f}s")
    print(f"   Output: {output_path}")

    return 0 if completed == args.matches else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
