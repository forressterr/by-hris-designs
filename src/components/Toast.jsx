import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Toast — small fixed pop-in that confirms (or fails) a form submission.
 *
 * Renders via React Portal to <body> so it sits above any page chrome
 * (header, footer, modals). Auto-dismisses after `duration` ms; can also
 * be closed manually with the × button.
 *
 * Props:
 *   - kind        : 'success' | 'error'  (drives icon + accent colour)
 *   - message     : string                (the visible copy)
 *   - onClose     : () => void            (parent clears its toast state)
 *   - duration    : number (ms, default 5000) — set to 0 to disable
 *                   auto-dismiss
 *
 * Accessibility:
 *   - role="status" + aria-live="polite" for success (non-interrupting)
 *   - role="alert"  + aria-live="assertive" for error (interrupting)
 *   - The × button is a real <button> with aria-label so keyboard
 *     and AT users can dismiss it.
 */

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 9" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="6" y1="18" x2="18" y2="6" />
  </svg>
);

export default function Toast({ kind = 'success', message, onClose, duration = 5000 }) {
  // Auto-dismiss timer. Resets whenever the message changes so a fresh
  // toast gets its full duration even if the previous one was mid-flight.
  useEffect(() => {
    if (!duration) return undefined;
    const id = window.setTimeout(() => onClose(), duration);
    return () => window.clearTimeout(id);
  }, [message, duration, onClose]);

  // Dismiss on ESC for keyboard users.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`toast toast--${kind}`}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
    >
      <span className="toast__icon">
        {kind === 'success' ? <CheckIcon /> : <AlertIcon />}
      </span>
      <span className="toast__message">{message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </div>,
    document.body,
  );
}
