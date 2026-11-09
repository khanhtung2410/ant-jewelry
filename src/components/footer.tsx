import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Category, Settings } from '@/types/domain';
import { MailIcon, MapPinIcon, PhoneIcon } from './icons';

interface SiteFooterProps {
  categories: Category[];
  settings: Settings;
}

export function SiteFooter({ settings }: SiteFooterProps) {
  return (
    <footer id="contact" className="border-t border-line bg-background">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-y-8 px-4 py-8 text-muted sm:grid-cols-2 sm:px-6 md:grid-cols-12 md:gap-x-6 lg:px-8">
        <div className="sm:col-span-2 md:col-span-4">
          <address className="space-y-3 text-sm not-italic">
            <p className="flex gap-2">
              <MapPinIcon className="mt-0.5 h-6 w-6 shrink-0" />
              <span>{settings.address}</span>
            </p>
            <a
              href={`tel:${settings.phone.replace(/\s+/g, '')}`}
              className="flex gap-2 transition-colors hover:text-foreground"
            >
              <PhoneIcon className="mt-0.5 h-7 w-7 shrink-0" />
              <span>{settings.phone}</span>
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="flex gap-2 transition-colors hover:text-foreground"
            >
              <MailIcon className="mt-0.5 h-6 w-6 shrink-0" />
              <span>{settings.email}</span>
            </a>
          </address>
        </div>

        <div className="md:col-span-2">
          <FooterColumn title="HOME" titleHref="/">
            <FooterLink href="/c">PRODUCTS</FooterLink>
            <FooterLink href="/blog">BLOG</FooterLink>
            <FooterLink href="/#contact">CONTACT</FooterLink>
          </FooterColumn>
        </div>

        <div className="md:col-span-2">
          <FooterColumn title="INFO">
            <FooterLink href="/terms">Terms and Conditions</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
          </FooterColumn>
        </div>

        <div className="md:col-span-2">
          <FooterColumn title="HELP">
            <FooterLink href="/ship">Shipping and Return</FooterLink>
            <FooterLink href="/blog/bao-quan-trang-suc-dung-cach">Jewelry Care</FooterLink>
          </FooterColumn>
        </div>

        <div className="md:col-span-2">
          <FooterColumn title="SOCIAL">
            <li>
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
              >
                Instagram
              </a>
            </li>
          </FooterColumn>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  titleHref,
  children,
}: {
  title: string;
  titleHref?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="font-heading text-sm tracking-[0.12em] font-bold">
        {titleHref ? (
          <Link href={titleHref} className="transition-colors hover:text-foreground/70">
            {title}
          </Link>
        ) : (
          title
        )}
      </h2>
      <ul className="mt-4 space-y-3 text-sm text-muted">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}
