import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
} from 'framer-motion';

/**
 * Parallax — translateY a child slightly slower (or faster) than the
 * page scroll. Subtle by default. Reduced-motion users get a static
 * identity transform (no scroll binding).
 */

interface ParallaxProps {
  children?: ReactNode;
  as?: ElementType;
  speed?: number;
  direction?: 'up' | 'down';
  className?: string;
  style?: CSSProperties;
  // Polymorphic wrapper — forwards arbitrary element/motion props.
  [key: string]: unknown;
}

export default function Parallax({
  children,
  as: Component = 'div',
  speed = 0.15,
  direction = 'up',
  className,
  style,
  ...rest
}: ParallaxProps) {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // `distance` (below) reads window.innerHeight, which differs between the
  // SSR fallback (800) and the real client viewport — binding the scroll
  // transform during SSR/first paint would hydration-mismatch. Defer it to
  // after mount; the parallax engages on the client, as in the old SPA.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Range, in px, that the element translates between progress 0 and 1.
  const distance =
    (typeof window !== 'undefined' ? window.innerHeight : 800) * speed;
  const dir = direction === 'down' ? 1 : -1;
  const rawY = useTransform(
    scrollYProgress,
    [0, 1],
    [-distance * dir, distance * dir],
  );

  const y = useSpring(rawY, { stiffness: 120, damping: 28, mass: 0.4 });

  // motion[tag] is not indexable by an arbitrary string in TS; the cast
  // keeps the dynamic polymorphic tag while staying renderable.

  const MotionTag = ((motion as any)[Component as string] ||
    motion.div) as ElementType;
  const Tag = Component;

  if (prefersReducedMotion) {
    return (
      <Tag ref={ref} className={className} style={style} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      ref={ref}
      style={mounted ? { ...style, y, willChange: 'transform' } : style}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
