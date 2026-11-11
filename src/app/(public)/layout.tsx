import { ContactDialogProvider } from '@/features/layout/components/contact-popover';
import { SiteFooter } from '@/features/layout/components/footer';
import { SiteHeader } from '@/features/layout/components/header';
import { getCategories, getSettings } from '@/features/shared/queries';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  return (
    <div className="flex min-h-screen flex-col">
      <ContactDialogProvider settings={settings}>
        <SiteHeader categories={categories} />
        <div className="flex-1">{children}</div>
        <SiteFooter categories={categories} settings={settings} />
      </ContactDialogProvider>
    </div>
  );
}
