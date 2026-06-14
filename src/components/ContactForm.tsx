import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import Toast from './Toast';
import {
  MAX_MESSAGE_LENGTH,
  VALIDATORS,
  validateEnquiry,
} from '../lib/contact/validation';
import type {
  EnquiryInput,
  FieldName,
  FormErrors,
} from '../lib/contact/validation';

// Validation rules + the per-field validators are shared with the server
// (src/lib/contact/validation.ts) so the client (live UX) and the
// /api/contact security gate stay identical. These checks remain CLIENT-SIDE
// for UX only — the server re-runs them as the real gate.

type FormTouched = Record<FieldName, boolean>;
type ToastState = { kind: 'success' | 'error'; message: string };

const EMPTY_VALUES: EnquiryInput = {
  name: '',
  email: '',
  message: '',
  company: '',
  subject: '',
  budget: '',
  timeline: '',
};
const NO_ERRORS: FormErrors = {
  name: null,
  email: null,
  message: null,
  company: null,
  subject: null,
  budget: null,
  timeline: null,
};
const NOT_TOUCHED: FormTouched = {
  name: false,
  email: false,
  message: false,
  company: false,
  subject: false,
  budget: false,
  timeline: false,
};

// ----------------------------------------------------------------------------

export default function ContactForm({
  variant = 'light',
  detailed = false,
}: {
  variant?: 'light' | 'dark';
  detailed?: boolean;
}) {
  // 'idle' | 'sending' | 'sent' | 'error'
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  );
  const isDark = variant === 'dark';
  const prefersReducedMotion = useReducedMotion();
  const btnMotion: MotionProps = prefersReducedMotion
    ? {}
    : {
        whileHover: {
          y: -1,
          transition: { type: 'spring', stiffness: 380, damping: 24 },
        },
        whileTap: { scale: 0.97, transition: { duration: 0.12 } },
      };

  // Controlled values so we can validate live + show a character counter.
  const [values, setValues] = useState<EnquiryInput>(EMPTY_VALUES);

  // Per-field error strings (null = valid / not yet validated).
  const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);

  // Per-field "touched" — only show an error once the user has either
  // tabbed away from the field or tried to submit. Saves them from being
  // yelled at while they're still mid-typing.
  const [touched, setTouched] = useState<FormTouched>(NOT_TOUCHED);

  // Floating toast — set on submit (success, validation fail, or API
  // failure). Cleared by the Toast component's onClose (auto-dismiss
  // timer or × button).
  const [toast, setToast] = useState<ToastState | null>(null);

  // The status-reset timer is tracked so a new submit (or unmount) cancels
  // the previous one — an untracked stale timer could flip 'sending' back to
  // 'idle' mid-flight and re-enable the button for a double submit.
  const idleTimer = useRef<number | undefined>(undefined);
  const scheduleIdle = useCallback((ms: number) => {
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setStatus('idle'), ms);
  }, []);
  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // Stamp when the form mounted; the elapsed-since-mount time is sent to the
  // server, which rejects implausibly fast submits as bots.
  const mountedAt = useRef<number>(0);
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);
  const showToast = useCallback(
    (kind: 'success' | 'error', message: string) => {
      // Setting a fresh object (even if kind/message match) re-mounts the
      // Toast's auto-dismiss timer via the message dep — handy if the
      // visitor submits twice quickly with the same error.
      setToast({ kind, message });
    },
    [],
  );
  const dismissToast = useCallback(() => setToast(null), []);

  const messageLength = values.message.length;
  const charsLeft = MAX_MESSAGE_LENGTH - messageLength;
  const counterTone = useMemo(() => {
    if (charsLeft < 0) return 'over';
    if (charsLeft <= 100) return 'low';
    return 'ok';
  }, [charsLeft]);

  const handleChange =
    (field: FieldName) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setValues((prev) => ({ ...prev, [field]: newValue }));
      // Live re-validate only if the field is already touched — that way
      // an error message disappears the moment the user fixes it, but
      // we don't surface an error the first time they type.
      if (touched[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: VALIDATORS[field](newValue),
        }));
      }
    };

  const handleBlur = (field: FieldName) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: VALIDATORS[field](values[field]),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;

    const form = event.currentTarget;
    const data = new FormData(form);

    // Run every validator on submit and mark every field touched so the
    // errors show even for fields the user never focused. The server re-runs
    // these as the real gate; this is for fast, local feedback.
    const nextErrors = validateEnquiry(values);
    setErrors(nextErrors);
    setTouched({
      name: true,
      email: true,
      message: true,
      company: true,
      subject: true,
      budget: true,
      timeline: true,
    });
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      // Focus the first invalid field — better keyboard UX than just
      // staring at red text and wondering where to look.
      const firstInvalid = (
        [
          'name',
          'email',
          'message',
          'company',
          'subject',
          'budget',
          'timeline',
        ] as FieldName[]
      ).find((f) => nextErrors[f]);
      if (firstInvalid) {
        const el = form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`);
        if (el && typeof el.focus === 'function') el.focus();
      }
      showToast(
        'error',
        'A few things to fix first — check the highlighted fields below.',
      );
      return;
    }

    // Entering 'sending' invalidates any pending status-reset from a
    // previous submit — it must not fire while this request is in flight.
    window.clearTimeout(idleTimer.current);
    setStatus('sending');

    try {
      // POST to our own server route. It owns the honeypot, BotID, the
      // request-timer, validation, rate-limiting, persistence, and the inbox
      // forward — the FormSubmit endpoint/email no longer ships to the client.
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          message: values.message.trim(),
          company: values.company.trim(),
          subject: values.subject.trim(),
          budget: values.budget.trim(),
          timeline: values.timeline.trim(),
          _honey: (data.get('_honey') || '').toString(),
          elapsedMs: Date.now() - mountedAt.current,
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      const payload = (
        typeof json === 'object' && json !== null ? json : {}
      ) as { ok?: unknown; error?: unknown; fields?: unknown };
      const ok = res.ok && payload.ok === true;

      if (ok) {
        setStatus('sent');
        setValues(EMPTY_VALUES);
        setTouched(NOT_TOUCHED);
        setErrors(NO_ERRORS);
        scheduleIdle(4000);
        showToast(
          'success',
          'Message on the way — I’ll get back to you within 1–2 working days.',
        );
      } else {
        setStatus('error');
        scheduleIdle(5000);
        // Surface server-side field errors if present.
        if (payload.fields && typeof payload.fields === 'object') {
          setErrors((prev) => ({ ...prev, ...(payload.fields as FormErrors) }));
          setTouched({
            name: true,
            email: true,
            message: true,
            company: true,
            subject: true,
            budget: true,
            timeline: true,
          });
        }
        showToast(
          'error',
          typeof payload.error === 'string'
            ? payload.error
            : 'That didn’t go through. Give it another try in a moment.',
        );
      }
    } catch (_err) {
      setStatus('error');
      scheduleIdle(5000);
      showToast(
        'error',
        'Couldn’t reach the inbox just now — try again in a moment.',
      );
    }
  };

  const buttonLabel = {
    idle: 'Send',
    sending: 'Sending…',
    sent: 'Sent — thanks!',
    error: 'Couldn’t send — try again',
  }[status];

  // Shared field-class builder — adds the invert variant for the dark
  // footer and the invalid variant when an error is being shown.
  const fieldClass = (field: FieldName) => {
    const classes = ['field'];
    if (isDark) classes.push('field--invert');
    if (errors[field] && touched[field]) classes.push('field--invalid');
    return classes.join(' ');
  };

  return (
    <form
      className="contact-form"
      onSubmit={handleSubmit}
      aria-describedby="contact-form-sub"
      noValidate
    >
      <h3>
        Let’s
        <br />
        Connect
      </h3>
      <span id="contact-form-sub" className="contact-form__sub">
        Usually will respond within 1-2 business days.
      </span>

      <label className={fieldClass('name')}>
        <span className="visually-hidden">Name</span>
        <input
          type="text"
          name="name"
          placeholder="Name (e.g. John Doe)"
          autoComplete="name"
          value={values.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          aria-invalid={errors.name && touched.name ? 'true' : 'false'}
          aria-describedby={
            errors.name && touched.name ? 'contact-name-error' : undefined
          }
        />
        {errors.name && touched.name && (
          <span id="contact-name-error" className="field__error" role="alert">
            {errors.name}
          </span>
        )}
      </label>

      <label className={fieldClass('email')}>
        <span className="visually-hidden">Email</span>
        <input
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          aria-invalid={errors.email && touched.email ? 'true' : 'false'}
          aria-describedby={
            errors.email && touched.email ? 'contact-email-error' : undefined
          }
        />
        {errors.email && touched.email && (
          <span id="contact-email-error" className="field__error" role="alert">
            {errors.email}
          </span>
        )}
      </label>

      {detailed &&
        (
          [
            {
              field: 'company',
              placeholder: 'Company (optional)',
              autoComplete: 'organization',
            },
            {
              field: 'subject',
              placeholder: 'Subject (optional)',
              autoComplete: 'off',
            },
            {
              field: 'budget',
              placeholder: 'Budget (optional, e.g. ~€5k)',
              autoComplete: 'off',
            },
            {
              field: 'timeline',
              placeholder: 'Timeline (optional, e.g. Q3 2026)',
              autoComplete: 'off',
            },
          ] as { field: FieldName; placeholder: string; autoComplete: string }[]
        ).map(({ field, placeholder, autoComplete }) => (
          <label key={field} className={fieldClass(field)}>
            <span className="visually-hidden">{placeholder}</span>
            <input
              type="text"
              name={field}
              placeholder={placeholder}
              autoComplete={autoComplete}
              value={values[field]}
              onChange={handleChange(field)}
              onBlur={handleBlur(field)}
              aria-invalid={errors[field] && touched[field] ? 'true' : 'false'}
              aria-describedby={
                errors[field] && touched[field]
                  ? `contact-${field}-error`
                  : undefined
              }
            />
            {errors[field] && touched[field] && (
              <span
                id={`contact-${field}-error`}
                className="field__error"
                role="alert"
              >
                {errors[field]}
              </span>
            )}
          </label>
        ))}

      <label className={fieldClass('message')}>
        <span className="visually-hidden">Message</span>
        <textarea
          name="message"
          placeholder="Message"
          rows={3}
          maxLength={MAX_MESSAGE_LENGTH}
          value={values.message}
          onChange={handleChange('message')}
          onBlur={handleBlur('message')}
          aria-invalid={errors.message && touched.message ? 'true' : 'false'}
          aria-describedby={
            errors.message && touched.message
              ? 'contact-message-error contact-message-counter'
              : 'contact-message-counter'
          }
        />
        <div className="field__foot">
          {errors.message && touched.message ? (
            <span
              id="contact-message-error"
              className="field__error"
              role="alert"
            >
              {errors.message}
            </span>
          ) : (
            <span className="field__hint">
              Plain text only — no links or HTML.
            </span>
          )}
          <span
            id="contact-message-counter"
            className={`field__counter field__counter--${counterTone}`}
            aria-live="polite"
          >
            {messageLength} / {MAX_MESSAGE_LENGTH}
          </span>
        </div>
      </label>

      {/* Honeypot — invisible to humans, attractive to bots. */}
      <input
        type="text"
        name="_honey"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      <motion.button
        type="submit"
        className={`btn ${isDark ? 'btn--light' : 'btn--dark'} btn--block`}
        disabled={status === 'sending'}
        aria-live="polite"
        {...(status === 'sending' ? {} : btnMotion)}
      >
        {buttonLabel}
      </motion.button>

      {toast && (
        <Toast
          kind={toast.kind}
          message={toast.message}
          onClose={dismissToast}
        />
      )}
    </form>
  );
}
