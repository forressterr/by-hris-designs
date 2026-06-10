import Seo from '../components/Seo';
import ContactForm from '../components/ContactForm';
import FAQ from '../components/FAQ';
import { homeFaqs } from '../data/projects';

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
