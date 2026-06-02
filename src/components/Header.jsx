import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import LiveTime from './LiveTime.jsx';
import ThemeToggle from './ThemeToggle.jsx';

/**
 * Primary navigation items. Each one is a real top-level page in the
 * router (see App.jsx). The dynamic project detail route (/projects/:slug)
 * is intentionally NOT listed here — those are reached via the Work page,
 * not directly from the global nav.
 */
const NAV_ITEMS = [
  { to: '/about', label: 'About' },
  { to: '/works', label: 'Work' },
  { to: '/labs', label: 'Labs' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the drawer whenever the route changes (covers both NavLink
  // clicks inside the drawer and any external navigation).
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // ESC closes the drawer.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Lock body scroll while the drawer is open so the page underneath
  // doesn't scroll when the user swipes on the drawer.
  useEffect(() => {
    if (isOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
    return undefined;
  }, [isOpen]);

  return (
    /* The drawer MUST be a sibling of <header>, not a child of it.
       The header uses `backdrop-filter` for its frosted-glass effect,
       which makes it a containing block for `position: fixed`
       descendants — meaning a fixed drawer inside the header resolves
       its `inset: 0` against the 60-px header box instead of the
       viewport. Hoisting the drawer to `.site` level (which has no
       transform/filter/backdrop-filter) lets `position: fixed` resolve
       to the viewport as expected. */
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Link
            to="/"
            className="site-header__logo"
            aria-label="By_Hris Designs — Home"
          >
            <Logo size="sm" />
          </Link>

          <LiveTime />

          <div className="site-header__actions">
            {/* Theme toggle sits as the FIRST child of the actions row,
                so its flex order naturally puts it to the LEFT of
                whatever is visible at the current breakpoint —
                desktop: left of the nav (so left of "About");
                mobile/tablet: left of the +/× menu button. One
                element, two correct placements. */}
            <ThemeToggle />

            {/* Desktop: horizontal nav. CSS hides this ≤ 1024px. */}
            <nav className="site-header__nav" aria-label="Primary">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="site-header__link"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Tablet + mobile: + button that rotates to ×. CSS hides
                this ≥ 1025px. */}
            <button
              type="button"
              className={`site-header__toggle${isOpen ? ' is-open' : ''}`}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              aria-controls="site-drawer"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                aria-hidden="true"
              >
                <path
                  d="M11 2v18M2 11h18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Drawer — rendered always, but only visible (and only positioned)
          ≤ 1024px via CSS. The transform animation slides it in from
          above; aria-hidden + tabIndex keep its links out of the AT/tab
          tree while it's closed. */}
      <div
        id="site-drawer"
        className={`site-drawer${isOpen ? ' is-open' : ''}`}
        aria-hidden={!isOpen}
      >
        <nav className="site-drawer__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="site-drawer__link"
              tabIndex={isOpen ? 0 : -1}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
