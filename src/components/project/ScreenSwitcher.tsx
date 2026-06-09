import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';

/**
 * ScreenSwitcher — tabs across the top, image swap below.
 *
 * Each tab can render either an image (src) or an arbitrary node
 * (children). AnimatePresence crossfades between tab contents on swap;
 * honours prefers-reduced-motion.
 */

interface SwitcherTab {
  id: string;
  label: ReactNode;
  src?: string;
  alt?: string;
  children?: ReactNode;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ScreenSwitcher({
  tabs,
  defaultId,
}: {
  tabs: SwitcherTab[];
  defaultId?: string;
}) {
  const [activeId, setActiveId] = useState<string | undefined>(
    defaultId || tabs[0]?.id,
  );
  const prefersReducedMotion = useReducedMotion();
  const active = tabs.find((t) => t.id === activeId) || tabs[0];

  // Guard against tab presses landing faster than the crossfade.
  const swapLock = useRef(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    [],
  );

  const selectTab = (id: string) => {
    if (swapLock.current || id === activeId) return;
    setActiveId(id);
    if (prefersReducedMotion) return; // instant swap — nothing to stall
    swapLock.current = true;
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(() => {
      swapLock.current = false;
    }, 320); // ≈ the 0.28s crossfade + a small buffer
  };

  const fade: MotionProps = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28, ease: EASE },
      };

  return (
    <div className="screen-switcher">
      <div className="screen-switcher__tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            className={`screen-switcher__tab${
              tab.id === activeId ? ' is-active' : ''
            }`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="screen-switcher__stage" role="tabpanel">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active?.id}
            className="screen-switcher__panel"
            {...fade}
          >
            {active?.children ||
              (active?.src && <img src={active.src} alt={active.alt || ''} />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
