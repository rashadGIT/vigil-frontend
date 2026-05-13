'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth.store';
import { login } from '@/lib/api/auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

// Show in dev mode for UI preview; in production requires NEXT_PUBLIC_COGNITO_DOMAIN
const HAS_GOOGLE = DEV_BYPASS || !!process.env.NEXT_PUBLIC_COGNITO_DOMAIN;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEV_BYPASS ? 'director@sunrise.demo' : '',
      password: DEV_BYPASS ? 'Dev1234!' : '',
    },
  });

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);

    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '';
    const prefix = `CognitoIdentityServiceProvider.${clientId}`;

    // Clear stale Amplify OAuth state
    localStorage.removeItem(`${prefix}.inflightOAuth`);
    localStorage.removeItem(`${prefix}.oauthState`);
    localStorage.removeItem(`${prefix}.oauthPKCE`);

    try {
      // Generate PKCE code verifier + challenge
      const array = new Uint8Array(64);
      crypto.getRandomValues(array);
      const codeVerifier = btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const encoder = new TextEncoder();
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier));
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      // Generate state
      const stateArray = new Uint8Array(16);
      crypto.getRandomValues(stateArray);
      const state = btoa(String.fromCharCode(...stateArray))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      // Store PKCE verifier where the callback page expects it
      localStorage.setItem(`${prefix}.oauthPKCE`, codeVerifier);
      localStorage.setItem(`${prefix}.oauthState`, state);

      // Use current origin so we never get an origin-mismatch from Amplify
      const redirectUri = `${window.location.origin}/auth/callback`;

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        scope: 'email profile openid',
        redirect_uri: redirectUri,
        identity_provider: 'Google',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
      });

      window.location.href = `https://${cognitoDomain}/oauth2/authorize?${params}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Google sign-in error:', msg);
      setError(msg || 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  }

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    setError(null);
    try {
      const user = await login(values);
      setUser(user);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* D-12: Yellow DEV MODE banner */}
      {DEV_BYPASS && (
        <div className="w-full max-w-sm mb-4 rounded-md bg-yellow-100 border border-yellow-300 px-4 py-2 text-sm font-medium text-yellow-800">
          DEV MODE — Auth bypassed. Cognito is not contacted.
        </div>
      )}

      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold">Sign in to Kelova</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="director@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>

          {HAS_GOOGLE && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {googleLoading ? 'Redirecting...' : 'Continue with Google'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
