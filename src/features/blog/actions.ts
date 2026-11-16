'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/features/auth/session';
import { prisma, isUniqueConstraintError } from '@/features/shared/db/prisma';
import {
  formatZodIssues,
  formState,
  readFormString,
  type FieldErrors,
  type FormState,
} from '@/features/shared/lib/form-validation';
import { canManageBlog } from '@/features/shared/lib/permissions';
import { savedBlogRedirect } from './lib/admin-blog-list';
import { collectBlogImages } from './lib/blog-images';
import { blogPostFormSchema } from './lib/blog-form-schema';

export type BlogPostFormValues = {
  blogId?: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImageUrl: string;
  publishedAt: string;
  status: string;
};

export type BlogPostFormState = FormState<BlogPostFormValues>;

function readBlogPostFormValues(formData: FormData): BlogPostFormValues {
  return {
    blogId: readFormString(formData, 'blogId') || undefined,
    title: readFormString(formData, 'title'),
    slug: readFormString(formData, 'slug'),
    summary: readFormString(formData, 'summary'),
    body: readFormString(formData, 'body'),
    coverImageUrl: readFormString(formData, 'coverImageUrl'),
    publishedAt: readFormString(formData, 'publishedAt'),
    status: readFormString(formData, 'status'),
  };
}

function stateWithErrors(
  values: BlogPostFormValues,
  fieldErrors: FieldErrors,
  message: string | null = null,
): BlogPostFormState {
  return formState(values, fieldErrors, message);
}

function revalidateBlogPages() {
  revalidatePath('/admin/blog');
  revalidatePath('/', 'page');
  revalidatePath('/blog', 'page');
  revalidatePath('/blog/[slug]', 'page');
}

async function syncBlogPostImages(
  blogPostId: string,
  coverImageUrl: string,
  body: string,
  title: string,
) {
  const images = collectBlogImages(coverImageUrl, body, title);

  const existing = await (prisma.orm.public.BlogImage as any).where({ blogPostId }).all();
  for (const image of existing) {
    await (prisma.orm.public.BlogImage as any).where({ id: image.id }).delete();
  }
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    await (prisma.orm.public.BlogImage as any).create({
      blogPostId,
      url: image.url,
      alt: image.alt,
      sortOrder: index + 1,
    });
  }
}

export async function saveBlogPost(
  _previousState: BlogPostFormState,
  formData: FormData,
): Promise<BlogPostFormState> {
  const values = readBlogPostFormValues(formData);
  const session = await getAdminSession();
  if (!session || !canManageBlog(session.role)) {
    return stateWithErrors(values, {
      form: ['You do not have permission to manage blog posts.'],
    });
  }

  const blogId = values.blogId ?? '';
  const parsed = blogPostFormSchema.safeParse(values);
  if (!parsed.success) {
    return formState(values, formatZodIssues(parsed.error.issues));
  }

  const existingSlug = await (prisma.orm.public.BlogPost as any)
    .where({ slug: parsed.data.slug })
    .first();
  if (existingSlug && existingSlug.id !== blogId) {
    return stateWithErrors(values, { slug: ['This slug is already in use.'] });
  }

  const existingPost = blogId
    ? await (prisma.orm.public.BlogPost as any).where({ id: blogId }).first()
    : null;
  if (blogId && !existingPost) {
    return stateWithErrors(values, { form: ['This blog post no longer exists.'] });
  }

  const data = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    summary: parsed.data.summary,
    body: parsed.data.body,
    coverImageUrl: parsed.data.coverImageUrl,
    publishedAt: new Date(`${parsed.data.publishedAt}T00:00:00+07:00`),
    status: parsed.data.status,
  };

  try {
    const savedPost = blogId
      ? await (prisma.orm.public.BlogPost as any).where({ id: blogId }).update(data)
      : await (prisma.orm.public.BlogPost as any).create(data);

    await syncBlogPostImages(
      savedPost.id,
      parsed.data.coverImageUrl,
      parsed.data.body,
      parsed.data.title,
    );

    revalidateBlogPages();
    redirect(savedBlogRedirect(readFormString(formData, 'returnTo')));
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return stateWithErrors(values, { slug: ['This slug is already in use.'] });
    }
    throw error;
  }
}

export async function deleteBlogPost(blogPostId: string, _formData: FormData) {
  void _formData;
  const session = await getAdminSession();
  if (!session || !canManageBlog(session.role)) {
    throw new Error('You do not have permission to delete blog posts.');
  }

  const post = await (prisma.orm.public.BlogPost as any).where({ id: blogPostId }).first();
  if (!post) {
    throw new Error('Blog post not found.');
  }

  await (prisma.orm.public.BlogPost as any).where({ id: post.id }).delete();
  revalidateBlogPages();
  redirect(savedBlogRedirect('/admin/blog'));
}
