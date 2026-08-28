// app/login/page.tsx
'use client';

import { useActionState } from 'react';
import { loginAction, type AuthFormState } from '../actions/auth';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<AuthFormState | null, FormData>(loginAction, null);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
  <div className="w-full max-w-sm rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
    {/* Header */}
    <div className="flex flex-col items-center text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Welcome back
      </h1>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Enter your credentials to access CampaignStudio
      </p>
    </div>

    {/* Form */}
    <form action={formAction} className="mt-6 space-y-4">
      <div className="space-y-3.5">
        {/* Username Input */}
        <div>
          <label
            htmlFor="userName"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
          >
            Username
          </label>
          <div className="mt-1.5">
            <input
              id="userName"
              name="userName"
              type="text"
              required
              className="block w-full rounded-lg border border-zinc-300 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-indigo-500 dark:focus:bg-zinc-950 dark:focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
          >
            Password
          </label>
          <div className="mt-1.5">
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="block w-full rounded-lg border border-zinc-300 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-indigo-500 dark:focus:bg-zinc-950 dark:focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Error Message Alert */}
      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
          <p className="flex items-center gap-2">
            <span className="font-semibold">Error:</span> {state.error}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:focus:ring-indigo-500 dark:focus:ring-offset-zinc-900"
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
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </div>
    </form>
  </div>
</div>
  );
}