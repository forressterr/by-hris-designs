// Shared contact-form validation — the single source of truth used by both
// the client (live UX validation in ContactForm) and the server (the
// /api/contact security gate). Pure functions, no I/O.

export const MAX_MESSAGE_LENGTH = 1500;

export type FieldName =
  | 'name'
  | 'email'
  | 'message'
  | 'company'
  | 'subject'
  | 'budget'
  | 'timeline';

export interface EnquiryInput {
  name: string;
  email: string;
  message: string;
  company: string;
  subject: string;
  budget: string;
  timeline: string;
}

export type FormErrors = Record<FieldName, string | null>;

/** Required = the original three; the rest are optional (empty is valid). */
export const REQUIRED_FIELDS: FieldName[] = ['name', 'email', 'message'];
export const OPTIONAL_FIELDS: FieldName[] = [
  'company',
  'subject',
  'budget',
  'timeline',
];

// Allow letters from any script (\p{L}) plus apostrophes and hyphens so
// names like "O'Brien" and "Mary-Jane" pass.
const NAME_PART_PATTERN = /^[\p{L}][\p{L}'-]*$/u;

// Pragmatic email check: at least one char before @, a domain with a dot,
// and a 2+ char TLD. type="email" + this catches every normal typo.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// URL / domain detection — keep loose. Any obvious link should bounce.
const URL_SCHEME_PATTERN = /\b(?:https?:\/\/|ftp:\/\/|www\.)/i;
const DOMAIN_LIKE_PATTERN =
  /\b[\w-]+\.(?:com|org|net|io|dev|app|co|uk|de|nl|fr|info|biz|edu|gov|me|tech|xyz|ly|us|to|ai|cc|gg|tv)(?:\b|\/)/i;
const HTML_TAG_PATTERN = /<[^>\s][^>]*>/;
const MARKDOWN_LINK_PATTERN = /\[[^\]]*]\([^)]+\)/;

// Every field rejects links, HTML, and markdown — the universal "text/numbers
// only, no links/html" rule. Returns the specific message or null.
function forbiddenContentError(value: string): string | null {
  if (URL_SCHEME_PATTERN.test(value) || DOMAIN_LIKE_PATTERN.test(value)) {
    return 'Please don’t include links or domains.';
  }
  if (HTML_TAG_PATTERN.test(value)) return 'HTML tags aren’t allowed.';
  if (MARKDOWN_LINK_PATTERN.test(value))
    return 'Please don’t include markdown links.';
  return null;
}

export function validateName(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Please enter your name.';
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return 'Please enter at least 2 names (e.g. John Doe).';
  if (parts.length > 3) return 'Up to 3 names, please.';
  for (const part of parts) {
    if (!NAME_PART_PATTERN.test(part)) {
      return 'Names should contain letters only (apostrophes and hyphens are fine).';
    }
  }
  return null;
}

export function validateEmail(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Please enter your email.';
  if (!EMAIL_PATTERN.test(value)) {
    return 'Please enter a valid email (e.g. example@example.com).';
  }
  return null;
}

export function validateMessage(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Please write a message.';
  if (value.length > MAX_MESSAGE_LENGTH) {
    return `Keep it under ${MAX_MESSAGE_LENGTH} characters (currently ${value.length}).`;
  }
  return forbiddenContentError(value);
}

/**
 * Optional free-text field: empty is valid; otherwise it must be within
 * `maxLength` and contain no links, HTML, or markdown (text/numbers only).
 */
export function validateOptionalText(
  raw: string,
  maxLength: number,
): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.length > maxLength) {
    return `Keep it under ${maxLength} characters (currently ${value.length}).`;
  }
  return forbiddenContentError(value);
}

export const validateCompany = (raw: string): string | null =>
  validateOptionalText(raw, 100);
export const validateSubject = (raw: string): string | null =>
  validateOptionalText(raw, 150);
export const validateBudget = (raw: string): string | null =>
  validateOptionalText(raw, 60);
export const validateTimeline = (raw: string): string | null =>
  validateOptionalText(raw, 60);

export const VALIDATORS: Record<FieldName, (raw: string) => string | null> = {
  name: validateName,
  email: validateEmail,
  message: validateMessage,
  company: validateCompany,
  subject: validateSubject,
  budget: validateBudget,
  timeline: validateTimeline,
};

export function validateEnquiry(values: EnquiryInput): FormErrors {
  return {
    name: VALIDATORS.name(values.name),
    email: VALIDATORS.email(values.email),
    message: VALIDATORS.message(values.message),
    company: VALIDATORS.company(values.company),
    subject: VALIDATORS.subject(values.subject),
    budget: VALIDATORS.budget(values.budget),
    timeline: VALIDATORS.timeline(values.timeline),
  };
}
