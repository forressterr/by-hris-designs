import { useCallback, useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';

/**
 * SlideShow — soft crossfade carousel that fills its parent container.
 *
 * Behaviour:
 *   - Auto-advances every AUTOPLAY_MS while the visitor isn't actively
 *     interacting. Desktop: pointer hover pauses. Mobile: touch drag
 *     pauses, no hover concept.
 *   - Desktop: previous/next arrow buttons + dot pagination fade in on
 *     hover only — keeps the photo as the primary surface.
 *   - Mobile/tablet (≤ 1024 px): all controls stay visible, plus
 *     horizontal swipe (touchstart/touchend) switches slide.
 *   - Auto-pause is briefly extended after each manual interaction so
 *     a click doesn't immediately get overridden by the next tick.
 *   - prefers-reduced-motion is honoured: crossfade becomes instant,
 *     auto-advance stops (visitor controls slides themselves).
 */

const AUTOPLAY_MS = 5000;
// How long the pause lingers after the visitor clicks an arrow/dot or
// swipes — without this they could click "next" and have the auto
// timer fire 300ms later and skip past their intended slide.
const MANUAL_INTERACTION_RESUME_MS = 6000;
// Touch swipe distance (px) needed to trigger a slide change.
const SWIPE_THRESHOLD_PX = 40;

const ChevronLeft = () => (
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
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
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
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

interface Slide {
  src: string;
  alt?: string;
  position?: string;
}

export default function SlideShow({
  slides,
  ariaLabel = 'Photo carousel',
}: {
  slides: Slide[];
  ariaLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  // `paused` toggles auto-advance. Set during hover (desktop) or right
  // after a manual interaction (any device).
  const [paused, setPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const goTo = useCallback(
    (next: number) => {
      const n = slides.length;
      const safeNext = ((next % n) + n) % n;
      setIndex(safeNext);
    },
    [slides.length],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  // Brief pause after manual interaction so the auto-advance doesn't
  // fight the visitor's click.
  const nudgePause = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      setPaused(false);
    }, MANUAL_INTERACTION_RESUME_MS);
  }, []);

  // Auto-advance — every AUTOPLAY_MS while not paused and motion is
  // allowed. The interval is reset every time `index` changes so a
  // manual jump doesn't fire the next auto-advance prematurely.
  useEffect(() => {
    if (paused || prefersReducedMotion.current) return undefined;
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, slides.length]);

  // Cleanup the resume timer on unmount.
  useEffect(
    () => () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    },
    [],
  );

  const onTouchStart = (event: TouchEvent) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    const startX = touchStartXRef.current;
    if (startX == null) return;
    const endX = event.changedTouches[0]?.clientX ?? startX;
    const dx = endX - startX;
    touchStartXRef.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    nudgePause();
    if (dx < 0) goNext();
    else goPrev();
  };

  const handleArrow = (direction: 'next' | 'prev') => () => {
    nudgePause();
    if (direction === 'next') goNext();
    else goPrev();
  };

  const handleDot = (i: number) => () => {
    nudgePause();
    goTo(i);
  };

  return (
    <div
      className="slideshow"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="slideshow__stack" aria-live="polite">
        {slides.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={`slideshow__image${i === index ? ' is-active' : ''}`}
            draggable="false"
            // Eager-load the first image so the initial paint isn't a
            // blank tile. Other slides are lazy.
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            aria-hidden={i !== index}
            // Per-slide crop bias. With object-fit: cover the default
            // crop centres on the image. Pass `position: '70% 50%'`
            // (or any CSS object-position value) when a specific photo
            // is framed off-centre and needs the visible window
            // shifted (e.g. group shots where a person sits near an
            // edge).
            style={
              slide.position ? { objectPosition: slide.position } : undefined
            }
          />
        ))}
      </div>

      <button
        type="button"
        className="slideshow__arrow slideshow__arrow--left"
        onClick={handleArrow('prev')}
        aria-label="Previous photo"
      >
        <ChevronLeft />
      </button>

      <button
        type="button"
        className="slideshow__arrow slideshow__arrow--right"
        onClick={handleArrow('next')}
        aria-label="Next photo"
      >
        <ChevronRight />
      </button>

      <div className="slideshow__dots" role="tablist" aria-label="Choose photo">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Go to photo ${i + 1} of ${slides.length}`}
            className={`slideshow__dot${i === index ? ' is-active' : ''}`}
            onClick={handleDot(i)}
          />
        ))}
      </div>
    </div>
  );
}
