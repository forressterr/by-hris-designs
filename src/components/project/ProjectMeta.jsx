/**
 * ProjectMeta — small label/value chip-list shown near the project
 * hero. Use for Role / Year / Scope / Team / Status — anything that
 * answers "context" at-a-glance without a paragraph.
 *
 * Pass `items` as an array of { label, value } pairs. Renders as a
 * <dl> so screen readers parse it as definitions, with monospace
 * labels stacking above each value (compact, readable, doesn't fight
 * the surrounding body type).
 */

export default function ProjectMeta({ items, className = '' }) {
  if (!items || !items.length) return null;
  return (
    <dl className={`project-meta-grid ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="project-meta-grid__cell">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
