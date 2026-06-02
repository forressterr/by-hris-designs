import { useState } from 'react';

/**
 * TestimonialCard — reuses the .service-card flip pattern (front/back
 * faces sharing a CSS grid stack, perspective + rotateY on the inner)
 * but swaps the content for a person + theme + quote layout.
 *
 * Front face:
 *   - Index badge ( 001 ) top-left
 *   - Themed icon centered
 *   - Avatar (round placeholder) + theme title on one row
 *   - Name / role · company / location underneath
 *
 * Back face:
 *   - Index badge top-left
 *   - Testimonial quote (responsive h4 → h3 sizing)
 *
 * All four card colors and the flip animation are inherited from the
 * existing .service-card CSS, so this component is essentially a
 * content variant of ServiceCard.
 */

// Bespoke SVG icons for the four praise themes. All built on the same
// 32-unit viewBox + 1.5 px stroke recipe as the service icons, so the
// two card rows feel like one matched set.
const ICONS = {
  // 001 — Decision making / organisation: a node fans into two paths
  // (the classic flowchart-style decision split).
  '001': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="6" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="24"
        cy="24"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 16 L14 16 L21.5 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 16 L21.5 23"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // 002 — Team dynamics: three connected circles (a small team graph).
  '002': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="9" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="23"
        cy="10"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="16"
        cy="22"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12.5 11 L19.5 11" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 13 L14 19" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 13 L18 19" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  // 003 — Growth / exploration: upward arrow with two side-branches
  // sprouting out, suggesting a path that keeps expanding.
  '003': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 28 L16 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 12 L16 5 L23 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 20 L16 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M21 20 L16 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  // 004 — Creativity / spark: lightbulb (circle + screw base + two
  // thread lines). Deliberately different shape from the Services
  // 004 asterisk so the two card rows don't repeat icons.
  '004': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="13" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 21 L11 23 L21 23 L21 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="26"
        x2="20"
        y2="26"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="13"
        y1="29"
        x2="19"
        y2="29"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export default function TestimonialCard({ testimonial }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => setIsFlipped((prev) => !prev);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlip();
    }
  };

  return (
    <article
      className={`service-card${isFlipped ? ' is-flipped' : ''}`}
      data-color={testimonial.color}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={`Testimonial from ${testimonial.name} — ${
        isFlipped
          ? 'showing the quote, click to flip back'
          : 'click to read the quote'
      }`}
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
    >
      <div className="service-card__inner">
        <div
          className="service-card__face service-card__face--front"
          aria-hidden={isFlipped}
        >
          <header className="service-card__header">
            <span className="service-card__num">
              ( {testimonial.num} )
            </span>
            <span className="service-card__hint" aria-hidden="true">
              <span className="service-card__hint-label">Read more</span>
              <span className="service-card__hint-icon">↺</span>
            </span>
          </header>
          <div className="service-card__icon" aria-hidden="true">
            {ICONS[testimonial.num]}
          </div>
          {/* Three-row body: theme title (h2-sized), avatar+name on
              the middle row, role/company/location below. */}
          <div className="service-card__body testimonial-card__body">
            <h2 className="testimonial-card__title">
              {testimonial.title}
            </h2>
            <div className="testimonial-card__person">
              <div className="testimonial-card__avatar" aria-hidden="true">
                {testimonial.initials}
              </div>
              <span className="testimonial-card__name">
                {testimonial.name}
              </span>
            </div>
            <p className="testimonial-card__meta">
              {testimonial.role}, {testimonial.company}
              <br />
              {testimonial.location}
            </p>
          </div>
        </div>

        <div
          className="service-card__face service-card__face--back"
          aria-hidden={!isFlipped}
        >
          <header className="service-card__header">
            <span className="service-card__num">
              ( {testimonial.num} )
            </span>
            <span className="service-card__hint" aria-hidden="true">
              <span className="service-card__hint-label">Read more</span>
              <span className="service-card__hint-icon">↺</span>
            </span>
          </header>
          <p className="testimonial-card__quote">{testimonial.quote}</p>
        </div>
      </div>
    </article>
  );
}
