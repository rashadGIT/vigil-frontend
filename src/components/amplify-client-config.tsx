'use client';

import { configureAmplify } from '@/lib/auth/amplify-config';

// Skip Amplify setup entirely on /auth/callback. The callback page does a
// fully manual PKCE exchange and uses no Amplify APIs. Calling configure()
// here causes Amplify v6 to auto-detect ?code= in the URL and attempt its
// own OAuth handling, which throws "redirect is coming from a different
// origin" when it validates state. Clear stale state on all other pages
// before configuring so prior sessions never pollute a fresh flow.
if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/callback')) {
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  localStorage.removeItem(`${prefix}.inflightOAuth`);
  localStorage.removeItem(`${prefix}.oauthState`);
  localStorage.removeItem(`${prefix}.oauthPKCE`);
  configureAmplify();
}

export function AmplifyClientConfig() {
  return null;
}
