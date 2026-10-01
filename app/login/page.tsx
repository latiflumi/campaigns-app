// app/login/page.tsx
'use client';

import { useActionState } from 'react';
import { loginAction, type AuthFormState } from '../actions/auth';
import { useT } from '../lib/i18n/client';
import AppMark from '../AppMark';

export default function LoginPage() {
  const t = useT();
  const [state, formAction, isPending] = useActionState<AuthFormState | null, FormData>(loginAction, null);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
  <div className="w-full max-w-sm rounded-2xl border border-neutral-200/80 bg-white p-8 shadow-xl shadow-neutral-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
    {/* Header */}
    <div className="flex flex-col items-center text-center">
      <AppMark className="size-12 drop-shadow-sm" />
      <h1 className="mt-4 text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        {t.login.title}
      </h1>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        {t.login.subtitle}
      </p>
    </div>

    {/* Form */}
    <form action={formAction} className="mt-6 space-y-4">
      <div className="space-y-3.5">
        {/* Username Input */}
        <div>
          <label
            htmlFor="userName"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
          >
            {t.login.username}
          </label>
          <div className="mt-1.5">
            <input
              id="userName"
              name="userName"
              type="text"
              required
              className="block w-full rounded-lg border border-neutral-300 bg-neutral-50/50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/15 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder-neutral-600 dark:focus:border-brand-500 dark:focus:bg-neutral-950 dark:focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
          >
            {t.login.password}
          </label>
          <div className="mt-1.5">
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="block w-full rounded-lg border border-neutral-300 bg-neutral-50/50 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/15 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder-neutral-600 dark:focus:border-brand-500 dark:focus:bg-neutral-950 dark:focus:ring-brand-500/20"
            />
          </div>
        </div>
      </div>

      {/* Error Message Alert */}
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          <p className="flex items-center gap-2">
            <span className="font-semibold">{t.login.error}</span> {state.error}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-600 dark:focus:ring-brand-500 dark:focus:ring-offset-neutral-900"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t.login.signingIn}
            </span>
          ) : (
            t.login.signIn
          )}
        </button>
      </div>
    </form>
  </div>
</div>
  );
}