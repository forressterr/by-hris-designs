import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Lightbox — fullscreen modal for inspecting a single image.
 *
 * Renders via React portal to <body>, so the backdrop covers the
 * header / footer / drawer alike. Closes on:
 *   - × button click
 *   - backdrop click (outside the image)
 *   - ESC key
 *
 * Body scroll locks while open so the visitor can't accidentally
 * scroll the underlying page behind the modal.
 *
 * Use via the <ZoomableImage> wrapper or directly:
 *   {isOpen && <Lightbox src={…} alt={…} onClose={…} />}
 */

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       strokeLinejoin="round" aria-hidden="true">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="6" y1="18" x2="18" y2="6" />
  </svg>
);

export default function Lightbox({ src, alt = '', onClose }) {
  // ESC to close + body scroll lock for the duration of mount.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  // Click on the backdrop (but not on the image itself) closes.
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={handleBackdropClick}
    >
      <button
        type="button"
        className="lightbox__close"
        onClick={onClose}
        aria-label="Close preview"
      >
        <CloseIcon />
      </button>
      <img className="lightbox__image" src={src} alt={alt} />
    </div>,
    document.body,
  );
}
