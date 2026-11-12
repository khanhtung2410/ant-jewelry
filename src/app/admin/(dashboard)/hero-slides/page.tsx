import Link from 'next/link';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { firstSearchParam, type SearchParam } from '@/features/admin/lib/admin-search-params';
import { getAdminSession } from '@/features/auth/session';
import type { HeroSlideFormValues } from '@/features/layout/actions';
import { HeroSlideManagement } from '@/features/layout/components/hero-slide-management';
import { buildAdminHeroSlidesHref } from '@/features/layout/lib/admin-hero-list';
import { prisma } from '@/features/shared/db/prisma';
import { canManageHeroSlides } from '@/features/shared/lib/permissions';

export const instant = false;

type AdminHeroSlidesPageProps = {
  searchParams: Promise<Partial<Record<'edit' | 'new' | 'saved', SearchParam>>>;
};

export default async function AdminHeroSlidesPage({ searchParams }: AdminHeroSlidesPageProps) {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageHeroSlides(session.role)) {
    return <AccessDenied message="You do not have permission to manage hero slides." />;
  }

  const params = await searchParams;
  const editId = firstSearchParam(params.edit);
  const createRequested = firstSearchParam(params.new) === '1';
  const slides = await prisma.heroSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  const selectedSlide = editId ? slides.find((slide) => slide.id === editId) : null;

  const values: HeroSlideFormValues | null = selectedSlide
    ? {
        heroSlideId: selectedSlide.id,
        imageUrl: selectedSlide.imageUrl,
        alt: selectedSlide.alt,
        title: selectedSlide.title,
        subtitle: selectedSlide.subtitle,
        linkUrl: selectedSlide.linkUrl,
        visible: selectedSlide.status === 'VISIBLE',
      }
    : createRequested
      ? {
          imageUrl: '',
          alt: '',
          title: '',
          subtitle: '',
          linkUrl: '',
          visible: true,
        }
      : null;

  const closeHref = buildAdminHeroSlidesHref();

  return (
    <div>
      <AdminPageHeader
        title="Hero Slides"
        description="Manage the images, links, and display order of the home page carousel."
        actions={
          <Link
            href={buildAdminHeroSlidesHref({ create: true })}
            aria-haspopup="dialog"
            className="rounded-md bg-foreground px-3 py-2 text-sm text-background"
          >
            New slide
          </Link>
        }
      />
      <HeroSlideManagement
        slides={slides.map((slide) => ({
          id: slide.id,
          imageUrl: slide.imageUrl,
          alt: slide.alt,
          title: slide.title,
          subtitle: slide.subtitle,
          linkUrl: slide.linkUrl,
          status: slide.status,
          sortOrder: slide.sortOrder,
        }))}
        saved={firstSearchParam(params.saved) === '1'}
        dialog={values ? { values, closeHref } : null}
      />
    </div>
  );
}
