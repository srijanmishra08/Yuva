import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'YUVA Diplomacy Summit 2026 | Conference Portal',
  description: 'Official delegate portal for YUVA Diplomacy Summit 2026 — Registration, dashboard, and delegate management.',
  keywords: 'YUVA, diplomacy, MUN, summit, conference, delegate, portal',
  openGraph: {
    title: 'YUVA Diplomacy Summit 2026',
    description: 'Official delegate portal for YUVA Diplomacy Summit 2026',
    url: 'https://portal.funology.in',
    siteName: 'YUVA Conference Portal',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1F2937',
              color: '#FFF6ED',
              border: '1px solid rgba(255, 170, 51, 0.3)',
              borderRadius: '12px',
              fontFamily: 'Montserrat, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#FFAA33', secondary: '#111827' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#111827' },
            },
          }}
        />
      </body>
    </html>
  );
}
