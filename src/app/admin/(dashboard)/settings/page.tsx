import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { getAdminSession } from '@/features/auth/session';
import { canManageSettings } from '@/lib/permissions';

export const instant = false;

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageSettings(session.role)) {
    return <AccessDenied message="Only ADMIN users can access Settings." />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Manage storefront settings and contact information."
      />
      <div className="rounded-lg border border-dashed border-[var(--line)] p-6 text-sm text-[var(--font-color)]">
        Settings management UI is not implemented in this milestone yet. Access is restricted to
        ADMIN.
      </div>
    </div>
  );
}
