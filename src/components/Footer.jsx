import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import ContactForm from './ContactForm.jsx';

/**
 * Mailto fallback toggle.
 * Set to `true` if the contact form ever breaks — that surfaces the raw
 * mailto link again so visitors can still reach the inbox. Hidden by
 * default while the FormSubmit pipeline is the canonical path.
 */
const SHOW_MAILTO_FALLBACK = false;

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Logo size="lg" />
            <p className="site-footer__brand-text">
              I’d love to hear from you — whether you have a project in mind, or
              just want to say hi. Always up for a coffee.
            </p>
            {SHOW_MAILTO_FALLBACK && (
              <a
                href="mailto:h.goretsov@gmail.com"
                className="site-footer__email"
              >
                h.goretsov@gmail.com
              </a>
            )}
          </div>
          <ContactForm variant="dark" />
        </div>

        <div className="site-footer__bottom">
          <nav className="footer-nav" aria-label="Footer">
            <NavLink to="/works">Work</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/labs">Labs</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <span>( ©26 By_Hris Designs )</span>
        </div>
      </div>
    </footer>
  );
}
