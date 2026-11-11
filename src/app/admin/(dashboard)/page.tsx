import Link from 'next/link';
import { getAdminSession } from '@/features/auth/session';
import { getPermissionsForRole } from '@/features/shared/lib/permissions';

export const instant = false;

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) return null;
  const permissions = getPermissionsForRole(session.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl tracking-[0.08em] text-foreground">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--font-color)]">
          Signed in as <strong>{session.email}</strong> ({session.role}). Use the navigation to
          manage storefront content according to your permissions.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--product-image-background)]/40 p-4">
          <h2 className="font-heading text-sm tracking-[0.08em] text-foreground">Role</h2>
          <p className="mt-2 text-sm text-[var(--font-color)]">{session.role}</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--product-image-background)]/40 p-4">
          <h2 className="font-heading text-sm tracking-[0.08em] text-foreground">Permissions</h2>
          <p className="mt-2 text-sm text-[var(--font-color)]">{permissions.length} granted</p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-sm tracking-[0.08em] text-foreground">Quick links</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/admin/products"
            className="rounded-md border border-[var(--line)] px-3 py-1.5 hover:border-[var(--underline-color)]"
          >
            Products
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-md border border-[var(--line)] px-3 py-1.5 hover:border-[var(--underline-color)]"
          >
            Categories
          </Link>
          <Link
            href="/admin/blog"
            className="rounded-md border border-[var(--line)] px-3 py-1.5 hover:border-[var(--underline-color)]"
          >
            Blog
          </Link>
          <Link
            href="/admin/hero-slides"
            className="rounded-md border border-[var(--line)] px-3 py-1.5 hover:border-[var(--underline-color)]"
          >
            Hero Slides
          </Link>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-sm tracking-[0.08em] text-foreground">
          Granted permissions
        </h2>
        <ul className="mt-2 grid gap-1 text-sm text-[var(--font-color)] sm:grid-cols-2">
          {permissions.map((permission) => (
            <li
              key={permission}
              className="rounded border border-[var(--line)] px-2 py-1 font-mono text-xs"
            >
              {permission}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
