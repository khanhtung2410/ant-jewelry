import { notFound } from 'next/navigation';
import { Carousel } from '@/features/products/components/carousel';
import { ProductDetail } from '@/features/products/components/product-detail';
import {
  getCategoryByType,
  getProductBySlug,
  getRelatedProducts,
  getSettings,
} from '@/features/shared/queries';

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
      <ProductDetail product={product} categoryName={category?.name ?? null} settings={settings} />

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
