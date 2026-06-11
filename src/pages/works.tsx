import Link from 'next/link';
import Image from 'next/image';
import Seo from '../components/Seo';
import ProjectCard from '../components/ProjectCard';
import FAQ from '../components/FAQ';
import { projects, homeFaqs } from '../data/projects';
import type { Project } from '../types/content';

// Newest-first ordering for the grid. Primary key is the visible chip year
// (the 2-digit `date`, e.g. "_25" → 25) so the grid reads descending exactly
// as labelled; ties break on the most recent year in `year` (so a 2024–2025
// project beats a 2024 one).
const chipYear = (p: Project) => {
  const m = (p.date || '').match(/\d+/);
  return m ? Number(m[0]) : 0;
};
const yearMax = (p: Project) => {
  const ys = (p.year || '').match(/\d{4}/g);
  return ys ? Math.max(...ys.map(Number)) : 0;
};
const projectsByRecency = [...projects].sort(
  (a, b) => chipYear(b) - chipYear(a) || yearMax(b) - yearMax(a),
);

export default function Works() {
  return (
    <div className="container page-canvas">
      <Seo path="/works" />
      <section>
        <div className="page-head">
          <div>
            <span className="eyebrow">SELECTED WORK</span>
            <h1 style={{ marginTop: 16 }}>
              A selection of recent work across product, web, and SaaS.
            </h1>
          </div>
          <div className="page-head__aside">
            <p>
              Studio practice, in-house product work, and the occasional side
              project that wouldn’t leave me alone.
            </p>
            <Link
              href="/contact"
              className="inline-link"
              style={{ alignSelf: 'flex-end' }}
            >
              Let’s Talk +
            </Link>
          </div>
        </div>
        <div className="divider" />
      </section>

      <section className="section" style={{ paddingTop: 32 }}>
        <div className="tile-pair tile-pair--lead">
          <div className="tile tile--dark tile--quote">
            <div>
              <p>
                Designing storefronts and product platforms end to end — Surge,
                Cipher, Altitude and Floret on the commerce side; Daily Dojo and
                Fundedr on the product side.
              </p>
              <div style={{ marginTop: 24 }}>
                <strong style={{ fontSize: 13 }}>
                  Selected work · 2023 — 2026
                </strong>
                <div className="mono" style={{ opacity: 0.6, marginTop: 4 }}>
                  Experience × Product × Service Design
                </div>
              </div>
            </div>
          </div>
          <div className="tile tile-aspect">
            <Image
              src="/work-overview.jpg"
              alt="Selected work — a montage of storefront and product-platform screens"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
            />
          </div>
        </div>

        <div className="project-grid" style={{ marginTop: 32 }}>
          {projectsByRecency.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="faq">
          <div className="faq__intro">
            <h2>FAQ.</h2>
            <p>
              The most common things people ask before reaching out. If anything
              else is on your mind, the contact form is always open.
            </p>
          </div>
          <FAQ items={homeFaqs} />
        </div>
      </section>
    </div>
  );
}
