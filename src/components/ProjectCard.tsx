import Link from 'next/link';
import Image from 'next/image';
import type { PROJECTS_QUERY_RESULT } from '../../sanity.types';

export default function ProjectCard({
  project,
}: {
  project: PROJECTS_QUERY_RESULT[number];
}) {
  // Tile thumbnail: prefer the dedicated cover image, then fall back to the
  // case-study hero. Projects without either fall back to the checkered
  // placeholder.
  const thumb = project.cover || project.caseStudy?.overview?.hero?.src;
  return (
    <Link href={`/works/${project.slug}`} className="project-card">
      <div className="project-card__media" aria-hidden="true">
        {thumb && (
          <Image
            src={thumb}
            alt=""
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
      </div>
      <div className="project-card__meta">
        <span>{project.name}</span>
        <span>{project.date}</span>
      </div>
    </Link>
  );
}
