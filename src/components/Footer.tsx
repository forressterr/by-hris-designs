import NavLink from './NavLink';
import Logo from './Logo';
import ContactForm from './ContactForm';

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
          </div>
          <ContactForm variant="dark" />
        </div>

        <div className="site-footer__bottom">
          <nav className="footer-nav" aria-label="Footer">
            <NavLink href="/works">Work</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/labs">Labs</NavLink>
            <NavLink href="/contact">Contact</NavLink>
          </nav>
          <span>( ©26 By_Hris Designs )</span>
        </div>
      </div>
    </footer>
  );
}
