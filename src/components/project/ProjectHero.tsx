import type { ReactNode } from 'react';

/**
 * ProjectHero — opening block of every project case study.
 *
 * Layout: eyebrow / title / tagline stacked on the left, the hero
 * `children` slot (typically a DeviceFrame around the hero screen)
 * to the right or below.
 */

interface ProjectHeroProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  tagline?: ReactNode;
  children?: ReactNode;
}

export default function ProjectHero({
  eyebrow,
  title,
  tagline,
  children,
}: ProjectHeroProps) {
  return (
    <header className="project-hero">
      <div className="project-hero__text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="project-hero__title">{title}</h1>
        {tagline && <p className="project-hero__tagline">{tagline}</p>}
      </div>
      {children && <div className="project-hero__visual">{children}</div>}
    </header>
  );
}
