'use client';

import { VISIBILITY_STATUS } from '@/constants/statuses';
import { ReorderButtons } from '@/features/admin/components/reorder-buttons';
import { SavedNotice } from '@/features/admin/components/form-controls';
import {
  AdminActionButton,
  AdminActionLink,
  AdminTableActions,
} from '@/features/admin/components/admin-table-actions';
import type { HeroSlideFormValues } from '../actions';
import { deleteHeroSlide, moveHeroSlide } from '../actions';
import { buildAdminHeroSlidesHref } from '../lib/admin-hero-list';
import { HeroSlideFormDialog } from './hero-slide-form-dialog';

export type AdminHeroSlideRow = {
  id: string;
  imageUrl: string;
  alt: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  status: 'VISIBLE' | 'HIDDEN';
  sortOrder: number;
};

export function HeroSlideManagement({
  slides,
  saved,
  dialog,
}: {
  slides: AdminHeroSlideRow[];
  saved: boolean;
  dialog: { values: HeroSlideFormValues; closeHref: string } | null;
}) {
  const returnTo = buildAdminHeroSlidesHref();

  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-[var(--line)]">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-heading text-sm tracking-[0.08em]">HERO SLIDES ({slides.length})</h2>
          <p className="mt-1 text-xs text-[var(--font-color)]">
            Hidden slides stay in the list but do not rotate on the home page.
          </p>
        </div>

        {slides.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-[var(--product-image-background)] text-xs uppercase tracking-wide text-[var(--font-color)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Slide</th>
                  <th className="px-4 py-3 font-medium">Link</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slides.map((slide, index) => (
                  <tr key={slide.id} className="border-t border-[var(--line)] align-top">
                    <td className="whitespace-nowrap px-4 py-3">
                      <ReorderButtons
                        label={slide.title}
                        position={index + 1}
                        disabledUp={index === 0}
                        disabledDown={index === slides.length - 1}
                        upAction={moveHeroSlide.bind(null, slide.id, 'up')}
                        downAction={moveHeroSlide.bind(null, slide.id, 'down')}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="relative aspect-[16/9] w-28 shrink-0 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--product-image-background)]">
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an arbitrary image URL */}
                          <img
                            src={slide.imageUrl}
                            alt={slide.alt}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{slide.title}</p>
                          <p className="mt-1 text-xs text-[var(--font-color)]">{slide.subtitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="break-all text-xs text-[var(--font-color)]">
                        {slide.linkUrl}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-1 text-xs"
                        style={{
                          backgroundColor: VISIBILITY_STATUS[slide.status].bg,
                          color: VISIBILITY_STATUS[slide.status].color,
                        }}
                      >
                        {VISIBILITY_STATUS[slide.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AdminTableActions>
                        <AdminActionLink
                          href={buildAdminHeroSlidesHref({ edit: slide.id })}
                          aria-haspopup="dialog"
                        >
                          Edit
                        </AdminActionLink>
                        <form
                          action={deleteHeroSlide.bind(null, slide.id)}
                          onSubmit={(event) => {
                            if (!window.confirm(`Delete “${slide.title}”?`)) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <AdminActionButton type="submit" variant="danger">
                            Delete
                          </AdminActionButton>
                        </form>
                      </AdminTableActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-8 text-sm text-[var(--font-color)]">No hero slides yet.</p>
        )}
      </section>

      {saved ? <SavedNotice message="Hero slide saved." dismissHref={returnTo} /> : null}

      {dialog ? <HeroSlideFormDialog values={dialog.values} closeHref={dialog.closeHref} /> : null}
    </div>
  );
}
