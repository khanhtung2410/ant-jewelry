import { AccessDenied } from '@/features/admin/components/access-denied';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { SavedNotice } from '@/features/admin/components/form-controls';
import { firstSearchParam, type SearchParam } from '@/features/admin/lib/admin-search-params';
import { getAdminSession } from '@/features/auth/session';
import { SettingsForm } from '@/features/settings/components/settings-form';
import type { SettingsFormValues } from '@/features/settings/actions';
import { prisma } from '@/features/shared/db/prisma';
import { canManageSettings } from '@/features/shared/lib/permissions';

export const instant = false;

type AdminSettingsPageProps = {
  searchParams: Promise<Partial<Record<'saved', SearchParam>>>;
};

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageSettings(session.role)) {
    return <AccessDenied message="Only ADMIN users can access Settings." />;
  }

  const params = await searchParams;
  const record = await prisma.setting.findFirst({ orderBy: { createdAt: 'asc' } });
  const values: SettingsFormValues = {
    siteName: record?.siteName ?? 'ANT JEWELRY',
    phone: record?.phone ?? '',
    facebookUrl: record?.facebookUrl ?? '',
    instagramUrl: record?.instagramUrl ?? '',
    address: record?.address ?? '',
    email: record?.email ?? '',
  };

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Manage the contact details and social links shown across the storefront."
      />
      {firstSearchParam(params.saved) === '1' ? (
        <SavedNotice message="Settings saved." dismissHref="/admin/settings" />
      ) : null}
      <div className="mt-4">
        <SettingsForm values={values} />
      </div>
    </div>
  );
}
