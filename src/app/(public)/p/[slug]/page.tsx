import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getProductBySlug, getProducts } from '@/lib/queries';
import { ProductPageContent } from './product-page-content';

export function generateStaticParams() {
  return getProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(props: PageProps<'/p/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default function ProductPage(props: PageProps<'/p/[slug]'>) {
  return (
    <Suspense fallback={<ProductPageFallback />}>
      <ProductPageContent params={props.params} />
    </Suspense>
  );
}

function ProductPageFallback() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading product"
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square animate-pulse bg-product-image" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse bg-product-image" />
          <div className="h-4 w-1/3 animate-pulse bg-product-image" />
          <div className="h-6 w-1/4 animate-pulse bg-product-image" />
          <div className="h-24 w-full animate-pulse bg-product-image" />
        </div>
      </div>
    </main>
  );
}
