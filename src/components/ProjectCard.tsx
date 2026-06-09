import Link from 'next/link';
import type { Project } from '../types/content';

export default function ProjectCard({ project }: { project: Project }) {
  // Tile thumbnail: prefer the dedicated cover image, then fall back to the
  // case-study hero. Projects without either fall back to the checkered
  // placeholder.
  const thumb = project.cover || project.caseStudy?.overview?.hero?.src;
  return (
    <Link href={`/projects/${project.slug}`} className="project-card">
      <div className="project-card__media" aria-hidden="true">
        {thumb && <img src={thumb} alt="" loading="lazy" decoding="async" />}
      </div>
      <div className="project-card__meta">
        <span>{project.name}</span>
        <span>{project.date}</span>
      </div>
    </Link>
  );
}
