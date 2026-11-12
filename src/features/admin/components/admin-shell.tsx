'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { logoutAction } from '@/features/auth/actions';
import type { AdminSession } from '@/features/auth/session-token';
import { CloseIcon, MenuIcon } from '@/features/layout/components/icons';
import {
  canManageBlog,
  canManageCategories,
  canManageHeroSlides,
  canManageSettings,
  canManageUsers,
  canViewProducts,
} from '@/features/shared/lib/permissions';
import {
  BlogIcon,
  CategoriesIcon,
  DashboardIcon,
  HeroSlidesIcon,
  LogoutIcon,
  ProductsIcon,
  SettingsIcon,
  StorefrontIcon,
  UsersIcon,
} from './admin-icons';

type NavItem = {
  href: string;
  label: string;
  visible: boolean;
  icon: (props: { className?: string }) => ReactNode;
};

export function AdminShell({ session, children }: { session: AdminSession; children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarId = useId();

  const navItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', visible: true, icon: DashboardIcon },
    {
      href: '/admin/products',
      label: 'Products',
      visible: canViewProducts(session.role),
      icon: ProductsIcon,
    },
    {
      href: '/admin/categories',
      label: 'Categories',
      visible: canManageCategories(session.role),
      icon: CategoriesIcon,
    },
    { href: '/admin/blog', label: 'Blog', visible: canManageBlog(session.role), icon: BlogIcon },
    {
      href: '/admin/hero-slides',
      label: 'Hero Slides',
      visible: canManageHeroSlides(session.role),
      icon: HeroSlidesIcon,
    },
    {
      href: '/admin/settings',
      label: 'Settings',
      visible: canManageSettings(session.role),
      icon: SettingsIcon,
    },
    {
      href: '/admin/users',
      label: 'Users',
      visible: canManageUsers(session.role),
      icon: UsersIcon,
    },
  ];

  const visibleItems = navItems.filter((item) => item.visible);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen]);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-foreground">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}

      <aside
        id={sidebarId}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[var(--underline-color)] text-white transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-white/15 px-5">
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className="font-heading text-sm tracking-[0.18em] text-white"
          >
            ANT JEWELRY
          </Link>
          <span className="rounded-full border border-white/30 px-2 py-0.5 font-heading text-[10px] tracking-[0.14em] text-white/80">
            {session.role}
          </span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 font-heading text-[10px] tracking-[0.2em] text-white/45">MENU</p>
          <div className="space-y-1">
            {visibleItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm tracking-[0.04em] transition ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/15 p-4">
          <Link
            href="/"
            className="mb-4 flex items-center gap-2 rounded-md px-1 py-1 text-xs text-white/65 transition hover:text-white"
          >
            <StorefrontIcon className="h-4 w-4" />
            <span>View storefront</span>
          </Link>
          <p className="truncate text-sm font-medium text-white">{session.name ?? session.email}</p>
          <p className="truncate text-xs text-white/65">{session.email}</p>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-white/30 px-3 py-2 font-heading text-xs tracking-[0.08em] text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              <LogoutIcon className="h-3.5 w-3.5" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              aria-label="Open navigation"
              aria-controls={sidebarId}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="rounded-md border border-[var(--line)] p-2 text-[var(--font-color)] transition hover:border-[var(--underline-color)] hover:text-[var(--underline-color)] lg:hidden"
            >
              <MenuIcon className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-sm tracking-[0.16em] text-foreground">
                Admin
              </p>
            </div>

            <Link
              href="/"
              className="hidden rounded-md border border-[var(--line)] px-3 py-1.5 font-heading text-xs tracking-[0.06em] text-[var(--font-color)] transition hover:border-[var(--underline-color)] hover:text-[var(--underline-color)] sm:inline-flex lg:hidden"
            >
              View storefront
            </Link>

            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-foreground">{session.name ?? session.email}</p>
              <p className="text-xs text-[var(--font-color)]">{session.email}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
