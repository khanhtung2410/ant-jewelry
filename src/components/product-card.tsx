import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format-price';
import type { Product } from '@/types/domain';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const frontImage = product.images.find((image) => image.isFront) ?? product.images[0];
  // Compare URLs so placeholder products that reuse the same file do not fade
  // into an identical image.
  const hoverImage = frontImage
    ? product.images.find((image) => image.url !== frontImage.url)
    : undefined;

  return (
    <article className={className}>
      <Link
        href={`/p/${product.slug}`}
        className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-line"
      >
        <div className="product-image-frame relative aspect-square overflow-hidden">
          {frontImage ? (
            <Image
              src={frontImage.url}
              alt={frontImage.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-opacity duration-300 group-hover:opacity-0"
            />
          ) : null}
          {hoverImage ? (
            <Image
              src={hoverImage.url}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          ) : null}
        </div>

        <h3 className="mt-3 font-heading text-sm leading-snug tracking-[0.08em]">{product.name}</h3>
        <p className="mt-1 text-sm text-muted">
          {formatPrice(product.price)} <span>₫</span>
        </p>
      </Link>

      {product.colors.length > 0 ? (
        <ul
          aria-label={`Màu sắc của ${product.name}`}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          {product.colors.map((color) => (
            <li key={color.colorId} className="flex">
              <span
                role="img"
                aria-label={color.name}
                title={color.name}
                className="h-4 w-4 rounded-full border border-line"
                style={{ backgroundColor: color.hex }}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
