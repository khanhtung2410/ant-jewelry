'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Category } from '@/types/domain';
import { ChevronDownIcon, CloseIcon, MenuIcon } from './icons';

interface SiteHeaderProps {
  categories: Category[];
}

function navLinkClass(active: boolean) {
  return [
    'inline-flex items-center leading-none',
    'border-b-2 pb-1 transition-colors',
    active
      ? 'border-[var(--underline-color)] text-foreground'
      : 'border-transparent hover:border-line',
  ].join(' ');
}

function mobileNavLinkClass(active: boolean) {
  return [
    'flex w-full items-center border-b-2 py-3 text-left transition-colors',
    active
      ? 'border-[var(--underline-color)] text-foreground'
      : 'border-transparent hover:border-[var(--underline-color)]',
  ].join(' ');
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isBlog = pathname === '/blog' || pathname.startsWith('/blog/');
  const isContact = pathname === '/contact';

  const mobileMenuId = useId();
  // Store the route the menu was opened on so a navigation closes it without an
  // effect, and browser back/forward cannot leave a stale panel open.
  const [openOnPathname, setOpenOnPathname] = useState<string | null>(null);
  const menuOpen = openOnPathname === pathname;
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function closeMobileMenu() {
    setOpenOnPathname(null);
  }

  function toggleMobileMenu() {
    setOpenOnPathname((current) => (current === pathname ? null : pathname));
  }

  function handleHeaderKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && menuOpen) {
      event.stopPropagation();
      closeMobileMenu();
      menuButtonRef.current?.focus();
    }
  }

  return (
    <header className="border-b border-line bg-background" onKeyDown={handleHeaderKeyDown}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4 md:block">
          <Link href="/" aria-label="AN JEWELRY - Home" className="inline-flex w-fit items-center">
            <Image
              src="/mock/products/antjewelry-logo.svg"
              alt="AN JEWELRY"
              width={96}
              height={66}
              priority
            />
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? mobileMenuId : undefined}
            aria-label={menuOpen ? 'Close main navigation' : 'Open main navigation'}
            onClick={toggleMobileMenu}
            className="inline-flex items-center gap-2 border border-line px-3 py-2 font-heading text-xs uppercase tracking-[0.12em] transition-colors hover:bg-product-image focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line md:hidden"
          >
            {menuOpen ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
            {menuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>

        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 font-heading text-sm uppercase tracking-[0.12em]">
            <li>
              <Link
                href="/"
                className={navLinkClass(isHome)}
                aria-current={isHome ? 'page' : undefined}
              >
                HOME
              </Link>
            </li>
            <li className="flex items-center">
              <ProductsMenu categories={categories} active={pathname.startsWith('/c/')} />
            </li>
            <li className="flex items-center">
              <Link
                href="/blog"
                className={navLinkClass(isBlog)}
                aria-current={isBlog ? 'page' : undefined}
              >
                BLOG
              </Link>
            </li>
            <li className="flex items-center">
              <Link
                href="/#contact"
                className={navLinkClass(isContact)}
                aria-current={isContact ? 'page' : undefined}
              >
                CONTACT
              </Link>
            </li>
          </ul>
        </nav>

        {/* RIGHT — spacer keeps nav truly centered */}
        <div className="hidden md:col-span-3 md:block" aria-hidden="true" />
      </div>

      {menuOpen ? (
        <div id={mobileMenuId} className="border-t border-line md:hidden">
          <nav
            aria-label="Mobile navigation"
            className="mx-auto w-full max-w-7xl px-4 py-2 sm:px-6 lg:px-8"
          >
            <ul className="font-heading text-sm uppercase tracking-[0.12em]">
              <li>
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className={mobileNavLinkClass(isHome)}
                  aria-current={isHome ? 'page' : undefined}
                >
                  HOME
                </Link>
              </li>
              <li>
                <MobileProductsMenu
                  categories={categories}
                  active={pathname.startsWith('/c/')}
                  onNavigate={closeMobileMenu}
                />
              </li>
              <li>
                <Link
                  href="/blog"
                  onClick={closeMobileMenu}
                  className={mobileNavLinkClass(isBlog)}
                  aria-current={isBlog ? 'page' : undefined}
                >
                  BLOG
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  onClick={closeMobileMenu}
                  className={mobileNavLinkClass(isContact)}
                  aria-current={isContact ? 'page' : undefined}
                >
                  CONTACT
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

interface ProductsMenuProps {
  categories: Category[];
  active: boolean;
}

function ProductsMenu({ categories, active }: ProductsMenuProps) {
  const pathname = usePathname();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const focusFirstOnOpen = useRef(false);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open && focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    }
  }, [open]);

  function closeAndFocusButton() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeAndFocusButton();
      return;
    }
    if (event.key === 'Tab' && event.target === buttonRef.current) {
      setOpen(false);
    }
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusFirstOnOpen.current = true;
      setOpen(true);
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a') ?? []);
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const nextIndex =
      event.key === 'ArrowDown'
        ? (currentIndex + 1) % items.length
        : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full items-center"
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleButtonKeyDown}
        className={`${navLinkClass(active)} inline-flex items-center gap-1 `}
      >
        PRODUCTS
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <ul
          ref={menuRef}
          id={menuId}
          aria-label="Product categories"
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 top-full z-20 mt-14 min-w-56 border border-line bg-background py-2 shadow-sm"
        >
          {categories.map((category) => {
            const isCurrent = pathname === `/c/${category.slug}`;

            return (
              <li key={category.category_id}>
                <Link
                  href={`/c/${category.slug}`}
                  onClick={() => setOpen(false)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`block border-b-2 px-4 py-2 text-sm transition-colors hover:bg-product-image ${
                    isCurrent
                      ? 'border-[var(--underline-color)] text-foreground'
                      : 'border-transparent hover:border-[var(--underline-color)]'
                  }`}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

interface MobileProductsMenuProps {
  categories: Category[];
  active: boolean;
  onNavigate: () => void;
}

function MobileProductsMenu({ categories, active, onNavigate }: MobileProductsMenuProps) {
  const pathname = usePathname();
  const listId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={mobileNavLinkClass(active)}
      >
        PRODUCTS
        <ChevronDownIcon
          className={`ml-1 h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <ul id={listId} aria-label="Product categories" className="pb-2">
          {categories.map((category) => {
            const isCurrent = pathname === `/c/${category.slug}`;

            return (
              <li key={category.category_id}>
                <Link
                  href={`/c/${category.slug}`}
                  onClick={onNavigate}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`flex border-b-2 py-2 pl-4 font-body text-sm tracking-normal normal-case transition-colors ${
                    isCurrent
                      ? 'border-[var(--underline-color)] text-foreground'
                      : 'border-transparent hover:border-[var(--underline-color)]'
                  }`}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}