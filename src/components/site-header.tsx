import Link from "next/link";

const nav = [
  { href: "/discover", label: "Discover" },
  { href: "/profile", label: "My profile" },
  { href: "/chat", label: "Chat" },
] as const;

export function SiteHeader() {
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
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
