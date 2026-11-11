import Link from 'next/link';
import type { ReactNode } from 'react';
import { logoutAction } from '@/features/auth/actions';
import type { AdminSession } from '@/features/auth/session-token';
import {
  canManageBlog,
  canManageCategories,
  canManageHeroSlides,
  canManageSettings,
  canManageUsers,
  canViewProducts,
} from '@/features/shared/lib/permissions';

type NavItem = {
  href: string;
  label: string;
  visible: boolean;
};

export function AdminShell({ session, children }: { session: AdminSession; children: ReactNode }) {
  const navItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', visible: true },
    { href: '/admin/products', label: 'Products', visible: canViewProducts(session.role) },
    { href: '/admin/categories', label: 'Categories', visible: canManageCategories(session.role) },
    { href: '/admin/blog', label: 'Blog', visible: canManageBlog(session.role) },
    {
      href: '/admin/hero-slides',
      label: 'Hero Slides',
      visible: canManageHeroSlides(session.role),
    },
    { href: '/admin/settings', label: 'Settings', visible: canManageSettings(session.role) },
    { href: '/admin/users', label: 'Users', visible: canManageUsers(session.role) },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-foreground">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-heading text-sm tracking-[0.18em] text-foreground">
              ANT JEWELRY ADMIN
            </Link>
            <span className="hidden rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--font-color)] sm:inline-flex">
              {session.role}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{session.name ?? session.email}</p>
              <p className="text-xs text-[var(--font-color)]">{session.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm font-heading tracking-[0.06em] text-[var(--font-color)] transition hover:border-[var(--underline-color)] hover:text-[var(--underline-color)]"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-xl border border-[var(--line)] bg-background p-3 lg:sticky lg:top-[73px] lg:h-fit">
          <nav aria-label="Admin navigation" className="space-y-1">
            {navItems
              .filter((item) => item.visible)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-[var(--font-color)] transition hover:bg-[var(--product-image-background)] hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        </aside>

        <main className="min-w-0 rounded-xl border border-[var(--line)] bg-background p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
