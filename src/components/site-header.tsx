import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

const nav = [
  { href: "/discover", label: "Discover" },
  { href: "/profile", label: "My profile" },
  { href: "/chat", label: "Chat" },
] as const;

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-[var(--foreground)]"
        >
          DevMatch
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          {user ? (
            <>
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] sm:px-3"
                >
                  {item.label}
                </Link>
              ))}

              <div className="ml-2 flex items-center border-l border-[var(--border)] pl-2">
                <form action={logout}>
                  <button className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--muted-bg)] hover:text-red-400 sm:px-3">
                    Log out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
