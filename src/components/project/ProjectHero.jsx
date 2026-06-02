/**
 * ProjectHero — opening block of every project case study.
 *
 * Layout: eyebrow / title / tagline stacked on the left, the hero
 * `children` slot (typically a DeviceFrame around the hero screen)
 * to the right or below.
 *
 * Props:
 *   - eyebrow   : short label above title ('STOREFRONT', 'DASHBOARD APP', etc.)
 *   - title     : project name
 *   - tagline   : one-liner under the title
 *   - children  : the hero visual (DeviceFrame + screen, or a single image)
 */

export default function ProjectHero({ eyebrow, title, tagline, children }) {
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
