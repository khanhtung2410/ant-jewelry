import { notFound, redirect } from 'next/navigation';
import { CategoryProductListing } from '@/components/category-product-listing';
import { getCategoryBySlug, getProductsByCategorySlug, parseProductSort } from '@/lib/queries';

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

  const products = await getProductsByCategorySlug(slug, { sort });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <CategoryProductListing
        key={`${category.slug}:${sort}`}
        categoryName={category.name}
        categorySlug={category.slug}
        products={products}
        sort={sort}
      />
    </main>
  );
}
