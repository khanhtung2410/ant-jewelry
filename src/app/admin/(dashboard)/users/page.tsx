import Link from 'next/link';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { firstSearchParam, type SearchParam } from '@/features/admin/lib/admin-search-params';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import { canManageUsers } from '@/features/shared/lib/permissions';
import { UserManagement } from '@/features/users/components/user-management';

export const instant = false;

type AdminUsersPageProps = {
  searchParams: Promise<Partial<Record<'new' | 'saved', SearchParam>>>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageUsers(session.role)) {
    return <AccessDenied message="Only ADMIN users can access Users." />;
  }

  const params = await searchParams;
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, locked: true },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
  });

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Create internal accounts, assign roles, and lock access."
        actions={
          <Link
            href="/admin/users?new=1"
            aria-haspopup="dialog"
            className="rounded-md bg-foreground px-3 py-2 text-sm text-background"
          >
            New user
          </Link>
        }
      />
      <UserManagement
        users={users}
        currentUserId={session.userId}
        saved={firstSearchParam(params.saved) === '1'}
        createDialog={firstSearchParam(params.new) === '1'}
      />
    </div>
  );
}
