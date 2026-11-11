'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format-price';
import { getGalleryImages } from '@/lib/product-gallery';
import type { Product } from '@/types/domain';
import { ContactPopover, type ContactSettings } from './contact-popover';
import { ProductGallery } from './product-gallery';

interface ProductDetailProps {
  product: Product;
  categoryName: string | null;
  settings: ContactSettings;
}

export function ProductDetail({ product, categoryName, settings }: ProductDetailProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | undefined>(
    product.colors[0]?.colorId,
  );
  const galleryImages = getGalleryImages(product, selectedColorId);
  const detailEntries = Object.entries(product.details);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <ProductGallery
        key={selectedColorId ?? 'default'}
        images={galleryImages}
        productName={product.name}
      />

      <div>
        <h1 className="font-heading text-2xl uppercase leading-tight tracking-[0.08em] sm:text-3xl">
          {product.name}
        </h1>

        <dl className="mt-6 flex w-full flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <dt className="font-heading uppercase tracking-[0.08em] text-muted">Brand:</dt>
            <dd>{product.brand}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-heading uppercase tracking-[0.08em] text-muted">Type:</dt>
            <dd>{categoryName ?? product.type}</dd>
          </div>
        </dl>

        <p className="mt-6 text-lg">{formatPrice(product.price)}</p>

        {product.colors.length > 0 ? (
          <fieldset className="mt-6">
            <legend className="font-heading text-xs uppercase tracking-[0.12em]">Color</legend>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {product.colors.map((color) => {
                const selected = color.colorId === selectedColorId;

                return (
                  <button
                    key={color.colorId}
                    type="button"
                    aria-label={color.name}
                    aria-pressed={selected}
                    title={color.name}
                    onClick={() => setSelectedColorId(color.colorId)}
                    className={[
                      'h-8 w-8 rounded-full border border-line transition-shadow',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--control-outline)]',
                      selected ? 'ring-2 ring-[var(--underline-color)] ring-offset-2' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="sr-only">{color.name}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <p className="mt-6 text-sm leading-6 text-muted">{product.description}</p>

        {detailEntries.length > 0 ? (
          <section className="mt-8">
            <h2 className="font-heading text-sm tracking-[0.08em]">Details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {detailEntries.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-line/50 pb-2"
                >
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <div className="mt-8">
          <ContactPopover settings={settings} />
        </div>
      </div>
    </div>
  );
}
