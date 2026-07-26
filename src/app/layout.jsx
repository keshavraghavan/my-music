import './globals.css';

export const metadata = {
  title: 'MyMusic.',
  description:
    "MyMusic — your page, your charts, your friends' picks. A retro music-social platform.",
  icons: { icon: '/favicon.svg' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Fonts stay on the Google Fonts stylesheet rather than next/font: the design's
// inline styles name the families literally ('Tinos', 'JetBrains Mono',
// 'Arimo'), and next/font would rename them to generated identifiers.
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;700&family=Arimo:ital,wght@0,400;0,600;0,700;1,400&display=swap';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={FONTS_HREF} rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
