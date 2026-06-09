import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

/**
 * ProjectShell — sidebar + main content shell for project case study pages.
 *
 * Scroll-spy: a single IntersectionObserver tracks when each <section id>
 * in the main column crosses the top of the viewport, and the active
 * sidebar item updates to match. Clicking a sidebar link smooth-scrolls.
 *
 * Pass `sections` as the source of truth — same array drives both the
 * sidebar nav AND the expected section ids in `children`.
 */

interface Section {
  id: string;
  label: ReactNode;
}

export default function ProjectShell({
  sections,
  children,
  className = '',
}: {
  sections: Section[];
  children?: ReactNode;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | undefined>(sections[0]?.id);
  const mainRef = useRef<HTMLElement>(null);

  // Track which section is currently most-in-view via IntersectionObserver.
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
        rootMargin: '-25% 0px -60% 0px',
        threshold: 0,
      },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [sections]);

  const handleJump = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    // Offset for the sticky site header (64 px padding) + a small gap.
    const headerOffset = 80;
    const top =
      target.getBoundingClientRect().top + window.scrollY - headerOffset;
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
