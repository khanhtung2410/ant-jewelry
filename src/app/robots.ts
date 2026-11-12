import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/features/shared/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: new URL('/sitemap.xml', getSiteUrl()).toString(),
  };
}
