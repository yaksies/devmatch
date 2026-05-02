import Link from "next/link";
import { redirect } from "next/navigation";

import { acceptBack, undoSwipe } from "../../notifications/actions";
import { createClient } from "@/lib/supabase/server";

async function handleAcceptBack(targetId: string) {
  "use server";
  await acceptBack(targetId);
}

async function handleUndoSwipe(targetId: string, from: string) {
  "use server";
  await undoSwipe(targetId, from, true);
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | { id: string };
  searchParams: Promise<{ from?: string }> | { from?: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, headline, tech_stack, interests")
    .eq("id", resolvedParams.id)
    .single();

  if (!profile) {
    const backHref = resolvedSearchParams.from === "passed" ? "/passed" : resolvedSearchParams.from === "accepted" ? "/accepted" : "/notifications";
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
        <Link href={backHref} className="mb-6 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
          ← Back
        </Link>
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">Profile not found</p>
        </div>
      </div>
    );
  }

  const backHref = resolvedSearchParams.from === "passed" ? "/passed" : resolvedSearchParams.from === "accepted" ? "/accepted" : "/notifications";
  const canAcceptBack = resolvedSearchParams.from === "notifications" && profile.id !== user.id;
  const canUndo = (resolvedSearchParams.from === "passed" || resolvedSearchParams.from === "accepted") && profile.id !== user.id;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href={backHref} className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
          ← Back
        </Link>
        <span className="text-sm font-medium text-[var(--muted)]">View profile</span>
        <div className="w-12" />
      </div>

      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/10 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
          Hackathon profile
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {profile.display_name}
        </h1>
        {profile.headline ? (
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{profile.headline}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {(profile.tech_stack ?? []).map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--muted-bg)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {profile.interests ? (
          <p className="mt-6 text-sm leading-7 text-[var(--foreground)]">
            {profile.interests}
          </p>
        ) : null}

        <div className="mt-8 flex gap-3">
          {canAcceptBack ? (
            <form action={handleAcceptBack.bind(null, profile.id)}>
              <button className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90">
                Accept back
              </button>
            </form>
          ) : null}
          {canUndo ? (
            <form action={handleUndoSwipe.bind(null, profile.id, resolvedSearchParams.from || "passed")}>
              <button className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-transparent px-5 py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]">
                Retake swipe
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}