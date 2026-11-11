import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { requireAdminSession } from '@/features/auth/require-admin';

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s | Admin | ANT JEWELRY',
  },
};

export const instant = false;

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminDashboardFallback />}>
      <AdminDashboardContent>{children}</AdminDashboardContent>
    </Suspense>
  );
}

async function AdminDashboardContent({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession('/admin');
  return <AdminShell session={session}>{children}</AdminShell>;
}

function AdminDashboardFallback() {
  return (
    <main
      aria-busy="true"
      className="mx-auto mt-6 w-full max-w-7xl rounded-xl border border-[var(--line)] bg-background p-6 text-sm text-[var(--font-color)]"
    >
      Loading admin...
    </main>
  );
}
