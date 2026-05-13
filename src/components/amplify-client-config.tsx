'use client';

import { configureAmplify } from '@/lib/auth/amplify-config';

// Clear stale Amplify OAuth state on non-callback pages so Amplify doesn't
// throw "redirect is coming from a different origin" on initialization.
// Skip on /auth/callback — the PKCE verifier must survive until the callback
// page exchanges the code.
if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/callback')) {
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  localStorage.removeItem(`${prefix}.inflightOAuth`);
  localStorage.removeItem(`${prefix}.oauthState`);
  localStorage.removeItem(`${prefix}.oauthPKCE`);
}

configureAmplify();

export function AmplifyClientConfig() {
  return null;
}
