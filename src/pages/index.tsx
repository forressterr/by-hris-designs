import { useRef, useState } from 'react';
import Link from 'next/link';
import Seo from '../components/Seo';
import ProjectCard from '../components/ProjectCard';
import FAQ from '../components/FAQ';
import RotatingWords from '../components/RotatingWords';
import ServiceCard from '../components/ServiceCard';
import TestimonialCard from '../components/TestimonialCard';
import LightPullString from '../components/LightPullString';
import MarqueeSubSkillCard from '../components/MarqueeSubSkillCard';
import SlideShow from '../components/SlideShow';
import LabsCover from '../components/LabsCover';
import Reveal from '../components/motion/Reveal';
import Parallax from '../components/motion/Parallax';
import {
  services,
  testimonials,
  homeFaqs,
  marqueeSubSkills,
} from '../data/projects';
import type { GetStaticProps } from 'next';
import type {
  PROJECTS_QUERY_RESULT,
  LABS_QUERY_RESULT,
} from '../../sanity.types';
import { client } from '../sanity/lib/client';
import { PROJECTS_QUERY, LABS_QUERY } from '../sanity/lib/queries';

// Rotating roles for the landing headline. The article "a" lives in the
// static lead line above ("Hris is a"), so each role here is just the
// noun (or noun phrase). Pulled from the bio + CV — multi-disciplinary
// span (research, UI, systems, code, 3D) + curious-tinkerer persona.
const ROLES = [
  'Designer.',
  'Researcher.',
  'Maker.',
  'Strategist.',
  'Tinkerer.',
  'Jack of all trades, mastering them all.',
];

