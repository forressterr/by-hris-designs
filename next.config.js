/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // TEMP (remove in Task 7): bypass type-checking during build so we can
  // verify SSR/runtime parity before the full .jsx → .tsx typing pass.
  typescript: { ignoreBuildErrors: true },
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
};

export default nextConfig;
