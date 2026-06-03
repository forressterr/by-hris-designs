import { useCallback, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Toast from './Toast.jsx';

/**
 * FormSubmit.co AJAX endpoint — no signup required.
 *
 * First submission triggers a one-time confirmation email to
 * h.goretsov@gmail.com — click the link inside once and from then on every
 * form submission lands in the inbox automatically.
 *
 * If you'd rather not have the email address visible in the front-end
 * bundle, after the first confirmation FormSubmit assigns you a random
 * hashed alias (e.g. https://formsubmit.co/ajax/abc123def…). Swap the
 * endpoint below for that alias to keep the address out of public source.
 */
const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/h.goretsov@gmail.com';

// ----------------------------------------------------------------------------
// VALIDATION RULES
// ----------------------------------------------------------------------------
// Per the brief:
//   - Name: 2 names required, up to 3 allowed (e.g. "John Doe" or "Mary Anne Smith")
//   - Email: real format like example@example.com
//   - Message: text only — no URLs, HTML, markdown links — capped at 1500 chars
// These are CLIENT-SIDE checks for UX + spam reduction. They are NOT a
// substitute for server-side validation — anyone with devtools can bypass
// them. Pair with FormSubmit's spam filtering and the hidden honeypot.
// ----------------------------------------------------------------------------

const MAX_MESSAGE_LENGTH = 1500;

// Allow letters from any script (\p{L}) plus apostrophes and hyphens so
// names like "O'Brien" and "Mary-Jane" pass.
const NAME_PART_PATTERN = /^[\p{L}][\p{L}'-]*$/u;

// Pragmatic email check: at least one char before @, a domain with a dot,
// and a 2+ char TLD. Doesn't try to match the full RFC 5321 grammar (no
// browser-side regex realistically does) — type="email" + this catches
// every normal typo.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// URL / domain detection — keep loose. Any obvious link should bounce.
const URL_SCHEME_PATTERN = /\b(?:https?:\/\/|ftp:\/\/|www\.)/i;
const DOMAIN_LIKE_PATTERN =
  /\b[\w-]+\.(?:com|org|net|io|dev|app|co|uk|de|nl|fr|info|biz|edu|gov|me|tech|xyz|ly|us|to|ai|cc|gg|tv)(?:\b|\/)/i;
const HTML_TAG_PATTERN = /<[^>\s][^>]*>/;
const MARKDOWN_LINK_PATTERN = /\[[^\]]*]\([^)]+\)/;

function validateName(raw) {
  const value = raw.trim();
  if (!value) return 'Please enter your name.';
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return 'Please enter at least 2 names (e.g. John Doe).';
  }
  if (parts.length > 3) {
    return 'Up to 3 names, please.';
  }
  for (const part of parts) {
    if (!NAME_PART_PATTERN.test(part)) {
      return 'Names should contain letters only (apostrophes and hyphens are fine).';
    }
  }
  return null;
}

function validateEmail(raw) {
  const value = raw.trim();
  if (!value) return 'Please enter your email.';
  if (!EMAIL_PATTERN.test(value)) {
    return 'Please enter a valid email (e.g. example@example.com).';
  }
  return null;
}

function validateMessage(raw) {
  const value = raw.trim();
  if (!value) return 'Please write a message.';
  if (value.length > MAX_MESSAGE_LENGTH) {
    return `Keep it under ${MAX_MESSAGE_LENGTH} characters (currently ${value.length}).`;
  }
  if (URL_SCHEME_PATTERN.test(value) || DOMAIN_LIKE_PATTERN.test(value)) {
    return 'Please don’t include links or domains.';
  }
  if (HTML_TAG_PATTERN.test(value)) {
    return 'HTML tags aren’t allowed.';
  }
  if (MARKDOWN_LINK_PATTERN.test(value)) {
    return 'Please don’t include markdown links.';
  }
  return null;
}

function runAllValidations(values) {
  return {
    name: validateName(values.name || ''),
    email: validateEmail(values.email || ''),
    message: validateMessage(values.message || ''),
  };
}

// ----------------------------------------------------------------------------