export default function Home({
  projects,
  labs,
}: {
  projects: PROJECTS_QUERY_RESULT;
  labs: LABS_QUERY_RESULT;
}) {
  // Ref to the rotating-headline title element. LightPullString uses this
  // to drive its IntersectionObserver — the cord + hint fade out the
  // moment the headline leaves the viewport (not when the entire
  // landing section does), so they disappear as soon as the
  // user-relevant area is off-screen.
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  // Toggled by the pull-string. When true, the rotating headline word
  // renders with the gold gradient + glow (.rotating-word.is-lit).
  const [isLit, setIsLit] = useState(false);
  const togglePull = () => setIsLit((prev) => !prev);

  return (
    <>
      <Seo path="/" />
      {/* TOP CONTAINER — landing + any sections above the full-bleed
          marquee. The .container.page-canvas wrap is now owned by the
          page (not Layout) so the marquee section a few lines down can
          live as a direct child of .site-main and be truly site-main
          wide rather than relying on CSS breakout from inside a
          centered narrow column. */}
      <div className="container page-canvas">
        {/* New left-aligned landing: small lead → rotating headline →
          subtitle on the left, placeholder media on the right.
          The right tile is intentionally left as a placeholder for an
          image/video drop-in later. */}
        {/* Landing: full-width single column. The rotating-headline title
          reserves at least 2 lines of height (CSS min-height: 2lh) so
          short rotating words don't cause the subtitle below to jump
          when they swap. */}
        <section className="landing">
          <div className="landing__text">
            <h2 className="landing__lead">Get to know Hris as a</h2>
            <h1 ref={titleRef} className="brand-hero__title landing__title">
              <RotatingWords words={ROLES} lit={isLit} />
            </h1>
            <p className="brand-hero__sub landing__sub">
              Born and raised in Sofia, BG
              <br />
              Based in Eindhoven, NL
            </p>
          </div>
        </section>
      </div>
      {/* /TOP CONTAINER */}

      {/*
        FULL-BLEED MARQUEE — sits as a direct child of .page-reveal
        (which is a direct child of .site-main), NOT inside the
        container. Its CSS is now `width: 100%` so it naturally fills
        the site-main width without the old 100vw + negative-margin
        breakout hack. The masks at left:0 / right:0 therefore sit
        exactly on the site-main borders.
      */}
      {/* Marquee gets a single-shot fade-in on first encounter — quick
          and gentle so the auto-scrolling tiles materialise instead of
          popping in. distance kept small (12px) since the section is a
          full-bleed band where a big rise would feel like a jolt. The
          CSS auto-scroll animation inside continues unaffected. */}
      <Reveal
        as="section"
        className="hero-marquee"
        aria-label="Sub-skills — full descriptions in the Services section below"
        distance={12}
        duration={0.7}
        amount={0.05}
      >
        <div className="hero-marquee__track">
          {/* Each tile is one sub-skill from the four service categories
              (see data/projects.ts → marqueeSubSkills). The A/B variant
              alternates so the chain-link border-radius rhythm holds —
              even index = A (rounded ↘ diagonal), odd = B (rounded ↙).
              The whole set is rendered twice back-to-back so the
              translateX(-50%) scroll animation loops with no visible
              seam between the last and first tile. */}
          {marqueeSubSkills.map((card, i) => (
            <MarqueeSubSkillCard
              key={`set1-${card.num}`}
              card={card}
              variant={i % 2 === 0 ? 'a' : 'b'}
            />
          ))}
          {marqueeSubSkills.map((card, i) => (
            <MarqueeSubSkillCard
              key={`set2-${card.num}`}
              card={card}
              variant={i % 2 === 0 ? 'a' : 'b'}
            />
          ))}
        </div>
      </Reveal>

      {/* BOTTOM CONTAINER — everything below the marquee returns to
          the centered max-1440 column. */}
      <div className="container page-canvas">
        <Reveal as="section" className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">HOW I WORK</span>
              <h2
                style={{
                  marginTop: 12,
                  /* Override the global .section-head h2 max-width of 18ch
                   (which is tuned for short titles like "Services.") with
                   a wider 30ch so a 51-char philosophy quote can wrap into
                   exactly two lines instead of three. */
                  maxWidth: '30ch',
                  /* Scale the font from desktop down through mobile. The
                   1.5rem minimum at small phones keeps "The most
                   interesting problems" fitting on one line; the 2.75rem
                   maximum holds the visual weight on ultrawide. */
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.75rem)',
                  /* Let the browser balance the wrap so both lines come out
                   roughly the same width, regardless of viewport. Removes
                   the need for a hand-placed <br/> that breaks at narrow
                   widths. */
                  textWrap: 'balance',
                }}
              >
                The most interesting problems rarely sit in one bucket.
              </h2>
            </div>
          </div>

          <div className="tile-pair">
            {/* Parallax wraps the tile element itself (no extra DOM wrapper)
              so the grid-item alignment + tile-aspect ratio still apply.
              Slideshow rises slightly faster than the page; quote tile
              counter-parallaxes (direction="down") for a layered feel. */}
            <Parallax
              as="div"
              className="tile tile-aspect tile--slideshow"
              speed={0.06}
            >
              <SlideShow
                ariaLabel="Photos of Hristian and his work"
                slides={[
                  {
                    src: '/home/home-1.jpg',
                    alt: 'Hristian Goretsov — portrait',
                  },
                  {
                    src: '/home/home-2.jpg',
                    alt: 'Photo by Hristian Goretsov',
                  },
                  {
                    src: '/home/home-3.jpg',
                    alt: 'Photo by Hristian Goretsov',
                  },
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
                  My best work usually starts somewhere I wasn’t looking — a
                  side project, a long walk, a half-finished sketchbook. I move
                  between research, UI, code, and the occasional Blender
                  afternoon, because the interesting problems rarely respect a
                  single discipline. The trick is staying curious, making the
                  rough thing, and asking whoever’s closest to the work what
                  they’d change.
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
        </Reveal>

        <Reveal as="section" className="section">
          <div className="section-head">
            <h2>
              Latest
              <br />
              Projects.
            </h2>
            <div className="section-head__aside">
              <Link href="/works" className="inline-link">
                View all projects +
              </Link>
            </div>
          </div>

          {/* Stagger reveal — the grid parent orchestrates child timing;
            each ProjectCard wrapper inherits the cascading "visible"
            variant via the `item` flag. */}
          <Reveal as="div" className="project-grid" stagger={0.08}>
            {projects
              .filter((p) => p.slug === 'daily-dojo' || p.slug === 'fundedr')
              .map((project) => (
                <Reveal item as="div" key={project.slug}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
          </Reveal>
        </Reveal>

        <Reveal as="section" className="section">
          <div className="section-head">
            <h2>Services.</h2>
          </div>

          <Reveal as="div" className="services" stagger={0.08}>
            {services.map((service) => (
              <Reveal item as="div" key={service.num}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </Reveal>
        </Reveal>

        <Reveal as="section" className="section">
          <div className="section-head">
            <h2>
              Inside the
              <br />
              Labs.
            </h2>
            <div className="section-head__aside">
              <Link href="/labs" className="inline-link">
                Take a peek +
              </Link>
            </div>
          </div>

          {/* Sneak-peek — the real constellation runs as a non-interactive,
            theme-reactive background behind a locked Apple-style "liquid
            glass" panel. The whole tile is one link into /labs. */}
          <div style={{ marginTop: 40 }}>
            <LabsCover />
          </div>

          <Reveal
            as="div"
            className="stats"
            stagger={0.06}
            style={{ marginTop: 56 }}
          >
            {(labs?.stats ?? []).map((stat) => (
              <Reveal item as="div" key={stat.label} className="stat">
                <div className="stat__value">{stat.value}</div>
                <div className="stat__label">{stat.label}</div>
              </Reveal>
            ))}
          </Reveal>
        </Reveal>

        {/* Testimonials — same flip-card pattern + grid as Services,
          relocated to sit right above the FAQ section so the page
          ends with "praise → questions → footer" rather than the
          testimonials being lost in the middle. */}
        <Reveal as="section" className="section">
          <div className="section-head">
            <h2>Testimonials.</h2>
          </div>

          <Reveal as="div" className="services" stagger={0.08}>
            {testimonials.map((testimonial) => (
              <Reveal item as="div" key={testimonial.num}>
                <TestimonialCard testimonial={testimonial} />
              </Reveal>
            ))}
          </Reveal>
        </Reveal>

        <Reveal as="section" className="section">
          <div className="faq">
            <div className="faq__intro">
              <h2>FAQ.</h2>
              <p>
                The most common things people ask before reaching out. If
                anything else is on your mind, the contact form is always open.
              </p>
            </div>
            <FAQ items={homeFaqs} />
          </div>
        </Reveal>
      </div>
      {/* /BOTTOM CONTAINER */}

      {/* Hanging pull-string. Rendered via a portal into document.body
          so its position: fixed escapes any parent stacking context.
          The title ref drives its IntersectionObserver — the cord
          + hint vanish as soon as the rotating headline leaves the
          viewport (not when the whole landing section does). */}
      <LightPullString visibilityRef={titleRef} onPull={togglePull} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{
  projects: PROJECTS_QUERY_RESULT;
  labs: LABS_QUERY_RESULT;
}> = async () => {
  const [projects, labs] = await Promise.all([
    client.fetch(PROJECTS_QUERY),
    client.fetch(LABS_QUERY),
  ]);
  return { props: { projects, labs } };
};
