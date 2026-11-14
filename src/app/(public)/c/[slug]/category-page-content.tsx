import { notFound, redirect } from 'next/navigation';
import { CategoryProductListing } from '@/features/products/components/category-product-listing';
import {
  getCategoryBySlug,
  getProductsByCategorySlug,
  parseProductSort,
} from '@/features/shared/queries';
import { PRODUCT_CARD_PAGE_SIZE } from '@/features/products/lib/product-card-page';

type CategoryPageContentProps = Pick<PageProps<'/c/[slug]'>, 'params' | 'searchParams'>;

export async function CategoryPageContent({ params, searchParams }: CategoryPageContentProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const sort = parseProductSort(query.sort);
  if (query.sort !== undefined && query.sort !== sort) {
    redirect(`/c/${encodeURIComponent(slug)}?sort=${sort}`);
  }

  const page = await getProductsByCategorySlug(slug, {
    sort,
    limit: PRODUCT_CARD_PAGE_SIZE,
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <CategoryProductListing
        key={`${category.slug}:${sort}`}
        categoryName={category.name}
        categorySlug={category.slug}
        products={page.products}
        hasMore={page.hasMore}
        sort={sort}
      />
    </main>
  );
}
