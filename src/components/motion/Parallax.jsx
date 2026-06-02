import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
} from 'framer-motion';

/**
 * Parallax — translateY a child slightly slower (or faster) than the
 * page scroll. Subtle by default; the goal is "this feels layered"
 * not "this moves visibly differently".
 *
 * The element is anchored to the viewport using framer-motion's
 * `useScroll({ target, offset })`, which gives a 0 → 1 progress value
 * across the element's full path through the viewport. We map that
 * progress to a small translate range so the move is bounded and
 * predictable.
 *
 * Defaults:
 *   - speed = 0.15 → the element rises ~30 px relative to the page
 *     between entering and leaving the viewport (subtle depth)
 *   - direction = 'up' → element moves up faster than page (default
 *     parallax background feel); 'down' = counter-parallax
 *
 * Reduced-motion users get a static identity transform (no scroll
 * binding) — the element renders normally.
 */

export default function Parallax({
  children,
  as: Component = 'div',
  speed = 0.15,
  direction = 'up',
  className,
  style,
  ...rest
}) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  // Track the element across the full window viewport — from when its
  // bottom touches the viewport top ("start end"), to when its top
  // leaves the viewport bottom ("end start"). Progress is 0 → 1 over
  // that whole journey.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Range, in px, that the element translates between progress 0 and 1.
  // speed=0.15 ≈ 60 px total movement on a 1080px viewport.
  const distance = (typeof window !== 'undefined' ? window.innerHeight : 800) * speed;
  const dir = direction === 'down' ? 1 : -1;
  const rawY = useTransform(
    scrollYProgress,
    [0, 1],
    [-distance * dir, distance * dir],
  );

  // Smooth the value with a soft spring so the parallax never feels
  // jittery on a high-DPI trackpad. Stiffness + damping chosen for
  // "settles in ~120ms with no overshoot".
  const y = useSpring(rawY, { stiffness: 120, damping: 28, mass: 0.4 });

  const MotionTag = motion[Component] || motion.div;

  if (prefersReducedMotion) {
    // Render the same element, no scroll-bound transform.
    const Tag = Component;
    return (
      <Tag ref={ref} className={className} style={style} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      ref={ref}
      style={{ ...style, y, willChange: 'transform' }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
