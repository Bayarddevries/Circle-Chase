/**
 * Haptic vibration feedback for Turn Tag.
 * Uses the Vibration API with graceful fallback.
 */

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

type VibratePattern = number | number[];

function vibrate(pattern: VibratePattern): void {
  if (canVibrate()) {
    navigator.vibrate(pattern);
  }
}

/** Short tap — bumper hit, UI click */
export function tap(): void {
  vibrate(8);
}

/** Medium buzz — near miss, orb collect */
export function buzz(): void {
  vibrate(25);
}

/** Strong pulse — tag impact */
export function strong(): void {
  vibrate([80, 40]);
}

/** Triple pattern — match over */
export function triple(): void {
  vibrate([40, 20, 40, 20, 40]);
}

/** Quick double — round over */
export function doubleTap(): void {
  vibrate([15, 10, 15]);
}

/** Launch feeling */
export function launch(): void {
  vibrate(12);
}
