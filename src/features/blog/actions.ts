'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/features/auth/session';
import { prisma } from '@/features/shared/db/prisma';
import {
  formatZodIssues,
  formState,
  readFormString,
  type FieldErrors,
  type FormState,
} from '@/features/shared/lib/form-validation';
import { canManageBlog } from '@/features/shared/lib/permissions';
import { savedBlogRedirect } from './lib/admin-blog-list';
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
  const imageMatches = [...body.matchAll(/!\[(.*?)\]\((.*?)\)/g)].map((match) => ({
    alt: match[1] || title,
    url: match[2],
  }));
  const uniqueImages = Array.from(
    new Map(
      [coverImageUrl, ...imageMatches.map((image) => image.url)].filter(Boolean).map((url) => {
        const match = imageMatches.find((image) => image.url === url);
        return [url, { url, alt: match?.alt || title }];
      }),
    ).values(),
  );

  await prisma.blogImage.deleteMany({ where: { blogPostId } });
  if (uniqueImages.length > 0) {
    await prisma.blogImage.createMany({
      data: uniqueImages.map((image, index) => ({
        blogPostId,
        url: image.url,
        alt: image.alt,
        sortOrder: index + 1,
      })),
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

  const existingSlug = await prisma.blogPost.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (existingSlug && existingSlug.id !== blogId) {
    return stateWithErrors(values, { slug: ['This slug is already in use.'] });
  }

  const existingPost = blogId
    ? await prisma.blogPost.findUnique({ where: { id: blogId }, select: { id: true } })
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
      ? await prisma.blogPost.update({
          where: { id: blogId },
          data,
          select: { id: true },
        })
      : await prisma.blogPost.create({
          data,
          select: { id: true },
        });

    await syncBlogPostImages(
      savedPost.id,
      parsed.data.coverImageUrl,
      parsed.data.body,
      parsed.data.title,
    );

    revalidateBlogPages();
    redirect(savedBlogRedirect(readFormString(formData, 'returnTo')));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
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

  const post = await prisma.blogPost.findUnique({
    where: { id: blogPostId },
    select: { id: true },
  });
  if (!post) {
    throw new Error('Blog post not found.');
  }

  await prisma.blogPost.delete({ where: { id: post.id } });
  revalidateBlogPages();
  redirect(savedBlogRedirect('/admin/blog'));
}
