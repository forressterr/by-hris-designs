import * as Sentry from '@sentry/nextjs';
import { baseSentryOptions, scrub } from './lib/sentry';

// Server + edge runtime Sentry init (the client runs in instrumentation-client.ts).
export function register() {
  Sentry.init({
    ...baseSentryOptions,
    beforeSend: (event) => scrub(event),
    beforeSendTransaction: (event) => scrub(event),
  });
}

// Captures errors thrown in API routes and data-fetching (getStaticProps etc.).
export const onRequestError = Sentry.captureRequestError;
