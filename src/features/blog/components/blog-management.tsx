'use client';

import { BLOG_POST_STATUS, publishStatus } from '@/constants/statuses';
import { SavedNotice } from '@/features/admin/components/form-controls';
import {
  AdminActionButton,
  AdminActionLink,
  AdminTableActions,
} from '@/features/admin/components/admin-table-actions';
import { AdminConfirmForm } from '@/features/admin/components/admin-confirm-form';
import {
  AdminTableEmpty,
  AdminTableSection,
} from '@/features/admin/components/admin-table-section';
import { StatusBadge } from '@/features/admin/components/status-badge';
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
      <AdminTableSection
        title={`BLOG POSTS (${posts.length})`}
        meta={`${publishedCount} published · ${draftCount} draft`}
      >
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
                      <StatusBadge config={BLOG_POST_STATUS[post.status]} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AdminTableActions>
                        <AdminActionLink
                          href={buildAdminBlogHref({ edit: post.id })}
                          aria-haspopup="dialog"
                        >
                          Edit
                        </AdminActionLink>
                        <AdminConfirmForm
                          action={deleteBlogPost.bind(null, post.id)}
                          confirmMessage={`Delete “${post.title}”?`}
                        >
                          <AdminActionButton type="submit" variant="danger">
                            Delete
                          </AdminActionButton>
                        </AdminConfirmForm>
                      </AdminTableActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminTableEmpty>No blog posts yet.</AdminTableEmpty>
        )}
      </AdminTableSection>

      {saved ? <SavedNotice message="Blog post saved." dismissHref={returnTo} /> : null}

      {dialog ? <BlogPostFormDialog values={dialog.values} closeHref={dialog.closeHref} /> : null}
    </div>
  );
}
