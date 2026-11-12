'use client';

import { useActionState } from 'react';
import { SavedNotice } from '@/features/admin/components/form-controls';
import type { Role } from '@/features/shared/domain/domain';
import { saveUserAccess, type UserAccessFormState } from '../actions';
import { UserFormDialog } from './user-form-dialog';

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  locked: boolean;
};

export function UserManagement({
  users,
  currentUserId,
  saved,
  createDialog,
}: {
  users: AdminUserRow[];
  currentUserId: string;
  saved: boolean;
  createDialog: boolean;
}) {
  const activeCount = users.filter((user) => !user.locked).length;

  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-[var(--line)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
          <h2 className="font-heading text-sm tracking-[0.08em]">USERS ({users.length})</h2>
          <p className="text-xs text-[var(--font-color)]">
            {activeCount} active · {users.length - activeCount} locked
          </p>
        </div>

        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-[var(--product-image-background)] text-xs uppercase tracking-wide text-[var(--font-color)]">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Role &amp; access</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow key={user.id} user={user} isCurrentUser={user.id === currentUserId} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-8 text-sm text-[var(--font-color)]">No users yet.</p>
        )}
      </section>

      {saved ? <SavedNotice message="User saved." dismissHref="/admin/users" /> : null}

      {createDialog ? <UserFormDialog closeHref="/admin/users" /> : null}
    </div>
  );
}

function UserRow({ user, isCurrentUser }: { user: AdminUserRow; isCurrentUser: boolean }) {
  const initialState: UserAccessFormState = {
    values: { userId: user.id, role: user.role, locked: user.locked },
    fieldErrors: {},
    message: null,
  };
  const [state, formAction, pending] = useActionState(saveUserAccess, initialState);

  return (
    <tr className="border-t border-[var(--line)] align-top">
      <td className="px-4 py-3">
        <p className="font-medium">
          {user.name ?? 'Unnamed user'}
          {isCurrentUser ? (
            <span className="ml-2 rounded-full bg-[var(--product-image-background)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--font-color)]">
              You
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-[var(--font-color)]">{user.email}</p>
      </td>

      <td className="px-4 py-3">
        <span
          className={
            user.locked
              ? 'rounded-full bg-red-50 px-2 py-1 text-xs text-red-800'
              : 'rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800'
          }
        >
          {user.locked ? 'Locked' : 'Active'}
        </span>
        <p className="mt-2 text-xs text-[var(--font-color)]">{user.role}</p>
      </td>

      <td className="px-4 py-3">
        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="userId" value={user.id} />

          <label className="flex items-center gap-2 text-xs text-[var(--font-color)]">
            Role
            <select
              name="role"
              defaultValue={state.values.role}
              className="rounded-md border border-[var(--line)] bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="EDITOR">EDITOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-[var(--font-color)]">
            <input
              type="checkbox"
              name="locked"
              defaultChecked={state.values.locked}
              className="h-4 w-4"
            />
            Lock access
          </label>

          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium transition hover:border-[var(--underline-color)] hover:text-[var(--underline-color)] disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </form>

        {state.fieldErrors.form?.map((error) => (
          <p key={error} role="alert" className="mt-2 text-xs text-red-700">
            {error}
          </p>
        ))}
      </td>
    </tr>
  );
}
