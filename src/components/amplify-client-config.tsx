'use client';

import { configureAmplify } from '@/lib/auth/amplify-config';

// Runs configureAmplify() on the client. Must be rendered early in the tree
// (root layout) so Amplify is ready before any auth calls.
configureAmplify();

export function AmplifyClientConfig() {
  return null;
}
