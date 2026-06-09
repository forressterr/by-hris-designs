import Seo from '../components/Seo';
import ContactForm from '../components/ContactForm';
import FAQ from '../components/FAQ';
import { homeFaqs } from '../data/projects';

/**
 * Mailto fallback toggle — kept in sync with the same flag in Footer.jsx.
 * Flip both to `true` if the contact form pipeline ever breaks and you
 * want the raw mailto link to surface as a backup.
 */
const SHOW_MAILTO_FALLBACK = false;

export default function Contact() {
  return (
    <div className="container page-canvas">
      <Seo path="/contact" />
      <section>
        <div className="page-head">
          <div>
            <span className="eyebrow">GET IN TOUCH</span>
            <h1 style={{ marginTop: 16 }}>
              Got a project in mind? Let’s chat and bring it to life.
            </h1>
          </div>
          <div className="page-head__aside">
            <p>
              Open to product, experience, and web design roles in the
              Netherlands, Bulgaria, or fully remote. Always up for a coffee.
            </p>
            {/* "Let's Talk +" link hidden for now (it's a self-link on
                the contact page anyway). To bring it back, uncomment:

                <Link to="/contact" className="inline-link" style={{ alignSelf: 'flex-end' }}>
                  Let's Talk +
                </Link>
            */}
          </div>
        </div>
        <div className="divider" />
      </section>

      <section className="section" style={{ paddingTop: 48 }}>
        <div className="contact-row contact-row--with-links">
          {/* Profile + document links. DOM-first on purpose: on tablet/phone
              the row is a single column, so these sit ABOVE the form in a
              horizontal, left-to-right row; on desktop the grid moves them to
              the right column (vertical stack) with the form held left.
              The CV / Résumé open as standalone, portfolio-styled HTML docs
              (public/Hristian-Goretsov-*.html) in a new tab — each carries its
              own "Save as PDF" button for a print/PDF copy. */}
          <nav className="contact-links" aria-label="Profile and documents">
            <a
              className="inline-link"
              href="https://www.linkedin.com/in/hristian-goretsov-aba5a0231/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn ↗
            </a>
            <a
              className="inline-link"
              href="/Hristian-Goretsov-CV.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              View CV ↗
            </a>
            <a
              className="inline-link"
              href="/Hristian-Goretsov-Resume.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Resume ↗
            </a>
          </nav>

          {SHOW_MAILTO_FALLBACK && (
            <a
              href="mailto:h.goretsov@gmail.com"
              className="site-footer__email"
              style={{ color: 'var(--ink)', borderColor: 'var(--ink)' }}
            >
              h.goretsov@gmail.com
            </a>
          )}
          <ContactForm variant="light" />
        </div>
      </section>

      <section className="section">
        <div className="faq">
          <div className="faq__intro">
            <h2>FAQ.</h2>
          </div>
          <FAQ items={homeFaqs} />
        </div>
      </section>
    </div>
  );
}
