import { Suspense } from 'react';
import { getCategories } from '@/features/shared/queries';
import { CategoryPageContent } from './category-page-content';

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
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
