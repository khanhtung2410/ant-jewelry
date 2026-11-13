'use client';

import { useActionState } from 'react';
import { VISIBILITY_STATUS } from '@/constants/statuses';
import { SavedNotice } from '@/features/admin/components/form-controls';
import {
  AdminActionButton,
  AdminActionLink,
  AdminTableActions,
} from '@/features/admin/components/admin-table-actions';
import { AdminConfirmForm } from '@/features/admin/components/admin-confirm-form';
import {
  AdminTableEmpty,
  AdminTableSection,
} from '@/features/admin/components/admin-table-section';
import { ReorderButtons } from '@/features/admin/components/reorder-buttons';
import { StatusBadge } from '@/features/admin/components/status-badge';
import {
  deleteCategory,
  moveCategory,
  type CategoryFormValues,
  type DeleteCategoryState,
} from '../actions/categories';
import { buildAdminCategoriesHref } from '../lib/admin-category-list';
import { CategoryFormDialog } from './category-form-dialog';

export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: 'VISIBLE' | 'HIDDEN';
  sortOrder: number;
  productCount: number;
};

export function CategoryManagement({
  categories,
  saved,
  dialog,
}: {
  categories: AdminCategoryRow[];
  saved: boolean;
  dialog: { values: CategoryFormValues; closeHref: string } | null;
}) {
  const returnTo = buildAdminCategoriesHref();

  return (
    <div>
      <AdminTableSection
        title={`CATEGORIES (${categories.length})`}
        meta="Use the arrows to change the order shown on the home page and in navigation."
      >
        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-[var(--product-image-background)] text-xs uppercase tracking-wide text-[var(--font-color)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Product type</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category.id} className="border-t border-[var(--line)] align-top">
                    <td className="whitespace-nowrap px-4 py-3">
                      <ReorderButtons
                        label={category.name}
                        position={index + 1}
                        disabledUp={index === 0}
                        disabledDown={index === categories.length - 1}
                        upAction={moveCategory.bind(null, category.id, 'up')}
                        downAction={moveCategory.bind(null, category.id, 'down')}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{category.name}</p>
                      <p className="mt-1 text-xs text-[var(--font-color)]">/{category.slug}</p>
                    </td>
                    <td className="px-4 py-3">{category.type}</td>
                    <td className="px-4 py-3">{category.productCount}</td>
                    <td className="px-4 py-3">
                      <StatusBadge config={VISIBILITY_STATUS[category.status]} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AdminTableActions>
                        <AdminActionLink
                          href={buildAdminCategoriesHref({ edit: category.id })}
                          aria-haspopup="dialog"
                        >
                          Edit
                        </AdminActionLink>
                        <CategoryDeleteForm category={category} returnTo={returnTo} />
                      </AdminTableActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminTableEmpty>No categories yet.</AdminTableEmpty>
        )}
      </AdminTableSection>

      {saved ? <SavedNotice message="Category saved." dismissHref={returnTo} /> : null}

      {dialog ? <CategoryFormDialog values={dialog.values} closeHref={dialog.closeHref} /> : null}
    </div>
  );
}

function CategoryDeleteForm({
  category,
  returnTo,
}: {
  category: AdminCategoryRow;
  returnTo: string;
}) {
  const initialState: DeleteCategoryState = { message: null };
  const [state, formAction, pending] = useActionState(deleteCategory, initialState);
  const blockedReason =
    category.productCount > 0
      ? `Cannot delete: ${category.productCount} ${
          category.productCount === 1 ? 'product is' : 'products are'
        } still assigned.`
      : null;

  return (
    <div className="space-y-1">
      <AdminConfirmForm action={formAction} confirmMessage={`Delete “${category.name}”?`}>
        <input type="hidden" name="categoryId" value={category.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <AdminActionButton
          type="submit"
          disabled={Boolean(blockedReason) || pending}
          variant="danger"
          title={blockedReason ?? undefined}
          className="disabled:cursor-not-allowed disabled:text-[var(--font-color)] disabled:opacity-70"
        >
          Delete
        </AdminActionButton>
      </AdminConfirmForm>
      {blockedReason ? (
        <p className="max-w-48 text-xs text-[var(--font-color)]">{blockedReason}</p>
      ) : state.message ? (
        <p role="alert" className="max-w-48 text-xs text-red-700">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
