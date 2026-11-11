import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { getAdminSession } from '@/features/auth/session';
import { canManageUsers } from '@/lib/permissions';

export const instant = false;

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageUsers(session.role)) {
    return <AccessDenied message="Only ADMIN users can access Users." />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Manage internal user accounts and role assignments."
      />
      <div className="rounded-lg border border-dashed border-[var(--line)] p-6 text-sm text-[var(--font-color)]">
        User management UI is not implemented in this milestone yet. Access is restricted to ADMIN.
      </div>
    </div>
  );
}
