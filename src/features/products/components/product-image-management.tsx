'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  assignProductImageColor,
  deleteProduct,
  deleteProductImage,
  moveProductImage,
  setProductImageFront,
  setProductImageHover,
} from '../actions';
import { MAX_PRODUCT_IMAGE_SIZE } from '../lib/product-image-validation';
import { isExternalImageUrl } from '../lib/product-gallery';

type ImageRecord = {
  id: string;
  url: string;
  alt: string;
  isFront: boolean;
  isHover: boolean;
  sortOrder: number;
  productColorId: string | null;
};

type ColorOption = { id: string; name: string };

export function ProductImageManagement({
  productId,
  productName,
  images,
  colors,
}: {
  productId: string;
  productName: string;
  images: ImageRecord[];
  colors: ColorOption[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadSelectedFiles() {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) {
      setError('Choose at least one image.');
      return;
    }

    const oversizedFile = Array.from(files).find((file) => file.size > MAX_PRODUCT_IMAGE_SIZE);
    if (oversizedFile) {
      setError(`${oversizedFile.name} exceeds the 5 MB limit.`);
      return;
    }

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append('files', file);
    }

    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/images`, {
        method: 'POST',
        body: formData,
      });
      const result: { error?: string; images?: ImageRecord[] } = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Image upload failed.');
        return;
      }

      setMessage(`${result.images?.length ?? 0} image(s) uploaded.`);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      router.refresh();
    } catch {
      setError('Image upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="mt-6 border-t border-[var(--line)] pt-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm tracking-[0.08em]">PRODUCT IMAGES</h3>
          <p className="mt-1 text-xs text-[var(--font-color)]">
            JPEG, PNG, or WebP; up to 5 MB per file.
          </p>
        </div>
        <form
          action={deleteProduct.bind(null, productId)}
          onSubmit={(event) => {
            if (!window.confirm(`Delete "${productName}" and all its images?`)) {
              event.preventDefault();
            }
          }}
        >
          <button type="submit" className="text-xs text-red-700 underline underline-offset-2">
            Delete product
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          aria-label="Select product images"
          className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--product-image-background)] file:px-3 file:py-2"
        />
        <button
          type="button"
          onClick={uploadSelectedFiles}
          disabled={uploading}
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Upload images'}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {images.length > 0 ? (
        <ol className="mt-5 space-y-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="grid gap-3 rounded-lg border border-[var(--line)] p-3 sm:grid-cols-[88px_minmax(0,1fr)]"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-[var(--product-image-background)]">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  unoptimized={isExternalImageUrl(image.url)}
                  sizes="88px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="truncate text-sm font-medium">
                  Image {index + 1}
                  {image.isFront ? ' · Cover' : ''}
                  {image.isHover ? ' · Hover' : ''}
                </p>
                <form
                  action={assignProductImageColor.bind(null, productId, image.id)}
                  className="flex flex-wrap items-center gap-2"
                >
                  <label htmlFor={`color-${image.id}`} className="text-xs text-[var(--font-color)]">
                    Assigned to
                  </label>
                  <select
                    id={`color-${image.id}`}
                    name="productColorId"
                    defaultValue={image.productColorId ?? ''}
                    className="min-w-0 flex-1 rounded-md border border-[var(--line)] bg-background px-2 py-1.5 text-xs"
                  >
                    <option value="">All colors</option>
                    {colors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-md border border-[var(--line)] px-2 py-1.5 text-xs"
                  >
                    Assign
                  </button>
                </form>
                <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs">
                  <form action={moveProductImage.bind(null, productId, image.id, 'up')}>
                    <button
                      type="submit"
                      disabled={index === 0}
                      className="underline disabled:opacity-40"
                    >
                      Move up
                    </button>
                  </form>
                  <form action={moveProductImage.bind(null, productId, image.id, 'down')}>
                    <button
                      type="submit"
                      disabled={index === images.length - 1}
                      className="underline disabled:opacity-40"
                    >
                      Move down
                    </button>
                  </form>
                  <form action={setProductImageFront.bind(null, productId, image.id)}>
                    <button
                      type="submit"
                      disabled={image.isFront || Boolean(image.productColorId)}
                      className="underline disabled:opacity-40"
                    >
                      Set as cover
                    </button>
                  </form>
                  <form action={setProductImageHover.bind(null, productId, image.id)}>
                    <button
                      type="submit"
                      disabled={image.isHover || image.isFront || Boolean(image.productColorId)}
                      className="underline disabled:opacity-40"
                    >
                      Set as hover
                    </button>
                  </form>
                  <form
                    action={deleteProductImage.bind(null, productId, image.id)}
                    onSubmit={(event) => {
                      if (!window.confirm('Delete this product image?')) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <button type="submit" className="text-red-700 underline">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 text-sm text-[var(--font-color)]">No product images yet.</p>
      )}
    </section>
  );
}
