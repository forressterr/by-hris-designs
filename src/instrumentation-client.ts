import { initBotId } from 'botid/client/core';
import * as Sentry from '@sentry/nextjs';
import { baseSentryOptions, scrub } from './lib/sentry';

Sentry.init({
  ...baseSentryOptions,
  beforeSend: (event) => scrub(event),
  beforeSendTransaction: (event) => scrub(event),
});

// Sentry instruments Pages-Router client-side navigations via this export.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Register the paths BotID protects. Basic mode (deep-analysis is a paid
// tier). Covers the contact page and the footer form on every page, since
// both POST to /api/contact.
initBotId({
  protect: [
    {
      path: '/api/contact',
      method: 'POST',
      advancedOptions: { checkLevel: 'basic' },
    },
  ],
});
