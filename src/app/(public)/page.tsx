import type { Metadata } from 'next';
import { BlogRow } from '@/features/blog/components/blog-row';
import { Carousel } from '@/features/products/components/carousel';
import { ActionButton } from '@/features/layout/components/action-button';
import { HeroSlider } from '@/features/layout/components/hero-slider';
import {
  getBlogPosts,
  getHeroSlides,
  getStorefrontCategorySections,
} from '@/features/shared/queries';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  const [productSections, latestPosts, heroSlides] = await Promise.all([
    getStorefrontCategorySections(),
    getBlogPosts({ limit: 2 }),
    getHeroSlides(),
  ]);

  return (
    <main className="space-y-12 pb-16 sm:space-y-16">
      <HeroSlider slides={heroSlides} />

      <div className="mx-auto w-full max-w-7xl space-y-14 px-4 sm:px-6 lg:px-8">
        {productSections.map(({ category, products }) => (
          <Carousel
            key={category.category_id}
            title={category.name}
            products={products}
            viewAllHref={`/c/${category.slug}`}
          />
        ))}

        <section aria-labelledby="home-blog-heading">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2
              id="home-blog-heading"
              className="font-heading text-lg tracking-[0.08em] sm:text-xl"
            >
              BLOG
            </h2>
            <ActionButton href="/blog" className="text-sm">
              SEE MORE
            </ActionButton>
          </div>

          {latestPosts.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-1">
              {latestPosts.map((post) => (
                <BlogRow key={post.blog_id} post={post} className="h-full" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Chưa có bài viết.</p>
          )}
        </section>
      </div>
    </main>
  );
}
