/**
 * Theme storage + resolution helpers.
 *
 * Two related values:
 *   - mode      : the user's *choice* — 'light' | 'dark' | 'system'
 *   - effective : the resolved theme that paints — 'light' | 'dark'
 *
 * When mode === 'system' the effective theme follows the OS preference
 * (and updates live when that preference changes).
 *
 * The DOM has two attributes on <html>:
 *   data-theme       — the effective theme (what CSS reads)
 *   data-theme-mode  — the user's choice (what the UI button reflects)
 *
 * An identical no-deps version of this resolver runs as an inline
 * <script> in index.html before React mounts, so the page paints with
 * the right theme on first byte (no flash).
 */

export const THEME_MODES = ['light', 'dark', 'system'];
export const STORAGE_KEY = 'theme-mode';

export function getStoredMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEME_MODES.includes(stored) ? stored : 'system';
  } catch (_e) {
    return 'system';
  }
}

export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function resolveTheme(mode) {
  return mode === 'system' ? getSystemTheme() : mode;
}

export function applyThemeToDom(mode) {
  const effective = resolveTheme(mode);
  const root = document.documentElement;
  root.setAttribute('data-theme', effective);
  root.setAttribute('data-theme-mode', mode);
  return effective;
}

export function persistMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (_e) {
    /* storage blocked — non-fatal, in-memory state still works for the session */
  }
}

/**
 * Subscribe to OS-level theme changes. Returns an unsubscribe fn.
 * The callback receives the new effective theme ('light' | 'dark').
 */
export function subscribeToSystem(callback) {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (event) => callback(event.matches ? 'dark' : 'light');
  // matchMedia.addEventListener is the modern API; older Safari needs addListener.
  if (mql.addEventListener) {
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }
  mql.addListener(handler);
  return () => mql.removeListener(handler);
}

/** Cycles light → dark → system → light → … */
export function nextMode(current) {
  const index = THEME_MODES.indexOf(current);
  return THEME_MODES[(index + 1) % THEME_MODES.length];
}
