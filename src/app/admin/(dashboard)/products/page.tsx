import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { getAdminSession } from '@/features/auth/session';
import { canManageProducts } from '@/lib/permissions';

export const instant = false;

export default async function AdminProductsPage() {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageProducts(session.role)) {
    return <AccessDenied message="You do not have permission to manage products." />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Manage storefront products. Price editing is restricted to ADMIN accounts."
      />
      <div className="rounded-lg border border-dashed border-[var(--line)] p-6 text-sm text-[var(--font-color)]">
        Product management UI is not implemented in this milestone yet. Authentication, session
        handling, and permission checks (including ADMIN-only price editing) are in place for future
        CRUD actions.
      </div>
    </div>
  );
}
