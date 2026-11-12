'use client';

import { BLOG_POST_STATUS, publishStatus } from '@/constants/statuses';
import { SavedNotice } from '@/features/admin/components/form-controls';
import {
  AdminActionButton,
  AdminActionLink,
  AdminTableActions,
} from '@/features/admin/components/admin-table-actions';
import { formatPublishedDate } from '@/features/shared/lib/format-date';
import type { BlogPostFormValues } from '../actions';
import { deleteBlogPost } from '../actions';
import { buildAdminBlogHref } from '../lib/admin-blog-list';
import { BlogPostFormDialog } from './blog-post-form-dialog';

export type AdminBlogPostRow = {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string;
};

export function BlogManagement({
  posts,
  saved,
  dialog,
}: {
  posts: AdminBlogPostRow[];
  saved: boolean;
  dialog: { values: BlogPostFormValues; closeHref: string } | null;
}) {
  const returnTo = buildAdminBlogHref();
  const publishedCount = posts.filter((post) => post.status === publishStatus.PUBLISHED).length;
  const draftCount = posts.length - publishedCount;

  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-[var(--line)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-heading text-sm tracking-[0.08em]">BLOG POSTS ({posts.length})</h2>
          <p className="text-xs text-[var(--font-color)]">
            {publishedCount} published · {draftCount} draft
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-[var(--product-image-background)] text-xs uppercase tracking-wide text-[var(--font-color)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Post</th>
                  <th className="px-4 py-3 font-medium">Published date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-t border-[var(--line)] align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{post.title}</p>
                      <p className="mt-1 text-xs text-[var(--font-color)]">/{post.slug}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatPublishedDate(post.publishedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-1 text-xs"
                        style={{
                          backgroundColor: BLOG_POST_STATUS[post.status].bg,
                          color: BLOG_POST_STATUS[post.status].color,
                        }}
                      >
                        {BLOG_POST_STATUS[post.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AdminTableActions>
                        <AdminActionLink
                          href={buildAdminBlogHref({ edit: post.id })}
                          aria-haspopup="dialog"
                        >
                          Edit
                        </AdminActionLink>
                        <form
                          action={deleteBlogPost.bind(null, post.id)}
                          onSubmit={(event) => {
                            if (!window.confirm(`Delete “${post.title}”?`)) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <AdminActionButton type="submit" variant="danger">
                            Delete
                          </AdminActionButton>
                        </form>
                      </AdminTableActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-8 text-sm text-[var(--font-color)]">No blog posts yet.</p>
        )}
      </section>

      {saved ? <SavedNotice message="Blog post saved." dismissHref={returnTo} /> : null}

      {dialog ? <BlogPostFormDialog values={dialog.values} closeHref={dialog.closeHref} /> : null}
    </div>
  );
}
