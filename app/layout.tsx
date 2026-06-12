import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AliFlex — Live TV',
  description: 'Your personal IPTV streaming hub. Watch thousands of live TV channels for free.',
  keywords: ['IPTV', 'live TV', 'streaming', 'free channels'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0b0b0f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-background text-text antialiased">{children}</body>
    </html>
  );
}
