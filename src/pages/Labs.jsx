import { Link } from 'react-router-dom';
import LabsCanvas from '../components/LabsCanvas.jsx';
import { labsAbout } from '../data/projects.js';

/**
 * Labs — gateway page for experiments, side projects, and
 * works-in-progress. Layout intentionally mirrors the Works page head
 * (eyebrow + h1 + aside + divider) so the two pages feel like
 * siblings in the same archive system.
 *
 * Body section contains the LabsCanvas — a custom pan/zoom canvas of
 * idle-floating category nodes wired around a pinned centre, the Labs
 * "work in progress" overview. Self-contained (no React Flow); the
 * page supplies the chrome (eyebrow + h1 + lede + CTA) above it.
 */
export default function Labs() {
  return (
    <div className="container page-canvas">
      <section>
        <div className="page-head">
          <div>
            <span className="eyebrow">LABS WORK</span>
            <h1 style={{ marginTop: 16 }}>
              Pushing design into new tools, new patterns, and the everyday
              problems it could still solve — with a handful of spark.
            </h1>
          </div>
          <div className="page-head__aside">
            <p>
              My family raised me to imagine first, find my own way around
              obstacles, and never call anything a failure — just the next
              lesson. Most of what lives in here started from that instinct.
            </p>
            <Link
              to="/contact"
              className="inline-link"
              style={{ alignSelf: 'flex-end' }}
            >
              Let’s Talk +
            </Link>
          </div>
        </div>
        <div className="divider" />
      </section>

      {/* Tighten the section's top padding so the canvas reads as a
          direct continuation of the page-head divider above it. */}
      <section className="section" style={{ paddingTop: 24 }}>
        <LabsCanvas />
      </section>

      {/* Purpose of Labs — mirrors the Skills & Expertise layout from
          the About page (.gear: left column with eyebrow + heading,
          right column with a definition list). Each row covers one of
          the things this space is for. */}
      <section>
        <div className="gear gear--labs">
          <div>
            <span className="eyebrow">ABOUT LABS</span>
            <h2 style={{ marginTop: 12, fontSize: '1.75rem' }}>
              Where the curiosity and imagination gives a start to new horizons.
            </h2>
          </div>
          <dl className="gear__list">
            {labsAbout.map((item) => (
              <div key={item.name} className="gear__row">
                <dt>{item.name}</dt>
                <dd>{item.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
