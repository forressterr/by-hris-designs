import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * ScreenSwitcher — tabs across the top, image swap below.
 *
 * Use to show different views of a dashboard / app
 * ("Home / Goals / Profile / Settings") without dropping six
 * screenshots side-by-side.
 *
 * Props:
 *   - tabs : Array<{ id, label, src?, alt?, children? }>
 *            Each tab can render either an image (src) or an arbitrary
 *            node (children) — e.g. a placeholder block before assets
 *            land.
 *   - defaultId : optional, otherwise first tab is active
 *
 * Animation: AnimatePresence crossfades between tab contents on swap.
 * Honours prefers-reduced-motion.
 */

export default function ScreenSwitcher({ tabs, defaultId }) {
  const [activeId, setActiveId] = useState(defaultId || tabs[0]?.id);
  const prefersReducedMotion = useReducedMotion();
  const active = tabs.find((t) => t.id === activeId) || tabs[0];

  // Guard against tab presses landing faster than the crossfade. While a
  // swap is in flight we ignore clicks, so AnimatePresence's wait-mode exit
  // can't pile up and stall on a superseded transition. The lock lives in a
  // ref and is always released by a timer — it never waits on an exit
  // callback, so it can't get permanently stuck.
  const swapLock = useRef(false);
  const swapTimer = useRef(null);
  useEffect(() => () => clearTimeout(swapTimer.current), []);

  const selectTab = (id) => {
    if (swapLock.current || id === activeId) return;
    setActiveId(id);
    if (prefersReducedMotion) return; // instant swap — nothing to stall
    swapLock.current = true;
    clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(() => {
      swapLock.current = false;
    }, 320); // ≈ the 0.28s crossfade + a small buffer
  };

  const fade = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
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
            key={active.id}
            className="screen-switcher__panel"
            {...fade}
          >
            {active.children ||
              (active.src && <img src={active.src} alt={active.alt || ''} />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
