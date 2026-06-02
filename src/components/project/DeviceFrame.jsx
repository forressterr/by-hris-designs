/**
 * DeviceFrame — minimal browser / phone chrome around a screen.
 *
 * Style intent (per the brief): minimal — thin rounded box with three
 * traffic-light dots in the corner. NO realistic phone notch / URL bar
 * etc. Just enough chrome to read as "this is a screen" without
 * competing with the screen itself.
 *
 * Two variants:
 *   desktop  → wide rectangle, thin top bar with 3 dots, default 16:10
 *   mobile   → narrow vertical, no chrome bar (mobile UIs have their own
 *              status bar baked into the screenshot), default 9:19
 *
 * Children render inside `.device-frame__screen`. Pass any aspect-ratio
 * override via `aspect` prop. Pass `label` to render a small caption
 * underneath the frame (e.g. "Cipher — Product detail").
 */

export default function DeviceFrame({
  variant = 'desktop',
  aspect,
  label,
  className = '',
  children,
}) {
  const classes = [
    'device-frame',
    `device-frame--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  // Inline style override for non-default aspect ratios.
  const screenStyle = aspect ? { aspectRatio: aspect } : undefined;

  return (
    <figure className={classes}>
      <div className="device-frame__body">
        {variant === 'desktop' && (
          <div className="device-frame__chrome" aria-hidden="true">
            <span className="device-frame__dot" />
            <span className="device-frame__dot" />
            <span className="device-frame__dot" />
          </div>
        )}
        <div className="device-frame__screen" style={screenStyle}>
          {children}
        </div>
      </div>
      {label && <figcaption className="device-frame__label">{label}</figcaption>}
    </figure>
  );
}
