import Link from 'next/link';
import type { ReactNode } from 'react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { motion } from 'framer-motion';
import { projects } from '../../data/projects';
import Seo from '../../components/Seo';
import ProjectCard from '../../components/ProjectCard';
import ProjectShell from '../../components/project/ProjectShell';
import ProjectHero from '../../components/project/ProjectHero';
import ProjectMeta from '../../components/project/ProjectMeta';
import DeviceFrame from '../../components/project/DeviceFrame';
import AnnotatedImage from '../../components/project/AnnotatedImage';
import ScreenSwitcher from '../../components/project/ScreenSwitcher';

const MotionLink = motion.create(Link);

// Sections that appear in the sidebar nav, in order. Same `id`s are
// used as anchor targets in the main content below.
const TEMPLATE_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'problem', label: 'Problem' },
  { id: 'process', label: 'Process' },
  { id: 'screens', label: 'Key screens' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'hotspots', label: 'Highlights' },
  { id: 'outcome', label: 'Outcome' },
];

// Placeholder block — used when a section has no `caseStudy` content
// yet. Same striped pattern as the rest of the site's `.tile` so it
// reads as deliberate WIP rather than broken.
function Placeholder({
  label,
  aspect,
  minHeight,
}: {
  label?: ReactNode;
  aspect?: string;
  minHeight?: number | string;
}) {
  const style = {
    aspectRatio: aspect || undefined,
    minHeight: minHeight || undefined,
  };
  return (
    <div className="project-placeholder" style={style}>
      <span className="project-placeholder__label">{label}</span>
    </div>
  );
}

// Render an <img> if `slide.src` is set, otherwise a Placeholder.
// Used by every visual slot — keeps the "real content OR placeholder"
// branching in one helper.
function ScreenImage({
  slide,
  fallbackLabel,
}: {
  slide?: { src?: string; alt?: string; label?: string } | null;
  fallbackLabel?: ReactNode;
}) {
  if (slide?.src) {
    return <img src={slide.src} alt={slide.alt || slide.label || ''} />;
  }
  return <Placeholder label={fallbackLabel} />;
}

