import { useRef } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';

/**
 * ScrollViewport — a fixed-height window that scrubs a tall mockup
 * vertically as the visitor scrolls past it on the page.
 *
 * Idea: a landing page or dashboard often has a long, scrollable
 * canvas. Showing the full thing as a static image is enormous;
 * showing only the hero misses the rest of the design. ScrollViewport
 * pins a viewport of fixed height and ties the inner Y translate to
 * the visitor's scroll position — so as they scroll the page, the
 * mockup scrolls inside its viewport, exposing the full layout.
 *
 * Props:
 *   - height       : number (px) of the visible viewport — default 480
 *   - innerHeight  : number (px) of the tall content inside. The scroll
 *                    range = innerHeight − height (how much the inner
 *                    can shift up). If omitted, defaults to 2× height.
 *   - src          : image URL for the tall mockup
 *   - alt          : alt text
 *   - children     : optional — render in place of <img> (e.g. a
 *                    placeholder block for now)
 */

export default function ScrollViewport({
  height = 480,
  innerHeight,
  src,
  alt = '',
  children,
}: {
  height?: number;
  innerHeight?: number;
  src?: string;
  alt?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Tie progress to the element's pass through the viewport — from
  // when its top hits the bottom of the viewport ("start end") to
  // when its bottom hits the top ("end start").
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const fullInner = innerHeight ?? height * 2;
  const maxShift = Math.max(0, fullInner - height);
  // Translate from 0 (at top of viewport) → -maxShift (at bottom).
  const y = useTransform(scrollYProgress, [0, 1], [0, -maxShift]);

  return (
    <div ref={ref} className="scroll-viewport" style={{ height }}>
      {prefersReducedMotion ? (
        // Reduced motion: render full image static, allow vertical scroll
        // within the viewport using overflow rather than animating.
        <div className="scroll-viewport__inner scroll-viewport__inner--static">
          {children ||
            (src && (
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 900px) 100vw, 70vw"
              />
            ))}
        </div>
      ) : (
        <motion.div
          className="scroll-viewport__inner"
          style={{ y, height: fullInner }}
        >
          {children ||
            (src && (
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 900px) 100vw, 70vw"
              />
            ))}
        </motion.div>
      )}
    </div>
  );
}
