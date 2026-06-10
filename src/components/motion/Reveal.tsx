import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { EASE } from '../../lib/motion';

/**
 * Reveal — drop-in scroll-triggered fade + rise.
 *
 * Children that should stagger get this on the parent:
 *     <Reveal stagger>{cards.map(c => <Reveal item key={…}>…</Reveal>)}</Reveal>
 * The parent sets up the staggerChildren orchestration; each child marks
 * itself with `item` so it picks up the inherited variants.
 *
 * Respects prefers-reduced-motion — animation collapses to a one-frame
 * opacity flip with no transform.
 */

const parentVariants = (
  distance: number,
  duration: number,
  delay: number,
  staggerChildren?: number,
): Variants => ({
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

const itemVariants = (distance: number, duration: number): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration, ease: EASE },
  },
});

interface RevealProps {
  children?: ReactNode;
  as?: ElementType;
  amount?: number;
  once?: boolean;
  distance?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  item?: boolean;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

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
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  const safeDistance = prefersReducedMotion ? 0 : distance;
  const safeDuration = prefersReducedMotion ? 0 : duration;

  // motion[tag] is not indexable by an arbitrary string in TS; the cast
  // keeps the dynamic polymorphic tag while staying renderable.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepted boundary: polymorphic motion tag (framer-motion limitation)
  const MotionTag = ((motion as any)[Component as string] ||
    motion.div) as ElementType;

  // Items inherit variants from a parent <Reveal stagger> — don't set
  // their own initial/whileInView, just declare the variants.
  if (item) {
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
