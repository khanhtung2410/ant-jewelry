import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { getAdminSession } from '@/features/auth/session';
import { canManageBlog } from '@/lib/permissions';

export const instant = false;

export default async function AdminBlogPage() {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageBlog(session.role)) {
    return <AccessDenied message="You do not have permission to manage blog posts." />;
  }

  return (
    <div>
      <AdminPageHeader title="Blog" description="Manage blog posts and publication content." />
      <div className="rounded-lg border border-dashed border-[var(--line)] p-6 text-sm text-[var(--font-color)]">
        Blog management UI is not implemented in this milestone yet. Access is protected by role
        permissions.
      </div>
    </div>
  );
}
