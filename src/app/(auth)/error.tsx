'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
      <h2 className="text-xl font-semibold">Authentication error</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        Something went wrong during sign in. Please try again.
      </p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  );
}
