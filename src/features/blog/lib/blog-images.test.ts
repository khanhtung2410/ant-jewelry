import { describe, expect, it } from 'vitest';
import { collectBlogImages } from './blog-images';

describe('collectBlogImages', () => {
  it('puts the cover first, then inline images in body order', () => {
    const images = collectBlogImages(
      '/mock/blog/cover.webp',
      'Mở đầu\n\n![Nhẫn vàng](/mock/blog/ring.webp)\n\n![Dây chuyền](/mock/blog/necklace.webp)',
      'Cách chọn nhẫn',
    );

    expect(images).toEqual([
      { url: '/mock/blog/cover.webp', alt: 'Cách chọn nhẫn' },
      { url: '/mock/blog/ring.webp', alt: 'Nhẫn vàng' },
      { url: '/mock/blog/necklace.webp', alt: 'Dây chuyền' },
    ]);
  });

  it('deduplicates the cover and repeated inline images', () => {
    const images = collectBlogImages(
      '/mock/blog/ring.webp',
      '![Nhẫn](/mock/blog/ring.webp)\n\n![Nhẫn lại](/mock/blog/ring.webp)\n\n![Dây](/mock/blog/necklace.webp)',
      'Cách chọn nhẫn',
    );

    expect(images.map((image) => image.url)).toEqual([
      '/mock/blog/ring.webp',
      '/mock/blog/necklace.webp',
    ]);
  });

  it('falls back to the post title and skips empty image urls', () => {
    const images = collectBlogImages(
      '/mock/blog/cover.webp',
      '![](/mock/blog/ring.webp)![]()',
      'ANT',
    );

    expect(images).toEqual([
      { url: '/mock/blog/cover.webp', alt: 'ANT' },
      { url: '/mock/blog/ring.webp', alt: 'ANT' },
    ]);
  });
});
