import { useEffect, useState } from 'react';

/**
 * Typewriter — cycles through a list of strings with a soft, vertical
 * "slide down + fade" reveal. (Name kept for backward compatibility with
 * existing imports, even though there's no longer per-character typing.)
 *
 * Lifecycle per word:
 *   1. Held visible for HOLD ms.
 *   2. .is-visible class is removed → CSS transitions opacity to 0 and
 *      transform to translateY(-12px) over FADE ms (slides up + fades).
 *   3. Once invisible, the word content is swapped to the next item AND
 *      .is-visible is re-added → CSS transitions back to opacity 1 /
 *      translateY(0) (the new word slides down from above into place).
 *
 * Animation lives in CSS (.rotating-word). This component only flips
 * a boolean and points at the next index — keeps the JS minimal and
 * lets the browser drive the actual motion smoothly.
 *
 * Accessibility:
 *   - The animated text is aria-hidden — screen readers shouldn't try
 *     to follow the rotation.
 *   - A visually-hidden span lists every word so AT users get the full
 *     set in one read.
 */

const HOLD = 2500; // ms each word stays fully visible
const FADE = 500; // ms for the out-transition (in is the same, in CSS)

export default function Typewriter({
  words = [],
  className,
  lit = false,
}: {
  words?: string[];
  className?: string;
  lit?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!words.length) return undefined;

    let swapTimer: ReturnType<typeof setTimeout> | undefined;

    const cycle = setInterval(() => {
      setVisible(false);
      swapTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, FADE);
    }, HOLD + FADE);

    return () => {
      clearInterval(cycle);
      clearTimeout(swapTimer);
    };
  }, [words.length]);

  // `lit` paints the rotating word with the gold gradient + glow
  // (used by the LightPullString feature). The class is purely
  // additive — the slide/fade animation continues to work the same.
  const wordClass = `rotating-word${visible ? ' is-visible' : ''}${
    lit ? ' is-lit' : ''
  }`;

  return (
    <span className={className}>
      <span className={wordClass} aria-hidden="true">
        {words[index]}
      </span>
      {/* Static, screen-reader-only list of the rotating roles. The
          surrounding markup (e.g. "Hris is a") provides grammatical
          setup; this just enumerates the choices for AT users. */}
      <span className="visually-hidden">{words.join(', ')}</span>
    </span>
  );
}
