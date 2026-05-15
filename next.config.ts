import type { NextConfig } from 'next';
import path from 'path';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  transpilePackages: ['@vigil/shared-types'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: false,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry org/project — populated from CI env vars during deploy
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only in CI; skip locally to keep dev fast
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
  disableLogger: true,
  // Don't block build if Sentry DSN is missing (e.g. local dev without .env)
  telemetry: false,
});
