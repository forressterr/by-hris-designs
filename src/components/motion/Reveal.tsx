import { motion, useReducedMotion } from 'framer-motion';

/**
 * Reveal — drop-in scroll-triggered fade + rise.
 *
 * Wrap any section / element in <Reveal>…</Reveal>. When ≥ `amount`
 * of its box scrolls into the viewport, it fades from 0 → 1 and
 * translates from `distance` px down → its natural position.
 *
 * Defaults are tuned to feel Framer-like:
 *   - 24 px rise, 0.55 s, ease-out-quart `[0.22, 1, 0.36, 1]`
 *   - Triggers once per mount (`viewport.once: true`)
 *   - Triggers at 20 % of the element visible — early enough that the
 *     animation finishes by the time the section is fully on screen
 *
 * Children that should stagger get this on the parent:
 *     <Reveal stagger>{cards.map(c => <Reveal item key={…}>…</Reveal>)}</Reveal>
 * The parent sets up the staggerChildren orchestration; each child marks
 * itself with `item` so it picks up the inherited variants.
 *
 * Respects prefers-reduced-motion via useReducedMotion — animation
 * collapses to a one-frame opacity flip with no transform.
 */

const EASE = [0.22, 1, 0.36, 1];

const parentVariants = (distance, duration, delay, staggerChildren) => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration,
      ease: EASE,
      delay,
      when: staggerChildren ? 'beforeChildren' : undefined,
      staggerChildren,
    },
  },
});

const itemVariants = (distance, duration) => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration, ease: EASE },
  },
});

export default function Reveal({
  children,
  as: Component = 'div',
  amount = 0.2,
  once = true,
  distance = 24,
  duration = 0.55,
  delay = 0,
  stagger,
  item = false,
  className,
  style,
  ...rest
}) {
  const prefersReducedMotion = useReducedMotion();

  // Reduced-motion users get a single-frame paint with no transform.
  // We still render via motion.* so any later orchestration (delay/stagger)
  // still runs — just collapsed to no motion.
  const safeDistance = prefersReducedMotion ? 0 : distance;
  const safeDuration = prefersReducedMotion ? 0 : duration;

  // Items inherit variants from a parent <Reveal stagger> — don't set
  // their own initial/whileInView, just declare the variants and let
  // the parent's orchestration drive them.
  if (item) {
    const MotionTag = motion[Component] || motion.div;
    return (
      <MotionTag
        variants={itemVariants(safeDistance, safeDuration)}
        className={className}
        style={style}
        {...rest}
      >
        {children}
      </MotionTag>
    );
  }

  const MotionTag = motion[Component] || motion.div;
  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={parentVariants(
        safeDistance,
        safeDuration,
        delay,
        prefersReducedMotion ? undefined : stagger,
      )}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
