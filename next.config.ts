import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Next 16 defaults to `{ pathname: '**', search: '' }`, which makes the
    // optimizer answer 400 for any local image URL carrying a query string
    // (e.g. the `?v=2` CDN-bust suffix added by the E1 migration). Dropping
    // the `search` restriction keeps all local paths allowed with any query.
    localPatterns: [{ pathname: '**' }],
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
