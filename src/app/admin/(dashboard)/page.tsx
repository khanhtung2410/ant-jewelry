import Link from 'next/link';
import { VISIBILITY_STATUS } from '@/constants/statuses';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import {
  AdminTableEmpty,
  AdminTableSection,
} from '@/features/admin/components/admin-table-section';
import { StatusBadge } from '@/features/admin/components/status-badge';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import { formatPrice } from '@/features/shared/lib/format-price';
import {
  canManageBlog,
  canManageCategories,
  canManageHeroSlides,
  canManageUsers,
  canViewProducts,
  getPermissionsForRole,
} from '@/features/shared/lib/permissions';

export const instant = false;

type ActivityLogItem = {
  id: string;
  type: string;
  title: string;
  detail: string;
  at: Date;
  href?: string;
};

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) return null;

  const permissions = getPermissionsForRole(session.role);
  const canProducts = canViewProducts(session.role);
  const canCategories = canManageCategories(session.role);
  const canBlog = canManageBlog(session.role);
  const canHero = canManageHeroSlides(session.role);
  const canUsers = canManageUsers(session.role);

  const [productCount, visibleProductCount, categoryCount, blogCount, heroCount, userCount] =
    await Promise.all([
      canProducts ? prisma.product.count() : Promise.resolve(null),
      canProducts ? prisma.product.count({ where: { status: 'VISIBLE' } }) : Promise.resolve(null),
      canCategories ? prisma.category.count() : Promise.resolve(null),
      canBlog ? prisma.blogPost.count() : Promise.resolve(null),
      canHero ? prisma.heroSlide.count() : Promise.resolve(null),
      canUsers ? prisma.user.count() : Promise.resolve(null),
    ]);

  const [recentProducts, recentProductUpdates, recentBlog, recentCategories, recentUsers] =
    await Promise.all([
      canProducts
        ? prisma.product.findMany({
            take: 6,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              name: true,
              slug: true,
              brand: true,
              price: true,
              status: true,
              updatedAt: true,
              category: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
      canProducts
        ? prisma.product.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, updatedAt: true, status: true },
          })
        : Promise.resolve([]),
      canBlog
        ? prisma.blogPost.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, title: true, updatedAt: true, status: true },
          })
        : Promise.resolve([]),
      canCategories
        ? prisma.category.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, updatedAt: true, status: true },
          })
        : Promise.resolve([]),
      canUsers
        ? prisma.user.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, email: true, name: true, updatedAt: true, role: true },
          })
        : Promise.resolve([]),
    ]);

  const activityLog: ActivityLogItem[] = [
    ...recentProductUpdates.map((item) => ({
      id: `product-${item.id}`,
      type: 'Product',
      title: item.name,
      detail: `Status: ${item.status}`,
      at: item.updatedAt,
      href: '/admin/products',
    })),
    ...recentBlog.map((item) => ({
      id: `blog-${item.id}`,
      type: 'Blog Post',
      title: item.title,
      detail: `Status: ${item.status}`,
      at: item.updatedAt,
      href: '/admin/blog',
    })),
    ...recentCategories.map((item) => ({
      id: `category-${item.id}`,
      type: 'Category',
      title: item.name,
      detail: `Status: ${item.status}`,
      at: item.updatedAt,
      href: '/admin/categories',
    })),
    ...recentUsers.map((item) => ({
      id: `user-${item.id}`,
      type: 'User',
      title: item.name || item.email,
      detail: `${item.role} · ${item.email}`,
      at: item.updatedAt,
      href: '/admin/users',
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10);

  const stats = [
    canProducts
      ? {
          label: 'Products',
          value: String(productCount ?? 0),
          detail:
            visibleProductCount != null ? `${visibleProductCount} visible in storefront` : undefined,
          href: '/admin/products',
        }
      : null,
    canCategories
      ? { label: 'Categories', value: String(categoryCount ?? 0), href: '/admin/categories' }
      : null,
    canBlog ? { label: 'Blog Posts', value: String(blogCount ?? 0), href: '/admin/blog' } : null,
    canHero
      ? { label: 'Hero Slides', value: String(heroCount ?? 0), href: '/admin/hero-slides' }
      : null,
    canUsers ? { label: 'Users', value: String(userCount ?? 0), href: '/admin/users' } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description={`Signed in as ${session.name ?? session.email} (${session.role}). Overview of storefront content and recent activity.`}
      />

      {stats.length > 0 ? (
        <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-[var(--line)] bg-[var(--product-image-background)]/30 p-4 transition hover:border-[var(--underline-color)]"
            >
              <p className="font-heading text-xs tracking-[0.12em] text-[var(--font-color)] uppercase">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
              {stat.detail ? (
                <p className="mt-1 text-xs text-[var(--font-color)]">{stat.detail}</p>
              ) : null}
            </Link>
          ))}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-label="Recent products">
          <AdminTableSection
            title={`RECENT PRODUCTS${productCount != null ? ` (${productCount})` : ''}`}
            meta={canProducts ? <Link href="/admin/products" className="hover:text-[var(--underline-color)]">View all</Link> : null}
          >
            {!canProducts ? (
              <AdminTableEmpty>You do not have permission to view products.</AdminTableEmpty>
            ) : recentProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead className="bg-[var(--product-image-background)] text-xs uppercase tracking-wide text-[var(--font-color)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((product) => (
                      <tr key={product.id} className="border-t border-[var(--line)] align-top">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="mt-1 text-xs text-[var(--font-color)]">
                            {product.brand} · /{product.slug}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[var(--font-color)]">{product.category.name}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatPrice(product.price)} ₫</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            config={VISIBILITY_STATUS[product.status]}
                            className="min-w-[5rem]"
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--font-color)]">
                          <time dateTime={product.updatedAt.toISOString()}>
                            {formatDateTime(product.updatedAt)}
                          </time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <AdminTableEmpty>No products found.</AdminTableEmpty>
            )}
          </AdminTableSection>
        </section>

        <section aria-label="Activity log">
          <AdminTableSection
            title="ACTIVITY LOG"
            meta={`${activityLog.length} recent update${activityLog.length === 1 ? '' : 's'}`}
          >
            {activityLog.length > 0 ? (
              <ol className="divide-y divide-[var(--line)]">
                {activityLog.map((item) => (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--font-color)]">
                          {item.type}
                        </p>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="mt-0.5 block truncate text-sm font-medium text-foreground hover:text-[var(--underline-color)]"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                            {item.title}
                          </p>
                        )}
                        <p className="mt-0.5 truncate text-xs text-[var(--font-color)]">{item.detail}</p>
                      </div>
                      <time
                        dateTime={item.at.toISOString()}
                        className="shrink-0 text-xs text-[var(--font-color)]"
                      >
                        {formatDateTime(item.at)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <AdminTableEmpty>No recent activity available for your permissions.</AdminTableEmpty>
            )}
          </AdminTableSection>
        </section>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--line)] p-4">
          <h2 className="font-heading text-sm tracking-[0.08em] text-foreground">Quick links</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {[
              canProducts ? { href: '/admin/products', label: 'Products' } : null,
              canCategories ? { href: '/admin/categories', label: 'Categories' } : null,
              canBlog ? { href: '/admin/blog', label: 'Blog' } : null,
              canHero ? { href: '/admin/hero-slides', label: 'Hero Slides' } : null,
              canUsers ? { href: '/admin/users', label: 'Users' } : null,
            ]
              .filter((item): item is NonNullable<typeof item> => item !== null)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md border border-[var(--line)] px-3 py-1.5 transition hover:border-[var(--underline-color)] hover:text-[var(--underline-color)]"
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] p-4">
          <h2 className="font-heading text-sm tracking-[0.08em] text-foreground">
            Granted permissions
          </h2>
          <p className="mt-1 text-xs text-[var(--font-color)]">{permissions.length} permissions for {session.role}</p>
          <ul className="mt-3 grid max-h-48 gap-1 overflow-auto pr-1 text-sm text-[var(--font-color)] sm:grid-cols-2">
            {permissions.map((permission) => (
              <li
                key={permission}
                className="rounded border border-[var(--line)] px-2 py-1 font-mono text-xs"
              >
                {permission}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
