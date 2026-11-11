import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ContactDialogProvider } from '@/features/layout/components/contact-popover';
import { SiteFooter } from '@/features/layout/components/footer';
import { SiteHeader } from '@/features/layout/components/header';
import { getCategories, getSettings } from '@/features/shared/queries';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'ANT JEWELRY',
    template: '%s | ANT JEWELRY',
  },
  description:
    'AN JEWELRY - nhẫn cưới, nhẫn đính hôn, dây chuyền và trang sức tinh tế cho mọi khoảnh khắc.',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ContactDialogProvider settings={settings}>
          <SiteHeader categories={categories} />
          <div className="flex-1">{children}</div>
          <SiteFooter categories={categories} settings={settings} />
        </ContactDialogProvider>
      </body>
    </html>
  );
}
