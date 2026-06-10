// Typed access to the contact route's environment. Designed to degrade
// gracefully: missing Upstash config disables the store + rate-limiter, and a
// missing Resend key disables email — the route treats an enquiry as received
// if it was captured OR emailed, so the form never hard-fails on one missing
// dependency. Never logs secrets.

// Where contact-form enquiries are sent. `from` is the verified byhris.cc
// domain in Resend (DKIM/SPF/MX confirmed), so it can deliver to any recipient
// with good deliverability. The enquirer's address becomes the reply-to so
// replies go straight to them. Server-side constants — the inbox never ships
// in the client bundle.
export const CONTACT_NOTIFY_TO = 'h.goretsov@gmail.com';
export const CONTACT_NOTIFY_FROM = 'By_Hris Designs <notifications@byhris.cc>';

/** Resend API key, or undefined when email is not configured. */
export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY;
}

/** Upstash REST credentials, or null when not configured (store/ratelimit off). */
export function getUpstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}