export default function Project({ project }: { project: any }) {

  // Other projects, ordered by tag-similarity to this one (most shared
  // tags first, least similar last) — feeds the "More projects" carousel.
  const relatedProjects = projects
    .filter((p) => p.slug !== project.slug)
    .map((p) => ({
      p,
      score: (p.tags || []).filter((t) => (project.tags || []).includes(t))
        .length,
    }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);

  // `caseStudy` is optional per project. When absent, the page renders
  // its 7-section template with placeholder content. When present, each
  // section pulls from the data object below.
  const cs = project.caseStudy;

  // ---- Defaults that survive when `caseStudy` is missing a key ----
  const heroSlide = cs?.overview?.hero || null;
  // Optional light/dark (or any 2-up) hero variants. When present, the hero
  // renders a small control ribbon — same ScreenSwitcher used for "Key
  // screens" — so themed projects can show both modes in one frame.
  const heroThemes = cs?.overview?.themes || null;
  const leadCopy =
    cs?.overview?.lead ||
    project.headline ||
    'A short case-study summary will live here — the one-paragraph version of what this project is, who it was for, and why it mattered.';

  const problemCopy =
    cs?.problem ||
    'Placeholder for the problem statement. Three to five sentences describing the situation, the constraints, and what success would look like — in language anyone can follow.';

  const processCopy =
    cs?.process ||
    'Placeholder for process notes — research, sketches, wireframes, mood references — the messy middle that the final screens hide.';

  const mobileScreens = cs?.mobile || [
    { label: 'Mobile home' },
    { label: 'Mobile browse' },
    { label: 'Mobile checkout' },
  ];

  const hotspots = cs?.hotspots || {
    callouts: [
      {
        x: 18,
        y: 22,
        label: 'Primary CTA placement',
        body: 'Above the fold, single colour accent.',
      },
      {
        x: 64,
        y: 38,
        label: 'Live availability chip',
        body: 'Reduces last-step abandonment.',
      },
      {
        x: 36,
        y: 72,
        label: 'Progressive disclosure',
        body: 'Optional fields collapse by default.',
      },
    ],
  };

  const switcherTabs = cs?.switcher || [
    { id: 'home', label: 'Home' },
    { id: 'goals', label: 'Goals' },
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
  ];

  const outcomeCopy =
    cs?.outcome?.copy ||
    'Placeholder for the outcome — what shipped, what changed, anything measurable. Two or three sentences plus a small stat row if the project has numbers to share.';

  const outcomeStats = cs?.outcome?.stats || [
    { value: '+0%', label: 'Placeholder metric A' },
    { value: '0', label: 'Placeholder metric B' },
    { value: '—', label: 'Placeholder metric C' },
  ];

  return (
    <div className="container page-canvas">
      <Seo path={`/projects/${project.slug}`} />
      <ProjectShell sections={TEMPLATE_SECTIONS}>
        {/* ──────────── OVERVIEW ──────────── */}
        <section id="overview" className="project-section">
          <ProjectHero
            eyebrow={cs?.eyebrow || 'CASE STUDY · WORK IN PROGRESS'}
            title={project.title}
            tagline={project.description}
          >
            {heroThemes ? (
              <DeviceFrame variant="desktop" label="Home — light / dark">
                <ScreenSwitcher
                  tabs={heroThemes.map((t: any) => ({
                    ...t,
                    children: t.src ? undefined : (
                      <Placeholder label={`${t.label} view`} />
                    ),
                  }))}
                />
              </DeviceFrame>
            ) : (
              <DeviceFrame
                variant="desktop"
                label={heroSlide?.label || 'Hero — desktop'}
              >
                <ScreenImage
                  slide={heroSlide}
                  fallbackLabel="Hero screen · placeholder"
                />
              </DeviceFrame>
            )}
          </ProjectHero>

          <ProjectMeta
            items={[
              { label: 'Role', value: 'Product / UX / UI designer' },
              { label: 'Year', value: project.year || '—' },
              { label: 'Client', value: project.client || '—' },
              { label: 'Timeline', value: project.timeline || '—' },
              { label: 'Status', value: project.status || 'In progress' },
            ]}
          />

          <p className="project-section__lead">{leadCopy}</p>
        </section>

        {/* ──────────── PROBLEM ──────────── */}
        <section id="problem" className="project-section">
          <h2 className="project-section__title">The problem</h2>
          <p className="project-section__body">{problemCopy}</p>
        </section>

        {/* ──────────── PROCESS ──────────── */}
        <section id="process" className="project-section">
          <h2 className="project-section__title">Process</h2>
          <p className="project-section__body">{processCopy}</p>
          {/* Process artifacts grid (sketches/wireframes) is hidden for now —
              re-enable per-project when real exports are worth showing. */}
        </section>

        {/* ──────────── KEY SCREENS ──────────── */}
        {/* Interactive switcher — every finished screen in one frame.
            Replaces the old stack of static frames so the article stays
            short and stays playful. Fed by the full `switcher` set. */}
        <section id="screens" className="project-section">
          <h2 className="project-section__title">Key screens</h2>
          <p className="project-section__body">
            The polished work. Tab across the top to move between the finished
            screens — every surface in a single frame.
          </p>
          <DeviceFrame variant="desktop" label="Key screens">
            <ScreenSwitcher
              tabs={switcherTabs.map((t: any) => ({
                ...t,
                children: t.src ? undefined : (
                  <Placeholder label={`${t.label} view`} />
                ),
              }))}
            />
          </DeviceFrame>
        </section>

        {/* ──────────── MOBILE ──────────── */}
        <section id="mobile" className="project-section">
          <h2 className="project-section__title">Mobile story</h2>
          <p className="project-section__body">
            How the design holds up on a phone — home, browse, and a product
            page across a small set of mobile frames.
          </p>
          <div className="project-grid-row project-grid-row--mobile-trio">
            {mobileScreens.slice(0, 3).map((s: any, i: number) => (
              <DeviceFrame key={i} variant="mobile" label={s.label}>
                <ScreenImage slide={s} fallbackLabel={s.label} />
              </DeviceFrame>
            ))}
          </div>
          {/* "Tall page in a fixed window" (ScrollViewport) is hidden for now —
              re-enable per-project when a full-page capture earns its place. */}
        </section>

        {/* ──────────── HIGHLIGHTS ──────────── */}
        <section id="hotspots" className="project-section">
          <h2 className="project-section__title">Highlights</h2>
          <p className="project-section__body">
            A single screen with numbered call-outs over specific decisions.
            Each hotspot reveals a short note on hover or tap.
          </p>
          <DeviceFrame variant="desktop" label="Annotated screen">
            <AnnotatedImage
              src={hotspots.src}
              alt={hotspots.alt || 'Annotated screen'}
              callouts={hotspots.callouts}
            >
              {!hotspots.src && (
                <Placeholder label="Annotated screen · placeholder" />
              )}
            </AnnotatedImage>
          </DeviceFrame>
          {/* "Different views, one frame" switcher now lives in the Key
              screens section above — kept here it would just repeat. */}
        </section>

        {/* ──────────── OUTCOME ──────────── */}
        <section id="outcome" className="project-section">
          <h2 className="project-section__title">Outcome</h2>
          <p className="project-section__body">{outcomeCopy}</p>
          <div className="project-stat-row">
            {outcomeStats.map((s: any, i: number) => (
              <div key={i} className="project-stat">
                <div className="project-stat__value">{s.value}</div>
                <div className="project-stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </ProjectShell>

      {/* ───── Below the shell — site-wide footer for project pages ─── */}
      <section className="section">
        <div className="section-head">
          <h2>More projects.</h2>
          <div className="section-head__aside">
            <Link href="/contact" className="inline-link">
              Get in touch +
            </Link>
          </div>
        </div>

        {/* Similarity-ordered carousel of the other case studies — reuses
            the Work-page ProjectCard tile, scaled down (see .project-carousel
            in index.css). Horizontal scroll-snap; most similar first. */}
        <div className="project-carousel">
          {relatedProjects.map((p) => (
            <div className="project-carousel__item" key={p.slug}>
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="closing-cta">
          <div className="closing-cta__frame">
            <h2>
              Have a project
              <br />
              in mind?
            </h2>
            <p>
              We’d love to hear from you — whether you have a project in mind,
              or just want to say hi.
            </p>
            <MotionLink
              href="/contact"
              className="btn btn--dark"
              whileHover={{
                y: -1,
                transition: { type: 'spring', stiffness: 380, damping: 24 },
              }}
              whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
            >
              Let’s Talk →
            </MotionLink>
          </div>
        </div>
      </section>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: projects.map((p) => ({ params: { slug: p.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<{ project: any }> = ({
  params,
}) => {
  const project = projects.find((p) => p.slug === params?.slug) ?? null;
  if (!project) return { notFound: true };
  return { props: { project } };
};
