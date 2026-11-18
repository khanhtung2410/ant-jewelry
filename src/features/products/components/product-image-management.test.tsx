import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProductImageManagement } from './product-image-management';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element -- next/image is mocked in this Node test.
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock('../actions', () => ({
  assignProductImageColor: vi.fn(async () => {}),
  deleteProduct: vi.fn(async () => {}),
  deleteProductImage: vi.fn(async () => {}),
  moveProductImage: vi.fn(async () => {}),
  setProductImageFront: vi.fn(async () => {}),
  setProductImageHover: vi.fn(async () => {}),
}));

function render(canDeleteProduct: boolean): string {
  return renderToStaticMarkup(
    <ProductImageManagement
      productId="p-1"
      productName="Gold ring"
      canDeleteProduct={canDeleteProduct}
      images={[]}
      colors={[]}
    />,
  );
}

describe('ProductImageManagement permissions', () => {
  it('hides the delete product button without products:delete', () => {
    expect(render(false)).not.toContain('Delete product');
  });

  it('shows the delete product button with products:delete', () => {
    expect(render(true)).toContain('Delete product');
  });
});
