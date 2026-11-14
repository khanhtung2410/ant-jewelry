'use client';

import { useActionState, useRef, useState } from 'react';
import { BLOG_POST_STATUS_OPTIONS } from '@/constants/statuses';
import { AdminDialog } from '@/features/admin/components/admin-dialog';
import { AdminTabButton, AdminTabList } from '@/features/admin/components/admin-tabs';
import {
  FormActions,
  FormAlert,
  FormCancelButton,
  FormField,
  FormSubmitButton,
  ImageUrlField,
  inputClassName,
} from '@/features/admin/components/form-controls';
import { BlogDetail } from './blog-detail';
import type { BlogPost } from '@/features/shared/domain/domain';
import { saveBlogPost, type BlogPostFormState, type BlogPostFormValues } from '../actions';

type EditorTab = 'write' | 'preview';

export function BlogPostFormDialog({
  values,
  closeHref,
}: {
  values: BlogPostFormValues;
  closeHref: string;
}) {
  const initialState: BlogPostFormState = {
    values,
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(saveBlogPost, initialState);

  const [body, setBody] = useState(values.body);
  const [coverUrl, setCoverUrl] = useState(values.coverImageUrl);

  const titleRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const publishedAtRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  function readFieldValue(ref: { current: { value: string } | null }, fallback: string) {
    return ref.current?.value ?? fallback;
  }

  function buildPreviewPost(): BlogPost {
    const title = readFieldValue(titleRef, state.values.title || values.title);
    const slug = readFieldValue(slugRef, state.values.slug || values.slug);
    const summary = readFieldValue(summaryRef, state.values.summary || values.summary);
    const coverImageUrl = coverUrl;
    const publishedAt = readFieldValue(
      publishedAtRef,
      state.values.publishedAt || values.publishedAt,
    );
    const status = readFieldValue(statusRef, state.values.status || values.status);

    return {
      blog_id: values.blogId ?? 'preview',
      title: title || 'Untitled post',
      slug,
      summary,
      body,
      coverImageUrl,
      images: [],
      publishedAt: publishedAt ? `${publishedAt}T00:00:00+07:00` : new Date().toISOString(),
      status: status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    };
  }

  return (
    <AdminDialog
      title={values.blogId ? `Edit ${values.title}` : 'New blog post'}
      description="Draft posts stay hidden from the storefront until you publish them."
      closeHref={closeHref}
      size="lg"
    >
      <form action={formAction} className="space-y-4">
        {values.blogId ? <input type="hidden" name="blogId" value={values.blogId} /> : null}
        <input type="hidden" name="returnTo" value={closeHref} />

        <FormField label="Title" error={state.fieldErrors.title?.[0]}>
          <input
            ref={titleRef}
            name="title"
            defaultValue={state.values.title || values.title}
            className={inputClassName}
          />
        </FormField>

        <FormField
          label="Slug"
          hint="Used in the post URL, for example /blog/cach-chon-nhan-cuoi."
          error={state.fieldErrors.slug?.[0]}
        >
          <input
            ref={slugRef}
            name="slug"
            defaultValue={state.values.slug || values.slug}
            className={inputClassName}
          />
        </FormField>

        <FormField label="Summary" error={state.fieldErrors.summary?.[0]}>
          <textarea
            ref={summaryRef}
            name="summary"
            defaultValue={state.values.summary || values.summary}
            rows={3}
            className={inputClassName}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Published date"
            hint="Shown in Vietnam time."
            error={state.fieldErrors.publishedAt?.[0]}
          >
            <input
              ref={publishedAtRef}
              type="date"
              name="publishedAt"
              defaultValue={state.values.publishedAt || values.publishedAt}
              className={inputClassName}
            />
          </FormField>

          <FormField label="Trạng thái" error={state.fieldErrors.status?.[0]}>
            <select
              ref={statusRef}
              name="status"
              defaultValue={state.values.status || values.status}
              className={inputClassName}
            >
              {BLOG_POST_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <ImageUrlField
          label="Cover image URL"
          name="coverImageUrl"
          value={coverUrl}
          onChange={setCoverUrl}
          hint="Use a site path (starting with /) or an http(s) URL."
          error={state.fieldErrors.coverImageUrl?.[0]}
          previewAlt="Cover preview"
        />

        <BodyEditor
          body={body}
          setBody={setBody}
          error={state.fieldErrors.body?.[0]}
          buildPreviewPost={buildPreviewPost}
        />

        <FormAlert message={state.message} />
        {state.fieldErrors.form?.map((error) => (
          <p key={error} role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ))}

        <FormActions>
          <FormCancelButton closeHref={closeHref} />
          <FormSubmitButton pending={pending}>
            {values.blogId ? 'Save post' : 'Create post'}
          </FormSubmitButton>
        </FormActions>
      </form>
    </AdminDialog>
  );
}

function BodyEditor({
  body,
  setBody,
  error,
  buildPreviewPost,
}: {
  body: string;
  setBody: (value: string) => void;
  error?: string;
  buildPreviewPost: () => BlogPost;
}) {
  const [tab, setTab] = useState<EditorTab>('write');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Body (Markdown)</p>
        <AdminTabList label="Body editor mode">
          <AdminTabButton active={tab === 'write'} onClick={() => setTab('write')}>
            Write
          </AdminTabButton>
          <AdminTabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
            Preview
          </AdminTabButton>
        </AdminTabList>
      </div>

      <textarea
        name="body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={14}
        hidden={tab !== 'write'}
        className={`${inputClassName} font-mono`}
      />

      {tab === 'preview' ? (
        <div className="min-h-72 rounded-md border border-[var(--line)] px-4 py-2">
          {body.trim() ? (
            <BlogDetail post={buildPreviewPost()} otherPosts={[]} />
          ) : (
            <p className="py-6 text-sm text-[var(--font-color)]">
              Nothing to preview yet. Add Markdown in the Write tab.
            </p>
          )}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
