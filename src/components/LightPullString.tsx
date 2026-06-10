import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { createPortal } from 'react-dom';

/**
 * LightPullString — a physics-simulated hanging cord with a pendant that
 * the user can drag. Pulling the pendant down past PULL_THRESHOLD_PX and
 * releasing fires the `onPull` callback (parent toggles the lit state).
 *
 * Architecture:
 *   - Rendered via React portal into document.body so position: fixed
 *     resolves against the viewport instead of any parent stacking
 *     context (e.g. `.site` which has `overflow-x: clip`).
 *   - Heavy lifting (cord path + pendant transform) happens in a single
 *     requestAnimationFrame loop that writes to SVG attributes via refs.
 *     React state is only used for things that change the DOM structure
 *     (visibility opacity, viewport-based size attributes).
 *   - Anchor X is read from the right edge of `.container.page-canvas`
 *     so it tracks the content-column edge across all breakpoints.
 *   - IntersectionObserver on `visibilityRef` (the landing section)
 *     fades the cord out when the user scrolls past the hero.
 */

// ---- Physics ----
// Tuned for a "gentle and smooth" feel:
//   - Lower spring stiffness (was 0.15) → softer return, less bounce.
//   - Lower damping multiplier (was 0.92) → more friction per frame,
//     so the pendant settles faster without oscillating.
//   - Lower drag lerp (was 0.30) → pendant lags more behind the pointer,
//     feels heavier, less twitchy on small pointer jitters.
// Re-tuned to kill the "spring snap" on release: weaker spring +
// stronger damping = pendant drifts back to rest smoothly with very
// little overshoot, instead of boinging across the rest point.
const DAMPING = 0.85;
const SPRING_STIFFNESS = 0.06;
const DRAG_LERP = 0.22;

// Release velocity is scaled down so an aggressive flick doesn't send
// the pendant flying — keeps the swing within a gentle, predictable
// arc that the spring can settle smoothly.
// Halved (was 0.4) so even an aggressive yank produces only a modest
// release velocity — combined with the softer spring, the pendant
// glides back instead of snapping.
const RELEASE_VELOCITY_SCALE = 0.2;

// ---- Pull gesture ----
const PULL_THRESHOLD_PX = 40;

// ---- Idle micro-sway ----
const IDLE_AMPLITUDE_PX = 3;
const IDLE_PERIOD_MS = 4000;
const IDLE_RESUME_DELAY_MS = 2000;

// Anchor inset — fraction of the content container's width that the
// cord is moved INWARD from the container's right edge. 0 = flush
// right, 0.2 = 20% inset.
const ANCHOR_INSET_RATIO = 0.2;

// ---- Drag constraints ----
const MAX_H_OFFSET_PX = 150;
// Halved from 200 — pulls feel more contained, the cord doesn't
// stretch absurdly far down even on an aggressive drag. 100 px is
// still 2.5× the PULL_THRESHOLD_PX (40) so the toggle still triggers
// reliably.
const MAX_PULL_DOWN_PX = 100;

// ---- Visibility / DOM ----
const FADE_DURATION_MS = 200;
const NAVBAR_SELECTOR = '.site-header';
const CONTAINER_SELECTOR = '.container.page-canvas';

interface PointerSample {
  x: number;
  y: number;
  t: number;
}

// Resolve per-viewport dimensions (cord length, pendant size, hit area).
function specsFor(viewportWidth: number) {
  if (viewportWidth < 768) {
    return { cord: 90, rx: 8, ry: 14, stroke: 2.75, hit: 30 };
  }
  if (viewportWidth < 1024) {
    return { cord: 110, rx: 7, ry: 12, stroke: 2.5, hit: 28 };
  }
  return { cord: 120, rx: 6, ry: 11, stroke: 2.5, hit: 26 };
}

