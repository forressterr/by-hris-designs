import { useState } from 'react';

/**
 * AnnotatedImage — a single image overlaid with numbered hotspots.
 *
 * Use to call out specific design decisions on one screen ("1: live
 * inventory chip, 2: progressive disclosure on the variant picker",
 * etc).
 *
 * Each callout is positioned by percentage so it scales with the
 * image. Clicking / hovering / focusing a hotspot reveals its label
 * (and any longer description) in a small popover.
 *
 * Props:
 *   - src       : image URL (or a placeholder element if you pass
 *                 `children` instead — see fallback below)
 *   - alt       : alt text for the image
 *   - callouts  : Array<{ x: number, y: number, label: string,
 *                          body?: string }>
 *   - children  : optional — render instead of <img>. Useful for a
 *                 placeholder block when no image is ready yet.
 */

export default function AnnotatedImage({ src, alt = '', callouts = [], children }) {
  // -1 = no callout open
  const [openIndex, setOpenIndex] = useState(-1);

  const toggle = (i) => () => setOpenIndex((cur) => (cur === i ? -1 : i));

  return (
    <div className="annotated-image">
      <div className="annotated-image__media">
        {children || (src && <img src={src} alt={alt} />)}
        {callouts.map((c, i) => (
          <button
            key={i}
            type="button"
            className={`annotated-image__hotspot${
              openIndex === i ? ' is-open' : ''
            }`}
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            onClick={toggle(i)}
            aria-expanded={openIndex === i}
            aria-label={`Detail ${i + 1}: ${c.label}`}
          >
            <span className="annotated-image__hotspot-num">{i + 1}</span>
            {openIndex === i && (
              <span className="annotated-image__hotspot-popover" role="tooltip">
                <strong>{c.label}</strong>
                {c.body && <span className="annotated-image__hotspot-body">{c.body}</span>}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
