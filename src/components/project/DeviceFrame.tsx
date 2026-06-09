import type { ReactNode } from 'react';

/**
 * DeviceFrame — minimal browser / phone chrome around a screen.
 *
 * Two variants:
 *   desktop  → wide rectangle, thin top bar with 3 dots, default 16:10
 *   mobile   → narrow vertical, no chrome bar, default 9:19
 *
 * Children render inside `.device-frame__screen`. Pass any aspect-ratio
 * override via `aspect`. Pass `label` to render a small caption.
 */

interface DeviceFrameProps {
  variant?: 'desktop' | 'mobile';
  aspect?: string;
  label?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export default function DeviceFrame({
  variant = 'desktop',
  aspect,
  label,
  className = '',
  children,
}: DeviceFrameProps) {
  const classes = ['device-frame', `device-frame--${variant}`, className]
    .filter(Boolean)
    .join(' ');

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
      {label && (
        <figcaption className="device-frame__label">{label}</figcaption>
      )}
    </figure>
  );
}
