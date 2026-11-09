'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Category } from '@/types/domain';
import { ChevronDownIcon } from './icons';

interface SiteHeaderProps {
  categories: Category[];
}

function navLinkClass(active: boolean) {
  return `border-b pb-1 transition-colors ${
    active ? 'border-foreground text-foreground' : 'border-transparent hover:border-line'
  }`;
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isBlog = pathname === '/blog' || pathname.startsWith('/blog/');
  const isContact = pathname === '/contact';

  return (
    <header className="border-b border-line bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link href="/" aria-label="AN JEWELRY - Home" className="inline-flex w-fit items-center">
          <Image
            src="/mock/products/antjewelry-logo.svg"
            alt="AN JEWELRY"
            width={96}
            height={66}
            priority
          />
        </Link>

        <nav aria-label="Main navigation">
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
            <li>
              <ProductsMenu categories={categories} active={pathname.startsWith('/c/')} />
            </li>
            <li>
              <Link
                href="/blog"
                className={navLinkClass(isBlog)}
                aria-current={isBlog ? 'page' : undefined}
              >
                BLOG
              </Link>
            </li>
            <li>
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
      </div>
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
    if (!open) {
      return;
    }

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

    // Tabbing from the toggle closes the disclosure before focus moves on.
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
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a') ?? []);
    if (items.length === 0) {
      return;
    }

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
      className="relative"
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
        className={`${navLinkClass(active)} inline-flex items-center gap-1`}
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
          className="absolute left-0 top-full z-20 mt-3 min-w-56 border border-line bg-background py-2 shadow-sm"
        >
          {categories.map((category) => {
            const isCurrent = pathname === `/c/${category.slug}`;

            return (
              <li key={category.category_id}>
                <Link
                  href={`/c/${category.slug}`}
                  onClick={() => setOpen(false)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`block px-4 py-2 text-sm transition-colors hover:bg-product-image ${
                    isCurrent ? 'underline underline-offset-4' : ''
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
