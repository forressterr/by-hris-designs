import Link from 'next/link';
import Seo from '../components/Seo';
import { bio, codex, skills, tools, achievements } from '../data/projects';
import FAQ from '../components/FAQ';
import SlideShow from '../components/SlideShow';
import Reveal from '../components/motion/Reveal';
import Parallax from '../components/motion/Parallax';

export default function About() {
  return (
    <div className="container page-canvas">
      <Seo path="/about" />
      <section>
        <div className="page-head">
          <div>
            <span className="eyebrow">ABOUT THE DESIGNER</span>
            <h1 style={{ marginTop: 16 }}>
              Hristian Goretsov
              <br />
              multi-disciplinary experience designer.
            </h1>
          </div>
          <div className="page-head__aside">
            <p>
              Designing across product, web, and SaaS — and finishing an MSc in
              Human-Computer Interaction at Utrecht University on the side.
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

      <Reveal as="section" className="section" style={{ paddingTop: 32 }}>
        <div className="tile-pair">
          {/* Same parallax treatment as Home — slideshow rises slightly
              with scroll, quote tile counter-parallaxes for depth. */}
          <Parallax
            as="div"
            className="tile tile-aspect tile--slideshow"
            speed={0.06}
          >
            <SlideShow
              ariaLabel="Photos from Hristian's life and work"
              slides={[
                { src: '/about/about-1.jpg', alt: 'About — photo 1' },
                { src: '/about/about-2.jpg', alt: 'About — photo 2' },
                { src: '/about/about-3.jpg', alt: 'About — photo 3' },
                { src: '/about/about-4.jpg', alt: 'About — photo 4' },
                { src: '/about/about-5.jpg', alt: 'About — photo 5' },
                { src: '/about/about-6.jpg', alt: 'About — photo 6' },
                { src: '/about/about-7.jpg', alt: 'About — photo 7' },
                {
                  src: '/about/about-8.jpg',
                  alt: 'About — photo 8',
                  // Landscape group shot. Slight right-bias on the crop
                  // window centres the two left-most faces inside the
                  // 1:1 tile (more backdrop trims off the left, the
                  // third person on the far right stays out of frame).
                  position: '15% 50%',
                },
                { src: '/about/about-9-extra.jpg', alt: 'About — extra photo' },
              ]}
            />
          </Parallax>
          <Parallax
            as="div"
            className="tile tile--dark tile--quote"
            speed={0.04}
            direction="down"
          >
            <div>
              <p>
                Most of what I value as a designer I learned somewhere else
                first — running a corner sharpie ‘tattoo shop’ as a kid,
                soldering broken things in the garage with my dad, building IKEA
                shelves badly and then better. The work is just the same loop
                with more constraints: imagine, make, show someone, fix it.
                Repeat.
              </p>
              <div style={{ marginTop: 24 }}>
                <strong style={{ fontSize: 13 }}>Hristian Goretsov</strong>
                <div className="mono" style={{ opacity: 0.6, marginTop: 4 }}>
                  Multi-Disciplinary Experience Designer
                </div>
              </div>
            </div>
          </Parallax>
        </div>

        <div className="bio" style={{ marginTop: 64 }}>
          <div>
            {bio.map((paragraph, index) => (
              <p key={index} style={{ marginTop: index === 0 ? 0 : 16 }}>
                {paragraph}
              </p>
            ))}
          </div>

          <div className="codex">
            {/* Bumped from h4 → h3 and given a viewport-responsive size
                via clamp() so it scales between phone and desktop without
                a media query. */}
            <h3 className="codex__title">Codes to live by</h3>
            {/* Same accordion component the home/FAQ section uses, so
                every "trigger + panel" interaction reads consistently
                across the site. -1 keeps every item closed on first
                paint — feels lighter than auto-opening the first row. */}
            <FAQ items={codex} initialOpen={-1} />
          </div>
        </div>
      </Reveal>

      <Reveal as="section" stagger={0.1}>
        <Reveal item as="div" className="gear">
          <div>
            <span className="eyebrow">SKILLS &amp; EXPERTISE</span>
            <h2 style={{ marginTop: 12, fontSize: '1.75rem' }}>
              How I tend to show up.
            </h2>
          </div>
          <dl className="gear__list">
            {skills.map((item) => (
              <div key={item.name} className="gear__row">
                <dt>{item.name}</dt>
                <dd>{item.desc}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal item as="div" className="gear">
          <div>
            <span className="eyebrow">TOOLS I USE</span>
            <h2 style={{ marginTop: 12, fontSize: '1.75rem' }}>
              The kit, day-to-day.
            </h2>
          </div>
          <dl className="gear__list">
            {tools.map((item) => (
              <div key={item.name} className="gear__row">
                <dt>{item.name}</dt>
                <dd>{item.desc}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal item as="div" className="gear">
          <div>
            <span className="eyebrow">ACHIEVEMENTS</span>
            <h2 style={{ marginTop: 12, fontSize: '1.75rem' }}>
              Recognised work.
            </h2>
          </div>
          <dl className="gear__list">
            {achievements.map((item) => (
              <div key={item.name} className="gear__row">
                <dt>{item.name}</dt>
                <dd>{item.desc}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Reveal>
    </div>
  );
}
