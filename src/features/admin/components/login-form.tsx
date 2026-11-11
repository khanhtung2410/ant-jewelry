'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '@/features/auth/actions';

const initialState: LoginState = {};

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-heading tracking-[0.08em] text-[var(--font-color)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-foreground outline-none transition focus:border-[var(--underline-color)] focus:ring-2 focus:ring-[color:rgba(38,86,73,0.15)]"
          placeholder="admin@antjewelry.local"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-heading tracking-[0.08em] text-[var(--font-color)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-foreground outline-none transition focus:border-[var(--underline-color)] focus:ring-2 focus:ring-[color:rgba(38,86,73,0.15)]"
          placeholder="Enter your password"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-[var(--underline-color)] px-4 py-2.5 font-heading text-sm tracking-[0.08em] text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
