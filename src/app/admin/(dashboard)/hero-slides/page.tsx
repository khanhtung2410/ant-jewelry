import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { getAdminSession } from '@/features/auth/session';
import { canManageHeroSlides } from '@/features/shared/lib/permissions';

export const instant = false;

export default async function AdminHeroSlidesPage() {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageHeroSlides(session.role)) {
    return <AccessDenied message="You do not have permission to manage hero slides." />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Hero Slides"
        description="Manage homepage hero slides and visibility."
      />
      <div className="rounded-lg border border-dashed border-[var(--line)] p-6 text-sm text-[var(--font-color)]">
        Hero slide management UI is not implemented in this milestone yet. Access is protected by
        role permissions.
      </div>
    </div>
  );
}