export default function ContactForm({ variant = 'light' }) {
  // 'idle' | 'sending' | 'sent' | 'error'
  const [status, setStatus] = useState('idle');
  const isDark = variant === 'dark';
  const prefersReducedMotion = useReducedMotion();
  const btnMotion = prefersReducedMotion
    ? {}
    : {
        whileHover: { y: -1, transition: { type: 'spring', stiffness: 380, damping: 24 } },
        whileTap: { scale: 0.97, transition: { duration: 0.12 } },
      };

  // Controlled values so we can validate live + show a character counter.
  const [values, setValues] = useState({ name: '', email: '', message: '' });

  // Per-field error strings (null = valid / not yet validated).
  const [errors, setErrors] = useState({ name: null, email: null, message: null });

  // Per-field "touched" — only show an error once the user has either
  // tabbed away from the field or tried to submit. Saves them from being
  // yelled at while they're still mid-typing.
  const [touched, setTouched] = useState({ name: false, email: false, message: false });

  // Floating toast — set on submit (success, validation fail, or API
  // failure). Cleared by the Toast component's onClose (auto-dismiss
  // timer or × button).
  const [toast, setToast] = useState(null); // { kind, message } | null
  const showToast = useCallback((kind, message) => {
    // Setting a fresh object (even if kind/message match) re-mounts the
    // Toast's auto-dismiss timer via the message dep — handy if the
    // visitor submits twice quickly with the same error.
    setToast({ kind, message });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const messageLength = values.message.length;
  const charsLeft = MAX_MESSAGE_LENGTH - messageLength;
  const counterTone = useMemo(() => {
    if (charsLeft < 0) return 'over';
    if (charsLeft <= 100) return 'low';
    return 'ok';
  }, [charsLeft]);

  const handleChange = (field) => (event) => {
    const newValue = event.target.value;
    setValues((prev) => ({ ...prev, [field]: newValue }));
    // Live re-validate only if the field is already touched — that way
    // an error message disappears the moment the user fixes it, but
    // we don't surface an error the first time they type.
    if (touched[field]) {
      const validator =
        field === 'name'
          ? validateName
          : field === 'email'
            ? validateEmail
            : validateMessage;
      setErrors((prev) => ({ ...prev, [field]: validator(newValue) }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validator =
      field === 'name'
        ? validateName
        : field === 'email'
          ? validateEmail
          : validateMessage;
    setErrors((prev) => ({ ...prev, [field]: validator(values[field]) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'sending') return;

    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot trip: bots tend to fill every field. Humans can't see the
    // _honey input, so any value here means a bot submitted. Pretend it
    // succeeded so the bot moves on without retrying.
    if ((data.get('_honey') || '').toString().length > 0) {
      setStatus('sent');
      window.setTimeout(() => setStatus('idle'), 4000);
      return;
    }

    // Run every validator on submit and mark every field touched so the
    // errors show even for fields the user never focused.
    const nextErrors = runAllValidations(values);
    setErrors(nextErrors);
    setTouched({ name: true, email: true, message: true });
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      // Focus the first invalid field — better keyboard UX than just
      // staring at red text and wondering where to look.
      const firstInvalid = ['name', 'email', 'message'].find(
        (f) => nextErrors[f],
      );
      if (firstInvalid) {
        const el = form.querySelector(`[name="${firstInvalid}"]`);
        if (el && typeof el.focus === 'function') el.focus();
      }
      showToast(
        'error',
        'A few things to fix first — check the highlighted fields below.',
      );
      return;
    }

    const name = values.name.trim();
    const email = values.email.trim();
    const message = values.message.trim();

    setStatus('sending');

    const payload = {
      name,
      email,
      message,
      _subject: `Contact Form Enquiry — ${name || 'New message'}`,
      _replyto: email,
      _template: 'table',
      _captcha: 'false',
    };

    try {
      const res = await fetch(FORMSUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      const ok = res.ok && (json.success === 'true' || json.success === true);

      if (ok) {
        setStatus('sent');
        setValues({ name: '', email: '', message: '' });
        setTouched({ name: false, email: false, message: false });
        setErrors({ name: null, email: null, message: null });
        window.setTimeout(() => setStatus('idle'), 4000);
        showToast(
          'success',
          'Message on the way — I’ll get back to you within 1–2 working days.',
        );
      } else {
        setStatus('error');
        window.setTimeout(() => setStatus('idle'), 5000);
        showToast(
          'error',
          'That didn’t go through. Give it another try in a moment.',
        );
      }
    } catch (_err) {
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 5000);
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
  const fieldClass = (field) => {
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
      <h3>Let’s<br />Connect</h3>
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
          aria-describedby={errors.name && touched.name ? 'contact-name-error' : undefined}
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
          aria-describedby={errors.email && touched.email ? 'contact-email-error' : undefined}
        />
        {errors.email && touched.email && (
          <span id="contact-email-error" className="field__error" role="alert">
            {errors.email}
          </span>
        )}
      </label>

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
            <span id="contact-message-error" className="field__error" role="alert">
              {errors.message}
            </span>
          ) : (
            <span className="field__hint">Plain text only — no links or HTML.</span>
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
