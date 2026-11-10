import { BlogRow } from '@/components/blog-row';
import { Carousel } from '@/components/carousel';
import { ActionButton } from '@/components/action-button';
import { HeroSlider } from '@/components/hero-slider';
import {
  getBlogPosts,
  getCategories,
  getHeroSlides,
  getProductsByCategorySlug,
} from '@/lib/queries';

export default function Home() {
  const categories = getCategories();
  const productSections = categories.map((category) => ({
    category,
    products: getProductsByCategorySlug(category.slug),
  }));
  const latestPosts = getBlogPosts({ limit: 2 });
  const heroSlides = getHeroSlides();

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
