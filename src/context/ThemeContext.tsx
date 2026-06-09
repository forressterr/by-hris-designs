import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  applyThemeToDom,
  getStoredMode,
  nextMode,
  persistMode,
  resolveTheme,
  subscribeToSystem,
} from '../lib/theme';
import type { ThemeMode, EffectiveTheme } from '../lib/theme';

/**
 * ThemeContext keeps the user's mode choice in sync with:
 *   - localStorage (persists across sessions)
 *   - the <html> data attributes (drives CSS)
 *   - the OS preference (only while mode === 'system')
 *
 * Consumers get { mode, effectiveTheme, setMode, cycleMode }.
 *
 * The provider seeds its initial state from the same source the inline
 * <head> script used, so React's first render matches what's already
 * painted — no hydration mismatch, no theme flicker.
 */
interface ThemeContextValue {
  mode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  setMode: (next: ThemeMode) => void;
  cycleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredMode());
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    resolveTheme(mode),
  );

  // Apply the current mode to the DOM whenever it changes (and on mount,
  // so we cover the path where React's mode disagrees with what the inline
  // script wrote — e.g. another tab updated localStorage in between).
  useEffect(() => {
    const applied = applyThemeToDom(mode);
    setEffectiveTheme(applied);
  }, [mode]);

  // Only listen to system changes while the user picked 'system'. As soon
  // as they pick a fixed mode, we tear the listener down so OS changes
  // don't override their choice.
  useEffect(() => {
    if (mode !== 'system') return undefined;
    return subscribeToSystem((next) => {
      setEffectiveTheme(next);
      // Update the attribute so CSS keeps pace with the OS change.
      document.documentElement.setAttribute('data-theme', next);
    });
  }, [mode]);

  // Cross-tab sync — if the user switches mode in tab A, tab B picks it
  // up via the storage event.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== 'theme-mode') return;
      const fresh = getStoredMode();
      setModeState(fresh);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    persistMode(next);
    setModeState(next);
  }, []);

  const cycleMode = useCallback(() => {
    setModeState((prev) => {
      const next = nextMode(prev);
      persistMode(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, effectiveTheme, setMode, cycleMode }),
    [mode, effectiveTheme, setMode, cycleMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
