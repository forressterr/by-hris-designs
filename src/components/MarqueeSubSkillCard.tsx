/**
 * MarqueeSubSkillCard — one tile in the home-page sliding marquee.
 *
 * Mirrors the FRONT FACE of the Services cards so the two surfaces
 * feel like the same family:
 *   - Same outer rhythm via .hero-marquee__slide (chain-link border
 *     radius preserved via the existing --a / --b variants).
 *   - Reuses the .service-card__header / __num / __icon / __body
 *     class hooks so the typography (font, weight, size, family)
 *     is *literally* the same — not copy-pasted styles that drift.
 *   - One pastel accent per tile, cycled through the same four
 *     palette tokens (--accent-purple / -green / -pink / -yellow).
 *
 * No flip behaviour — the marquee tiles only show the front-face
 * content, so there's no "Read more ↺" hint either (it would
 * suggest an interaction that doesn't exist).
 *
 * Each tile gets `aria-hidden="true"` because the marquee is a
 * decorative scrolling banner and every tile is rendered twice for
 * the seamless loop — letting AT read each sub-skill 2× would be
 * noise. The Services section below the marquee is the canonical
 * accessible source of the same content.
 */

import type { ReactNode } from 'react';

const SVG_DEFAULTS = {
  width: 64,
  height: 64,
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

// Icon keys are kept in lock-step with the `icon` field on each
// entry in data/projects.js → marqueeSubSkills.
const ICONS: Record<string, ReactNode> = {
  // --- Product Design ---
  'service-design': (
    <svg {...SVG_DEFAULTS}>
      <circle cx="6" cy="16" r="3" />
      <circle cx="16" cy="16" r="3" />
      <circle cx="26" cy="16" r="3" />
      <line x1="9" y1="16" x2="13" y2="16" />
      <line x1="19" y1="16" x2="23" y2="16" />
    </svg>
  ),
  'application-design': (
    <svg {...SVG_DEFAULTS}>
      <rect x="10" y="4" width="12" height="24" rx="2" />
      <line x1="14" y1="24" x2="18" y2="24" />
      <line x1="10" y1="9" x2="22" y2="9" />
    </svg>
  ),
  'design-systems': (
    <svg {...SVG_DEFAULTS}>
      <rect x="4" y="4" width="10" height="10" rx="1.5" />
      <rect x="18" y="4" width="10" height="10" rx="1.5" />
      <rect x="4" y="18" width="10" height="10" rx="1.5" />
      <rect x="18" y="18" width="10" height="10" rx="1.5" />
    </svg>
  ),
  'complex-flows': (
    <svg {...SVG_DEFAULTS}>
      <circle cx="6" cy="16" r="2" />
      <circle cx="26" cy="7" r="2" />
      <circle cx="26" cy="25" r="2" />
      <path d="M8 16 L18 16 L24 8" />
      <path d="M18 16 L24 24" />
    </svg>
  ),
  scalable: (
    <svg {...SVG_DEFAULTS}>
      <rect x="3" y="20" width="6" height="6" rx="1" />
      <rect x="12" y="14" width="9" height="12" rx="1" />
      <rect x="23" y="6" width="6" height="20" rx="1" />
    </svg>
  ),
  'saas-ecom': (
    <svg {...SVG_DEFAULTS}>
      <path d="M4 6 L7 6 L10 22 L24 22 L26 10 L9 10" />
      <circle cx="12" cy="26" r="1.5" />
      <circle cx="22" cy="26" r="1.5" />
    </svg>
  ),

  // --- Web Design ---
  responsive: (
    <svg {...SVG_DEFAULTS}>
      <rect x="3" y="6" width="18" height="14" rx="1.5" />
      <line x1="6" y1="23" x2="18" y2="23" />
      <rect x="22" y="13" width="7" height="13" rx="1.5" />
    </svg>
  ),
  'clear-flow': (
    <svg {...SVG_DEFAULTS}>
      <line x1="4" y1="16" x2="24" y2="16" />
      <polyline points="20 11 25 16 20 21" />
    </svg>
  ),
  storytelling: (
    <svg {...SVG_DEFAULTS}>
      <rect x="4" y="6" width="11" height="20" />
      <rect x="17" y="6" width="11" height="20" />
      <line x1="6" y1="12" x2="13" y2="12" />
      <line x1="6" y1="16" x2="13" y2="16" />
      <line x1="6" y1="20" x2="11" y2="20" />
      <line x1="19" y1="12" x2="26" y2="12" />
      <line x1="19" y1="16" x2="26" y2="16" />
      <line x1="19" y1="20" x2="24" y2="20" />
    </svg>
  ),
  seo: (
    <svg {...SVG_DEFAULTS}>
      <circle cx="13" cy="13" r="7" />
      <line x1="18" y1="18" x2="26" y2="26" />
      <line x1="9" y1="12" x2="17" y2="12" />
      <line x1="9" y1="15" x2="14" y2="15" />
    </svg>
  ),
  brand: (
    <svg {...SVG_DEFAULTS}>
      <circle cx="16" cy="16" r="11" />
      <circle cx="16" cy="16" r="7" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  ),
  portfolio: (
    <svg {...SVG_DEFAULTS}>
      <rect x="4" y="6" width="8" height="8" rx="1" />
      <rect x="14" y="6" width="14" height="8" rx="1" />
      <rect x="4" y="18" width="14" height="8" rx="1" />
      <rect x="20" y="18" width="8" height="8" rx="1" />
    </svg>
  ),

  // --- UX/UI Design ---
  'semantic-research': (
    <svg {...SVG_DEFAULTS}>
      <path d="M4 6 L28 6 L28 22 L18 22 L12 28 L12 22 L4 22 Z" />
      <line x1="9" y1="12" x2="23" y2="12" />
      <line x1="9" y1="16" x2="19" y2="16" />
    </svg>
  ),
  competitors: (
    <svg {...SVG_DEFAULTS}>
      <line x1="3" y1="12" x2="20" y2="12" />
      <polyline points="16 8 20 12 16 16" />
      <line x1="29" y1="20" x2="12" y2="20" />
      <polyline points="16 16 12 20 16 24" />
    </svg>
  ),
  'user-research': (
    <svg {...SVG_DEFAULTS}>
      <circle cx="10" cy="10" r="4" />
      <path d="M3 24 C3 18, 17 18, 17 24" />
      <circle cx="22" cy="22" r="4" />
      <line x1="25" y1="25" x2="29" y2="29" />
    </svg>
  ),
  'user-flows': (
    <svg {...SVG_DEFAULTS}>
      <rect x="2" y="8" width="8" height="6" rx="1" />
      <rect x="22" y="8" width="8" height="6" rx="1" />
      <rect x="12" y="20" width="8" height="6" rx="1" />
      <line x1="10" y1="11" x2="22" y2="11" />
      <line x1="16" y1="14" x2="16" y2="20" />
    </svg>
  ),
  wireframes: (
    <svg {...SVG_DEFAULTS}>
      <path d="M4 28 L8 24 L23 9 L27 13 L12 28 Z" />
      <line x1="20" y1="12" x2="24" y2="16" />
    </svg>
  ),
  prototyping: (
    <svg {...SVG_DEFAULTS}>
      <path d="M6 4 L6 22 L11 17 L15 25 L18 24 L14 16 L20 16 Z" />
      <polyline points="20 24 24 28 30 22" />
    </svg>
  ),
  'design-system-ux': (
    <svg {...SVG_DEFAULTS}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="13" y="4" width="6" height="6" rx="1" />
      <rect x="22" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="13" width="6" height="6" rx="1" />
      <rect x="13" y="13" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="22" y="13" width="6" height="6" rx="1" />
      <rect x="4" y="22" width="6" height="6" rx="1" />
      <rect x="13" y="22" width="6" height="6" rx="1" />
      <rect x="22" y="22" width="6" height="6" rx="1" />
    </svg>
  ),

  // --- Creative Design ---
  visual: (
    <svg {...SVG_DEFAULTS}>
      <path d="M16 4 C8 4, 3 10, 3 16 C3 22, 9 26, 14 26 C14 22, 18 22, 18 26 C24 26, 29 22, 29 16 C29 10, 24 4, 16 4 Z" />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
      <circle cx="22" cy="14" r="1.5" fill="currentColor" />
    </svg>
  ),
  slides: (
    <svg {...SVG_DEFAULTS}>
      <rect x="4" y="6" width="24" height="18" rx="1.5" />
      <line x1="9" y1="13" x2="22" y2="13" />
      <line x1="9" y1="17" x2="22" y2="17" />
      <line x1="9" y1="21" x2="18" y2="21" />
    </svg>
  ),
  '3d': (
    <svg {...SVG_DEFAULTS}>
      <path d="M16 4 L28 10 L28 22 L16 28 L4 22 L4 10 Z" />
      <path d="M4 10 L16 16 L28 10" />
      <line x1="16" y1="16" x2="16" y2="28" />
    </svg>
  ),
  photo: (
    <svg {...SVG_DEFAULTS}>
      <rect x="3" y="9" width="26" height="18" rx="2" />
      <path d="M10 9 L13 5 L19 5 L22 9" />
      <circle cx="16" cy="18" r="5" />
    </svg>
  ),
  craft: (
    <svg {...SVG_DEFAULTS}>
      <circle cx="8" cy="23" r="3" />
      <circle cx="24" cy="23" r="3" />
      <path d="M11 22 L20 8" />
      <path d="M21 22 L12 8" />
    </svg>
  ),
  game: (
    <svg {...SVG_DEFAULTS}>
      <rect x="3" y="10" width="26" height="14" rx="3" />
      <line x1="8" y1="17" x2="13" y2="17" />
      <line x1="10.5" y1="14.5" x2="10.5" y2="19.5" />
      <circle cx="21" cy="15" r="1.5" fill="currentColor" />
      <circle cx="24" cy="19" r="1.5" fill="currentColor" />
    </svg>
  ),
};

export default function MarqueeSubSkillCard({
  card,
  variant = 'a',
}: {
  card: {
    icon: string;
    color?: string;
    num: string;
    title: ReactNode;
    caption: ReactNode;
  };
  variant?: 'a' | 'b';
}) {
  const icon = ICONS[card.icon] || null;

  return (
    <article
      className={`hero-marquee__slide hero-marquee__slide--${variant}`}
      data-color={card.color}
      aria-hidden="true"
    >
      {/* Reusing the service-card__header / __num hooks keeps the
          number's typographic treatment in one place — change the
          rule once and both surfaces follow. */}
      <header className="service-card__header">
        <span className="service-card__num">( {card.num} )</span>
      </header>

      <div className="service-card__icon">{icon}</div>

      <div className="service-card__body">
        <h4>{card.title}</h4>
        <p>{card.caption}</p>
      </div>
    </article>
  );
}
