import Link from 'next/link';
import { AccessDenied } from '@/features/admin/components/access-denied';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { firstSearchParam, type SearchParam } from '@/features/admin/lib/admin-search-params';
import { getAdminSession } from '@/features/auth/session';
import type { BlogPostFormValues } from '@/features/blog/actions';
import { BlogManagement } from '@/features/blog/components/blog-management';
import { buildAdminBlogHref } from '@/features/blog/lib/admin-blog-list';
import { prisma } from '@/features/shared/db/prisma';
import { todayDateInputValue, toDateInputValue } from '@/features/shared/lib/format-date';
import { canManageBlog } from '@/features/shared/lib/permissions';

export const instant = false;

type AdminBlogPageProps = {
  searchParams: Promise<Partial<Record<'edit' | 'new' | 'saved', SearchParam>>>;
};

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const session = await getAdminSession();
  if (!session) return null;
  if (!canManageBlog(session.role)) {
    return <AccessDenied message="You do not have permission to manage blog posts." />;
  }

  const params = await searchParams;
  const editId = firstSearchParam(params.edit);
  const createRequested = firstSearchParam(params.new) === '1';
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ publishedAt: 'desc' }, { title: 'asc' }],
  });
  const selectedPost = editId ? posts.find((post) => post.id === editId) : null;

  const values: BlogPostFormValues | null = selectedPost
    ? {
        blogId: selectedPost.id,
        title: selectedPost.title,
        slug: selectedPost.slug,
        summary: selectedPost.summary,
        body: selectedPost.body,
        coverImageUrl: selectedPost.coverImageUrl,
        publishedAt: toDateInputValue(selectedPost.publishedAt.toISOString()),
        status: selectedPost.status,
      }
    : createRequested
      ? {
          title: '',
          slug: '',
          summary: '',
          body: '',
          coverImageUrl: '',
          publishedAt: todayDateInputValue(),
          status: 'DRAFT',
        }
      : null;

  const closeHref = buildAdminBlogHref();

  return (
    <div>
      <AdminPageHeader
        title="Blog"
        description="Write Markdown posts, preview them, and publish them when they are ready."
        actions={
          <Link
            href={buildAdminBlogHref({ create: true })}
            aria-haspopup="dialog"
            className="rounded-md bg-foreground px-3 py-2 text-sm text-background"
          >
            New post
          </Link>
        }
      />
      <BlogManagement
        posts={posts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          publishedAt: post.publishedAt.toISOString(),
        }))}
        saved={firstSearchParam(params.saved) === '1'}
        dialog={values ? { values, closeHref } : null}
      />
    </div>
  );
}
