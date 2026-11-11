import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/features/admin/components/login-form';
import { getAdminSession } from '@/features/auth/session';

export const metadata: Metadata = {
  title: 'Admin Login',
};

export const instant = false;

type LoginPageProps = {
  searchParams?: Promise<{ next?: string | string[] }>;
};

function resolveNextPath(nextParam: string | string[] | undefined): string {
  const value = Array.isArray(nextParam) ? nextParam[0] : nextParam;
  if (!value || !value.startsWith('/admin') || value.startsWith('/admin/login')) {
    return '/admin';
  }
  return value;
}

export default function AdminLoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminLoginContent({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();
  if (session) {
    redirect('/admin');
  }

  const params = (await searchParams) ?? {};
  const nextPath = resolveNextPath(params.next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fefdf8_0%,#f4f6f2_100%)] px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-[var(--line)] bg-background/95 p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-2">
          <p className="font-heading text-xs tracking-[0.2em] text-[var(--font-color)]">
            ANT JEWELRY
          </p>
          <h1 className="font-heading text-2xl tracking-[0.08em] text-foreground">Admin Login</h1>
          <p className="text-sm text-[var(--font-color)]">
            Sign in to manage storefront content and administration.
          </p>
        </div>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}

function AdminLoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fefdf8_0%,#f4f6f2_100%)] px-4 py-10">
      <div
        aria-busy="true"
        className="w-full max-w-md rounded-xl border border-[var(--line)] bg-background/95 p-6 shadow-sm sm:p-8"
      >
        <p className="font-heading text-xs tracking-[0.2em] text-[var(--font-color)]">
          ANT JEWELRY
        </p>
        <h1 className="mt-2 font-heading text-2xl tracking-[0.08em] text-foreground">
          Admin Login
        </h1>
        <p role="status" className="mt-6 text-sm text-[var(--font-color)]">
          Loading sign-in...
        </p>
      </div>
    </main>
  );
}
