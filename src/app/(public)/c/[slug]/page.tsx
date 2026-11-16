import { Suspense } from 'react';
import { getCategories } from '@/features/shared/queries';
import { isMissingTableError } from '@/features/shared/db/prisma';
import { CategoryPageContent } from './category-page-content';

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    const params = categories.map((category) => ({ slug: category.slug }));
    return params.length > 0 ? params : [{ slug: '__empty__' }];
  } catch (error) {
    if (isMissingTableError(error)) {
      return [{ slug: '__empty__' }];
    }
    throw error;
  }
}

export default function CategoryPage(props: PageProps<'/c/[slug]'>) {
  return (
    <Suspense fallback={<CategoryPageFallback />}>
      <CategoryPageContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

function CategoryPageFallback() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading category products"
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
    >
      <div className="mb-6 h-8 animate-pulse bg-product-image" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="aspect-square animate-pulse bg-product-image" />
        ))}
      </div>
    </main>
  );
}
