import Link from "next/link";
import { redirect } from "next/navigation";

import { AcceptedCard } from "@/components/AcceptedCard";
import { createClient } from "@/lib/supabase/server";

type Row = {
  target_id: string;
};

type MatchRow = {
  user_a: string;
  user_b: string;
};

export default async function AcceptedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: swipes } = await supabase
    .from("swipes")
    .select("target_id")
    .eq("swiper_id", user.id)
    .eq("direction", "like")
    .order("created_at", { ascending: false });

  const targetIds = [...new Set((swipes as Row[] | null | undefined)?.map((row) => row.target_id) ?? [])];

  const { data: profiles } = targetIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, headline, tech_stack, interests")
        .in("id", targetIds)
    : { data: [] as Array<{ id: string; display_name: string; headline: string | null }> };

  const { data: matches } = await supabase
    .from("matches")
    .select("user_a, user_b")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  const matchedIds = new Set(
    ((matches as MatchRow[] | null | undefined) ?? []).map((match) =>
      match.user_a === user.id ? match.user_b : match.user_a,
    ),
  );

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/profile" className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">People you accepted</h1>
        <div className="w-12" />
      </div>

      {targetIds.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {targetIds.map((id) => {
            const profile = profileMap.get(id);
            return (
              <AcceptedCard
                key={id}
                profile={{ id, display_name: profile?.display_name, headline: profile?.headline }}
                isMatched={matchedIds.has(id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">There&apos;s nothing to be seen here...</p>
          <p className="text-sm text-[var(--muted)]">No accepted people yet.</p>
        </div>
      )}
    </div>
  );
}