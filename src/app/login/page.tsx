import { login, signup } from "./actions";

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string }>;
}) {
  const searchParams = await props.searchParams;
  const message = searchParams?.message;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 sm:px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Welcome to DevMatch
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to your account or create a new one to start swiping.
          </p>
        </div>

        <form className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[var(--foreground)]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {message && (
            <p className="text-sm font-medium text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {message}
            </p>
          )}

          <div className="mt-2 flex flex-col gap-3">
            <button
              formAction={login}
              className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
            >
              Log In
            </button>
            <button
              formAction={signup}
              className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-2)] py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted-bg)]"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
