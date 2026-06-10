// Typed access to the contact route's environment. Designed to degrade
// gracefully: a missing Upstash config disables the store + rate-limiter (the
// message still gets delivered), and the FormSubmit endpoint has a safe default
// so the form never goes down because an env var wasn't set. Never logs secrets.

// Public FormSubmit AJAX endpoint (the inbox is a public contact address; this
// is a server-side constant, NOT shipped to the client bundle). Override via
// CONTACT_FORMSUBMIT_ENDPOINT to point at a hashed FormSubmit alias.
const DEFAULT_FORMSUBMIT_ENDPOINT =
  'https://formsubmit.co/ajax/h.goretsov@gmail.com';

/** The FormSubmit endpoint to forward enquiries to (env override or default). */
export function getFormsubmitEndpoint(): string {
  return process.env.CONTACT_FORMSUBMIT_ENDPOINT || DEFAULT_FORMSUBMIT_ENDPOINT;
}

/** Upstash REST credentials, or null when not configured (store/ratelimit off). */
export function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}
