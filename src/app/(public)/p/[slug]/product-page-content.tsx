import { notFound } from 'next/navigation';
import { Carousel } from '@/components/carousel';
import { ProductDetail } from '@/components/product-detail';
import {
  getCategoryByType,
  getProductBySlug,
  getRelatedProducts,
  getSettings,
} from '@/lib/queries';

type ProductPageContentProps = Pick<PageProps<'/p/[slug]'>, 'params'>;

export async function ProductPageContent({ params }: ProductPageContentProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [category, relatedProducts, settings] = await Promise.all([
    getCategoryByType(product.type),
    getRelatedProducts(product.product_id),
    getSettings(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <ProductDetail
        product={product}
        categoryName={category?.name ?? null}
        settings={{
          phone: settings.phone,
          facebookUrl: settings.facebookUrl,
          instagramUrl: settings.instagramUrl,
        }}
      />

      {relatedProducts.length > 0 ? (
        <div className="mt-16 sm:mt-20">
          <Carousel
            title="YOU MIGHT ALSO LIKE"
            products={relatedProducts}
            viewAllHref={category ? `/c/${category.slug}` : '/c'}
          />
        </div>
      ) : null}
    </main>
  );
}
