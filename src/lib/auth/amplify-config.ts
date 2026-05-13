import { Amplify } from 'aws-amplify';

// Called once at app startup in root layout.tsx
// No-ops when NEXT_PUBLIC_DEV_AUTH_BYPASS=true (Cognito is never contacted)
export function configureAmplify() {
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '';

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? '',
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '',
        loginWith: {
          email: true,
          ...(cognitoDomain && {
            oauth: {
              domain: cognitoDomain,
              scopes: ['email', 'profile', 'openid'],
              redirectSignIn: [
                'http://localhost:3000/auth/callback',
                'https://app.vigilhq.com/auth/callback',
                'https://master.d2hwhswdtj7kj2.amplifyapp.com/auth/callback',
              ],
              redirectSignOut: [
                'http://localhost:3000/login',
                'https://app.vigilhq.com/login',
                'https://master.d2hwhswdtj7kj2.amplifyapp.com/login',
              ],
              responseType: 'code',
            },
          }),
        },
      },
    },
  });
}