export default function LightPullString({
  visibilityRef,
  onPull,
}: {
  visibilityRef: RefObject<Element | null>;
  onPull: () => void;
}) {
  // SSR guard — only render portal after mount on the client.
  const [mounted, setMounted] = useState(false);

  // React state for things that drive re-render (DOM attrs + visibility).
  // Physics state lives in stateRef so the rAF loop can mutate without
  // re-rendering.
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  );
  const [navbarHeight, setNavbarHeight] = useState(64);
  // Mirrored from stateRef so the hint span (a regular HTML element,
  // not the rAF-driven SVG) can position itself via React.
  const [anchorX, setAnchorX] = useState(0);
  const [visible, setVisible] = useState(true);

  const cordRef = useRef<SVGPathElement | null>(null);
  const pendantRef = useRef<SVGGElement | null>(null);

  // Mutable physics + measurement state. Updated by drag handlers,
  // resize, and the rAF loop. Never triggers re-render.
  const stateRef = useRef({
    // Pendant position (in SVG coords — SVG origin is at (0, navbarHeight)
    // in viewport coords).
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    // Rest position (where the pendant settles).
    restX: 0,
    restY: 0,
    // Cached measurements for the drag handlers.
    anchorX: 0,
    navbarHeight: 64,
    cordLength: 120,
    // Drag state.
    dragging: false,
    pullDetected: false,
    pointerHistory: [] as PointerSample[],
    // Idle state.
    resumeIdleAt: 0,
    idleStartTime: 0,
  });

  const specs = specsFor(viewportWidth);

  // Mark client-mounted (portal can render).
  useEffect(() => {
    setMounted(true);
    stateRef.current.idleStartTime = performance.now();
  }, []);

  // Measure anchor X (right edge of content container) and navbar height.
  // Re-runs on window resize.
  useLayoutEffect(() => {
    const measure = () => {
      const navbar = document.querySelector(NAVBAR_SELECTOR);
      const container = document.querySelector(CONTAINER_SELECTOR);
      const newViewportWidth = window.innerWidth;
      const newNavbarHeight = navbar
        ? navbar.getBoundingClientRect().height
        : 64;
      const newSpecs = specsFor(newViewportWidth);

      // Anchor X = right edge of the page content container, then
      // shifted inward by ANCHOR_INSET_RATIO of the container width so
      // the cord sits inside the content area instead of flush against
      // the gutter. Scales proportionally across breakpoints.
      let newAnchorX = newViewportWidth - 40;
      if (container) {
        const rect = container.getBoundingClientRect();
        newAnchorX = rect.right - rect.width * ANCHOR_INSET_RATIO;
      }

      setViewportWidth(newViewportWidth);
      setNavbarHeight(newNavbarHeight);
      setAnchorX(newAnchorX);

      const s = stateRef.current;
      const wasInitial = s.anchorX === 0;
      s.anchorX = newAnchorX;
      s.navbarHeight = newNavbarHeight;
      s.cordLength = newSpecs.cord;
      s.restX = newAnchorX;
      s.restY = newSpecs.cord;

      if (wasInitial) {
        // Snap pendant to rest position on first measurement.
        s.x = newAnchorX;
        s.y = newSpecs.cord;
      }
      // On subsequent resizes, physics naturally springs back to the
      // new rest position — no need to snap.
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // IntersectionObserver on the landing section — fade out when scrolled
  // past the hero, fade back in when scrolled back into view.
  useEffect(() => {
    if (!visibilityRef?.current) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setVisible(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );
    observer.observe(visibilityRef.current);
    return () => observer.disconnect();
  }, [visibilityRef]);

  // The main rAF loop — drives physics and writes SVG attributes.
  useEffect(() => {
    if (!mounted) return undefined;

    let rafId = 0;

    const tick = (now: number) => {
      const s = stateRef.current;
      const cord = cordRef.current;
      const pendant = pendantRef.current;

      if (!cord || !pendant) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (!s.dragging) {
        // Determine target (rest + idle micro-sway when settled).
        let targetX = s.restX;
        const targetY = s.restY;
        const speed = Math.abs(s.vx) + Math.abs(s.vy);

        if (now >= s.resumeIdleAt && speed < 0.3) {
          const t = (now - s.idleStartTime) / IDLE_PERIOD_MS;
          targetX += Math.sin(t * Math.PI * 2) * IDLE_AMPLITUDE_PX;
        }

        // Spring force pulling the pendant toward the target.
        s.vx -= (s.x - targetX) * SPRING_STIFFNESS;
        s.vy -= (s.y - targetY) * SPRING_STIFFNESS;

        // Damping (velocity decay).
        s.vx *= DAMPING;
        s.vy *= DAMPING;

        // Integrate.
        s.x += s.vx;
        s.y += s.vy;
      }
      // When dragging, position is updated directly in onMove() — we
      // intentionally skip the spring step here.

      // Soft clamp: pendant can't go above its anchor.
      if (s.y < 0) {
        s.y = 0;
        s.vy *= -0.3;
      }

      // Cubic-bezier cord that bows toward the swing direction. Control
      // points are placed at 1/3 and 2/3 of the cord length, displaced
      // horizontally in proportion to the pendant's offset — gives the
      // cord a natural drape rather than a straight line.
      const ax = s.anchorX;
      const ay = 0;
      const px = s.x;
      const py = s.y;
      const dx = px - ax;
      const dy = py - ay;
      const c1x = ax + dx * 0.2;
      const c1y = ay + dy * 0.45;
      const c2x = ax + dx * 0.7;
      const c2y = ay + dy * 0.85;

      cord.setAttribute(
        'd',
        `M ${ax} ${ay} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${px} ${py}`,
      );
      pendant.setAttribute('transform', `translate(${px}, ${py})`);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mounted]);

  // Drag handlers — mouse + touch. Pointer position is converted from
  // viewport coords to SVG coords (subtracting navbarHeight). Velocity
  // on release is averaged from the last few pointer samples.
  useEffect(() => {
    if (!mounted) return undefined;
    const pendant = pendantRef.current;
    if (!pendant) return undefined;

    const getPointer = (event: MouseEvent | TouchEvent) => {
      if ('touches' in event) {
        const t = event.touches[0];
        return { x: t ? t.clientX : 0, y: t ? t.clientY : 0 };
      }
      return { x: event.clientX, y: event.clientY };
    };

    const onStart = (event: MouseEvent | TouchEvent) => {
      const s = stateRef.current;
      const { x, y } = getPointer(event);
      s.dragging = true;
      s.pullDetected = false;
      s.pointerHistory = [{ x, y, t: performance.now() }];
      pendant.style.cursor = 'grabbing';
      // Always prevent default to avoid text-selection / native drag
      // (touch needs passive: false for this to take effect).
      if (event.cancelable) event.preventDefault();
    };

    const onMove = (event: MouseEvent | TouchEvent) => {
      const s = stateRef.current;
      if (!s.dragging) return;
      if ('touches' in event && event.cancelable) event.preventDefault();

      const { x, y } = getPointer(event);
      const now = performance.now();
      s.pointerHistory.push({ x, y, t: now });
      if (s.pointerHistory.length > 6) s.pointerHistory.shift();

      // Pointer in SVG coords.
      const targetX = x;
      const targetY = y - s.navbarHeight;

      // Constrain horizontally to ±MAX_H_OFFSET from rest, and
      // vertically between the anchor and a max pull-down.
      const offX = targetX - s.restX;
      const constrainedX =
        s.restX + Math.max(-MAX_H_OFFSET_PX, Math.min(MAX_H_OFFSET_PX, offX));
      const constrainedY = Math.max(
        0,
        Math.min(s.restY + MAX_PULL_DOWN_PX, targetY),
      );

      // Lerp toward target — pendant doesn't snap, it follows with lag.
      s.x += (constrainedX - s.x) * DRAG_LERP;
      s.y += (constrainedY - s.y) * DRAG_LERP;

      // Mark a pull if pendant has been dragged past the threshold.
      if (s.y > s.restY + PULL_THRESHOLD_PX) {
        s.pullDetected = true;
      }
    };

    const onEnd = () => {
      const s = stateRef.current;
      if (!s.dragging) return;

      s.dragging = false;
      pendant.style.cursor = 'grab';

      // Average velocity from the recorded pointer history. Frame units
      // (≈16.67ms) so the spring/damping constants stay consistent.
      // Scaled by RELEASE_VELOCITY_SCALE so the swing stays gentle even
      // if the user yanks the cord aggressively.
      const first = s.pointerHistory[0];
      const last = s.pointerHistory[s.pointerHistory.length - 1];
      if (s.pointerHistory.length >= 2 && first && last) {
        const dtFrames = (last.t - first.t) / 16.67;
        if (dtFrames > 0.5) {
          s.vx = ((last.x - first.x) / dtFrames) * RELEASE_VELOCITY_SCALE;
          s.vy = ((last.y - first.y) / dtFrames) * RELEASE_VELOCITY_SCALE;
        }
      }

      // Fire the toggle callback if the user pulled past the threshold.
      if (s.pullDetected && typeof onPull === 'function') {
        onPull();
      }
      s.pullDetected = false;

      // Hold off the idle micro-sway briefly so the post-release swing
      // can settle naturally before idle takes over.
      s.resumeIdleAt = performance.now() + IDLE_RESUME_DELAY_MS;
      s.pointerHistory = [];
    };

    pendant.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    pendant.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    return () => {
      pendant.removeEventListener('mousedown', onStart);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      pendant.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [mounted, onPull]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="light-pull-portal"
      style={{
        position: 'fixed',
        top: `${navbarHeight}px`,
        left: 0,
        width: '100%',
        height: '340px',
        pointerEvents: 'none',
        zIndex: 45,
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_DURATION_MS}ms ease-out`,
        /* color drives `currentColor` on the cord + pendant below.
           --ink auto-inverts with the theme (dark in light mode, light
           in dark mode), so the rope flips its colour with the rest of
           the page. */
        color: 'var(--ink)',
      }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="100%"
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        {/* The cord — `d` is overwritten by the rAF loop on every
            frame. strokeLinecap=round gives the cord a soft pixel end. */}
        <path
          ref={cordRef}
          stroke="currentColor"
          strokeWidth={specs.stroke}
          fill="none"
          strokeLinecap="round"
        />

        {/* Pendant group — only element that accepts pointer events.
            Includes an invisible hit-area circle for an easier grab. */}
        <g
          ref={pendantRef}
          style={{
            pointerEvents: visible ? 'all' : 'none',
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          <circle r={specs.hit} fill="transparent" />
          {/* Pendant body — rounded upper half (semi-circle arc),
              straight vertical sides, flat bottom edge with square
              corners. Reads like a small pull-tab / capsule cut off
              at the bottom rather than a full ellipse. */}
          <path
            d={`M ${-specs.rx} ${-(specs.ry - specs.rx)}
                A ${specs.rx} ${specs.rx} 0 0 1 ${specs.rx} ${-(
                  specs.ry - specs.rx
                )}
                L ${specs.rx} ${specs.ry}
                L ${-specs.rx} ${specs.ry}
                Z`}
            fill="currentColor"
          />
          {/* Subtle highlight in the rounded upper portion for a
              3D bead feel. --muted-2 gives a light grey in light mode
              (reads as a highlight on the dark bead) and a dark grey
              in dark mode (reads as a soft shadow on the light bead) —
              either way the bead picks up dimensional shading. */}
          <ellipse
            rx={specs.rx * 0.35}
            ry={specs.rx * 0.35}
            cx={-specs.rx * 0.35}
            cy={-(specs.ry - specs.rx * 0.5)}
            style={{ fill: 'var(--muted-2)' }}
            opacity="0.5"
          />
        </g>
      </svg>

      {/* Subtle DM Mono hint next to the cord. Positioned at the
          cord's vertical midpoint (default state — the rAF loop never
          touches this element, so it stays put even while the user
          drags). Guarded by anchorX > 0 so it doesn't flash at left
          edge before measure() has run. */}
      {anchorX > 0 && (
        <span
          className="light-string-hint"
          style={{
            left: `${anchorX + 24}px`,
            top: `${specs.cord / 2}px`,
          }}
          aria-hidden="true"
        >
          <span className="light-string-hint__arrow">←</span>
          {/* Three-line hint so the slightly longer copy ("Pull to, spark the interest")
              keeps the same compact column next to the rope rather than
              widening sideways. */}
          <span className="light-string-hint__text">
            Pull to,
            <br />
            spark the
            <br />
            interest
          </span>
        </span>
      )}
    </div>,
    document.body,
  );
}
