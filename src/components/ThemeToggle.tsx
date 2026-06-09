import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

/**
 * 3-state theme toggle.
 *
 * One click cycles light → dark → system → light → … The icon swaps to
 * mirror the user's current *choice* (not the effective theme), so when
 * they pick "system" they always see the monitor glyph regardless of
 * which way the OS is leaning.
 *
 * Icons are hand-coded Lucide paths (Sun / Moon / Monitor) — no extra
 * dep just for three SVGs. They render with no fill, stroke=currentColor,
 * matching the visual weight of the existing nav-toggle button.
 */

const ICONS = {
  light: {
    label: 'Light theme. Click to switch to dark.',
    paths: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </>
    ),
  },
  dark: {
    label: 'Dark theme. Click to switch to system.',
    paths: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  },
  system: {
    label: 'System theme. Click to switch to light.',
    paths: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </>
    ),
  },
};

export default function ThemeToggle() {
  const { mode, cycleMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const icon = ICONS[mounted ? mode : 'system'] || ICONS.system;
  const prefersReducedMotion = useReducedMotion();

  // Motion props collapse to identity when the user prefers reduced
  // motion — the cycleMode click still works, just without bounce.
  const motionProps = prefersReducedMotion
    ? {}
    : {
        whileHover: {
          rotate: -8,
          transition: { type: 'spring', stiffness: 320, damping: 18 },
        },
        whileTap: { scale: 0.9, transition: { duration: 0.12 } },
      };

  return (
    <motion.button
      type="button"
      className="theme-toggle"
      aria-label={icon.label}
      title={icon.label}
      onClick={cycleMode}
      data-mode={mounted ? mode : 'system'}
      {...motionProps}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {icon.paths}
      </svg>
    </motion.button>
  );
}
