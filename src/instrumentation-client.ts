import { initBotId } from 'botid/client/core';

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
