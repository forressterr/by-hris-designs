import { useEffect, useRef, useState } from 'react';

/**
 * ProjectShell — sidebar + main content shell for project case study pages.
 *
 * Layout: two-column grid at desktop (≥ 900 px):
 *   ┌──────────┬──────────────────────────────┐
 *   │ sidebar  │ main                         │
 *   │ (sticky) │ (each <section id> stacks)   │
 *   └──────────┴──────────────────────────────┘
 *
 * On narrow viewports the sidebar collapses into a horizontal pill nav
 * that sits above the content and stays sticky to the top so the
 * visitor can jump between sections on mobile too.
 *
 * Scroll-spy: a single IntersectionObserver tracks when each
 * <section id> in the main column crosses the top of the viewport,
 * and the active sidebar item updates to match. Clicking a sidebar
 * link smooth-scrolls to its section with `scrollIntoView`.
 *
 * Pass `sections` as the source of truth — same array drives both the
 * sidebar nav AND the expected section ids in `children`. Each entry:
 *   { id: 'overview', label: 'Overview' }
 */

export default function ProjectShell({ sections, children, className = '' }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const mainRef = useRef(null);

  // Track which section is currently most-in-view via IntersectionObserver.
  // rootMargin shifts the trigger zone to "top 30% of viewport" so the
  // active item updates as a section heading approaches the top, not
  // only when the whole section is in view.
  useEffect(() => {
    if (!mainRef.current) return undefined;
    const headings = mainRef.current.querySelectorAll('section[id]');
    if (!headings.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        // Of all currently intersecting sections, pick the topmost.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Trigger zone: shrink viewport so a section counts as "active"
        // once its top crosses ~25% from the page top. The negative
        // bottom-margin ensures only one section is "active" at a time.
        rootMargin: '-25% 0px -60% 0px',
        threshold: 0,
      },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [sections]);

  const handleJump = (id) => (event) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    // Offset for the sticky site header (64 px padding) + a small gap.
    const headerOffset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
  };

  return (
    <div className={`project-shell ${className}`}>
      <aside className="project-sidebar" aria-label="On this page">
        <nav className="project-sidebar__nav">
          <span className="project-sidebar__heading">On this page</span>
          <ul role="list">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={handleJump(section.id)}
                  className={`project-sidebar__link${
                    activeId === section.id ? ' is-active' : ''
                  }`}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main ref={mainRef} className="project-main">
        {children}
      </main>
    </div>
  );
}
