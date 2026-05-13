import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  transpilePackages: ['@vigil/shared-types'],
  experimental: {
    typedRoutes: false,
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry org/project — populated from CI env vars during deploy
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only in CI; skip locally to keep dev fast
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  // Don't block build if Sentry DSN is missing (e.g. local dev without .env)
  telemetry: false,
});
