import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import { AuthHydration } from '@/providers/auth-hydration';
import { PwaRegister } from '@/components/pwa-register';
import { AmplifyClientConfig } from '@/components/amplify-client-config';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', weight: ['300', '400', '600'] });

export const metadata: Metadata = {
  title: 'Kelova — Funeral Home Operations',
  description: 'Multi-tenant funeral operations platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} ${serif.variable}`}>
        <AmplifyClientConfig />
        <AuthHydration />
        <QueryProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
          <PwaRegister />
        </QueryProvider>
      </body>
    </html>
  );
}
