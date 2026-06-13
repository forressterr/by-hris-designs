import { withBotId } from 'botid/next/config';
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/projects/:slug',
        destination: '/works/:slug',
        permanent: true,
      },
      { source: '/projects', destination: '/works', permanent: true },
    ];
  },
};

export default withSentryConfig(withBotId(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  // Upload source maps only when the auth token is present (Vercel builds);
  // local + GitHub CI builds skip upload and stay green with no Sentry secrets.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  widenClientFileUpload: true,
  // Tree-shake Sentry's debug logging out of the client bundle (replaces the
  // deprecated `disableLogger`).
  webpack: { treeshake: { removeDebugLogging: true } },
});
