import { describe, expect, it, vi } from 'vitest';
import type { CreateUserFormState } from '@/features/users/actions';
import type { ProductFormState, ProductFormValues } from '@/features/products/actions';
import type { SettingsFormState } from '@/features/settings/actions';

vi.mock('@/features/auth/session', () => ({
  getAdminSession: vi.fn(async () => ({
    userId: 'editor-1',
    email: 'editor@example.com',
    name: 'Editor',
    role: 'EDITOR',
    exp: 9_999_999_999,
  })),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/features/shared/db/prisma', () => ({
  prisma: {
    category: {
      findUnique: vi.fn(async () => ({ id: 'category-1', type: 'WEDDING RING' })),
    },
    product: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; slug?: string } }) =>
        where?.id ? { id: where.id, price: 1000000 } : null,
      ),
    },
  },
}));

const { saveProduct } = await import('@/features/products/actions');
const { saveSettings } = await import('@/features/settings/actions');
const { createUser } = await import('@/features/users/actions');

const productValues: ProductFormValues = {
  name: 'Gold ring',
  slug: 'gold-ring',
  categoryId: 'category-1',
  type: 'WEDDING RING',
  brand: 'ANT',
  price: '1000000',
  description: 'A ring',
  details: '',
  colors: [],
  published: true,
};

const productState: ProductFormState = {
  values: productValues,
  fieldErrors: {},
  message: null,
};

const settingsState: SettingsFormState = {
  values: {
    siteName: 'ANT JEWELRY',
    phone: '0900 000 000',
    facebookUrl: 'https://www.facebook.com/example',
    instagramUrl: 'https://www.instagram.com/example',
    address: 'Ha Noi',
    email: 'hello@example.com',
  },
  fieldErrors: {},
  message: null,
};

const createUserState: CreateUserFormState = {
  values: { name: 'New user', email: 'new@example.com', role: 'ADMIN' },
  fieldErrors: {},
  message: null,
};

describe('server action authorization', () => {
  it('rejects an EDITOR calling the product price update action directly', async () => {
    const formData = new FormData();
    formData.set('productId', 'product-1');
    formData.set('name', 'Gold ring');
    formData.set('slug', 'gold-ring');
    formData.set('categoryId', 'category-1');
    formData.set('type', 'WEDDING RING');
    formData.set('brand', 'ANT');
    formData.set('price', '9999999');
    formData.set('description', 'A ring');

    const state = await saveProduct(productState, formData);

    expect(state.fieldErrors.form?.[0]).toMatch(/permission/i);
  });

  it('rejects an EDITOR calling the settings action directly', async () => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(settingsState.values)) {
      formData.set(key, value);
    }

    const state = await saveSettings(settingsState, formData);

    expect(state.fieldErrors.form?.[0]).toMatch(/permission/i);
  });

  it('rejects an EDITOR calling the user creation action directly', async () => {
    const formData = new FormData();
    formData.set('name', createUserState.values.name);
    formData.set('email', createUserState.values.email);
    formData.set('password', 'Editor@123');
    formData.set('role', createUserState.values.role);

    const state = await createUser(createUserState, formData);

    expect(state.fieldErrors.form?.[0]).toMatch(/permission/i);
  });
});
