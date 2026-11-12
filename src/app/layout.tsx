import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getSiteUrl } from '@/features/shared/lib/site-url';
import './globals.css';

const siteName = 'ANT JEWELRY';
const siteDescription =
  'ANT JEWELRY - nhẫn cưới, nhẫn đính hôn, dây chuyền và trang sức tinh tế cho mọi khoảnh khắc.';
const defaultSocialImage = {
  url: '/mock/hero/hero-slide-1.webp',
  alt: 'Bộ sưu tập trang sức ANT JEWELRY',
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: siteName,
    template: '%s | ANT JEWELRY',
  },
  description: siteDescription,
  openGraph: {
    type: 'website',
    siteName,
    title: siteName,
    description: siteDescription,
    images: [defaultSocialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [defaultSocialImage],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
