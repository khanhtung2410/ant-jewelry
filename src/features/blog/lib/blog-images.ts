export type BlogImageRecord = {
  url: string;
  alt: string;
};

const INLINE_IMAGE_PATTERN = /!\[(.*?)\]\((.*?)\)/g;

/**
 * Builds the ordered image list for a blog post: the cover first, then every
 * inline `![alt](url)` image from the body. Duplicate URLs are collapsed and
 * an image without alt text falls back to the post title.
 */
export function collectBlogImages(
  coverImageUrl: string,
  body: string,
  title: string,
): BlogImageRecord[] {
  const inlineImages = [...body.matchAll(INLINE_IMAGE_PATTERN)].map((match) => ({
    url: match[2],
    alt: match[1] || title,
  }));

  return Array.from(
    new Map(
      [coverImageUrl, ...inlineImages.map((image) => image.url)].filter(Boolean).map((url) => {
        const match = inlineImages.find((image) => image.url === url);
        return [url, { url, alt: match?.alt || title }];
      }),
    ).values(),
  );
}
