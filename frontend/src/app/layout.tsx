import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TraX – Truck Transport Platform',
  description: 'Connect clients with professional truck drivers. Fast, reliable, transparent.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
