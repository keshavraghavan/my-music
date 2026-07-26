import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { loadAppSnapshot } from '@/core/db/read-model';
import { AppStateProvider } from '@/state/client-store';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyMusic.',
  description:
    "MyMusic — your page, your charts, your friends' picks. A retro music-social platform.",
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// The initial snapshot is a live repository read when DATABASE_URL is set.
// Prevent Next from freezing it into the build output.
export const dynamic = 'force-dynamic';

// Fonts stay on the Google Fonts stylesheet rather than next/font: the design's
// inline styles name the families literally ('Tinos', 'JetBrains Mono',
// 'Arimo'), and next/font would rename them to generated identifiers.
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;700&family=Arimo:ital,wght@0,400;0,600;0,700;1,400&display=swap';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialState = await loadAppSnapshot();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={FONTS_HREF} rel="stylesheet" />
      </head>
      <body>
        {/*
          Server reads hydrate persisted values. The provider keeps transient
          Phase 3 UI state and stubbed mutations across client navigation.
        */}
        <AppStateProvider initialState={initialState}>{children}</AppStateProvider>
      </body>
    </html>
  );
}
