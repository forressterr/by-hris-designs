import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * ServiceCard — a clickable card that flips on its Y-axis to reveal a
 * back face with sub-skill links.
 *
 * - Click (or Enter/Space when focused) toggles the flip.
 * - Front face: number, icon, title, caption (the original card UI).
 * - Back face: number badge + a vertical list of sub-skill inline links
 *   (each styled like the "Get in touch +" link used elsewhere).
 * - Sub-skill links call stopPropagation on click so navigating away
 *   doesn't also re-flip the card.
 * - The hidden face's links get tabIndex={-1} so they stay out of the
 *   tab order until the card is actually facing the viewer.
 *
 * The SVG icons are keyed by `service.num` so adding a new service is
 * just a data change + a new key here.
 */

const ICONS = {
  // 001 — Product Design: two offset rounded squares (layered surfaces).
  '001': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="14"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="14"
        y="4"
        width="14"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  // 002 — Web Design: browser window with chrome dots.
  '002': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="6"
        width="24"
        height="20"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="4"
        y1="12"
        x2="28"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="7.5" cy="9" r="0.9" fill="currentColor" />
      <circle cx="10.5" cy="9" r="0.9" fill="currentColor" />
      <circle cx="13.5" cy="9" r="0.9" fill="currentColor" />
    </svg>
  ),
  // 003 — UX/UI Design: pointer cursor (universal interaction mark).
  '003': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 5 L8 24 L13 19 L17 27 L20 25 L16 17 L22 17 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // 004 — Creative Design: 8-point asterisk / spark.
  '004': (
    <svg
      width="64"
      height="64"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16 4 L16 28 M4 16 L28 16 M7.5 7.5 L24.5 24.5 M7.5 24.5 L24.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export default function ServiceCard({ service }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Hover lift only when the card is in its resting (front) state — a
  // hover transform on a flipped card would compound with the 180° Y
  // rotation and look weird.
  const hoverMotion =
    isFlipped || prefersReducedMotion
      ? {}
      : {
          whileHover: {
            y: -4,
            transition: { type: 'spring', stiffness: 300, damping: 22 },
          },
          whileTap: { scale: 0.995, transition: { duration: 0.1 } },
        };

  const toggleFlip = () => setIsFlipped((prev) => !prev);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleFlip();
    }
  };

  // Sub-skill links stopPropagation so the parent card doesn't also
  // flip when a link is clicked.
  const handleLinkClick = (event) => {
    event.stopPropagation();
  };

  const subSkills = service.subSkills ?? [];

  return (
    <motion.article
      className={`service-card${isFlipped ? ' is-flipped' : ''}`}
      data-color={service.color}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={`${service.title} — ${isFlipped ? 'showing sub-skills, click to flip back' : 'click to flip and see sub-skills'}`}
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
      {...hoverMotion}
    >
      <div className="service-card__inner">
        <div
          className="service-card__face service-card__face--front"
          aria-hidden={isFlipped}
        >
          <header className="service-card__header">
            <span className="service-card__num">( {service.num} )</span>
            <span className="service-card__hint" aria-hidden="true">
              <span className="service-card__hint-label">Read more</span>
              <span className="service-card__hint-icon">↺</span>
            </span>
          </header>
          <div className="service-card__icon" aria-hidden="true">
            {ICONS[service.num]}
          </div>
          <div className="service-card__body">
            <h4>{service.title}</h4>
            <p>{service.desc}</p>
          </div>
        </div>

        <div
          className="service-card__face service-card__face--back"
          aria-hidden={!isFlipped}
        >
          <header className="service-card__header">
            <span className="service-card__num">( {service.num} )</span>
            <span className="service-card__hint" aria-hidden="true">
              <span className="service-card__hint-label">Read more</span>
              <span className="service-card__hint-icon">↺</span>
            </span>
          </header>
          <ul className="service-card__sublinks">
            {subSkills.map((skill) => (
              <li key={skill.name} className="service-card__subskill">
                {/* Skill name is plain text — rendered bold (same
                    weight as the front-face title) via the
                    .service-card__subskill-name class. */}
                <span className="service-card__subskill-name">
                  {skill.name}
                </span>
                {skill.projects && skill.projects.length > 0 && (
                  /* Projects sit on their own line below the name (the
                      .service-card__subskill rule uses flex-direction:
                      column). Each project is an inline-link separated
                      by " / ", matching the visual style of the
                      "Get in touch +" link used elsewhere. */
                  <span className="service-card__subskill-projects">
                    {skill.projects.map((project, i) => (
                      <span key={project}>
                        <Link
                          href="/works"
                          className="inline-link"
                          onClick={handleLinkClick}
                          tabIndex={isFlipped ? 0 : -1}
                        >
                          {project}
                        </Link>
                        {i < skill.projects.length - 1 && (
                          <span
                            className="service-card__subskill-sep"
                            aria-hidden="true"
                          >
                            {' / '}
                          </span>
                        )}
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.article>
  );
}
