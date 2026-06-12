// Shared Sentry setup for both the client (instrumentation-client.ts) and the
// server/edge (instrumentation.ts) runtimes. Errors + performance, no session
// replay. Disabled (no-op) when the DSN is absent, so local dev and CI never
// emit. The `beforeSend`/`beforeSendTransaction` callbacks are added at each
// init call so `Sentry.init` contextually types their event params.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const baseSentryOptions = {
  dsn: DSN,
  enabled: Boolean(DSN),
  environment: process.env.VERCEL_ENV ?? 'development',
  tracesSampleRate: 1, // low traffic; dial down if quota tightens
  sendDefaultPii: false,
};

// Strip anything that could carry PII before an event leaves the process —
// defence-in-depth on top of sendDefaultPii:false. The one route handling
// personal data is /api/contact (name/email/message in the request body).
export function scrub<
  T extends { request?: { data?: unknown }; user?: unknown },
>(event: T): T {
  if (event.request) event.request.data = undefined;
  event.user = undefined;
  return event;
}
