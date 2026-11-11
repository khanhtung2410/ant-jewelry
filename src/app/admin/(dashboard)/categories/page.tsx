import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { getAdminSession } from '@/features/auth/session';
import { canManageCategories } from '@/lib/permissions';

export const instant = false;

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageCategories(session.role)) {
    return <AccessDenied message="You do not have permission to manage categories." />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Manage product categories and storefront grouping."
      />
      <div className="rounded-lg border border-dashed border-[var(--line)] p-6 text-sm text-[var(--font-color)]">
        Category management UI is not implemented in this milestone yet. Access is protected by role
        permissions.
      </div>
    </div>
  );
}
