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

  // Count pending likes (people who liked me that I haven't liked back yet)
  let pendingLikeCount = 0;
  if (user) {
    const { data: inbound } = await supabase
      .from("swipes")
      .select("swiper_id")
      .eq("target_id", user.id)
      .eq("direction", "like");

    if (inbound && inbound.length > 0) {
      const swiperIds = inbound.map((r) => r.swiper_id);
      const { data: outbound } = await supabase
        .from("swipes")
        .select("target_id")
        .eq("swiper_id", user.id)
        .in("target_id", swiperIds);

      const matchedSet = new Set((outbound ?? []).map((r) => r.target_id));
      pendingLikeCount = swiperIds.filter((id) => !matchedSet.has(id)).length;
    }
  }

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

              {/* Notifications link — badge only shown when there are pending likes */}
              <Link
                href="/notifications"
                className="relative rounded-lg px-2.5 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] sm:px-3"
              >
                Likes
                {pendingLikeCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-[var(--accent-fg)]">
                    {pendingLikeCount > 99 ? "99+" : pendingLikeCount}
                  </span>
                )}
              </Link>

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
