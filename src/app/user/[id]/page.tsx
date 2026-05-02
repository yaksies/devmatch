import Link from "next/link";
import { redirect } from "next/navigation";

import { acceptBack, undoSwipe } from "../../notifications/actions";
import { createClient } from "@/lib/supabase/server";
import { ProfileAiInsightButton } from "@/components/ProfileAiInsightButton";
import { mockDiscoverDeck } from "@devmatch/shared";

function getMockProfile(id: string) {
  return mockDiscoverDeck.find((profile) => profile.id === id);
}

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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, headline, tech_stack, interests, discord, email, linkedin, github, projects")
    .eq("id", resolvedParams.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error.message, error.details, error.hint);
  }

  const mockProfile = profile ? null : getMockProfile(resolvedParams.id);

  if (!profile && !mockProfile) {
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
  const resolvedProfile = profile ?? {
    id: mockProfile!.id,
    display_name: mockProfile!.displayName,
    headline: mockProfile!.headline,
    tech_stack: mockProfile!.techStack,
    interests: mockProfile!.interests,
  };
  const canAcceptBack = Boolean(profile) && resolvedSearchParams.from === "notifications" && resolvedProfile.id !== user.id;
  const canUndo = Boolean(profile) && (resolvedSearchParams.from === "passed" || resolvedSearchParams.from === "accepted") && resolvedProfile.id !== user.id;

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
          {profile ? "Hackathon profile" : "Test profile"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {resolvedProfile.display_name}
        </h1>
        {resolvedProfile.headline ? (
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">{resolvedProfile.headline}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {(resolvedProfile.tech_stack ?? []).map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--muted-bg)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {resolvedProfile.interests ? (
          <p className="mt-6 text-sm leading-7 text-[var(--foreground)]">
            {resolvedProfile.interests}
          </p>
        ) : null}

        {profile?.projects ? (
          <div className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Projects & Experience</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{profile.projects}</p>
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {profile?.discord ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Discord</p>
              <p className="mt-1 text-sm text-[var(--foreground)]">{profile.discord}</p>
            </div>
          ) : null}
          {profile?.email ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Email</p>
              <p className="mt-1 text-sm text-[var(--foreground)]">{profile.email}</p>
            </div>
          ) : null}
          {profile?.github ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">GitHub</p>
              <p className="mt-1 text-sm text-[var(--foreground)]">{profile.github}</p>
            </div>
          ) : null}
          {profile?.linkedin ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">LinkedIn</p>
              <p className="mt-1 text-sm text-[var(--foreground)]">{profile.linkedin}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <ProfileAiInsightButton profileId={resolvedProfile.id} profileName={resolvedProfile.display_name} />
        </div>

        <div className="mt-8 flex gap-3">
          {canAcceptBack ? (
            <form action={handleAcceptBack.bind(null, resolvedProfile.id)}>
              <button className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90">
                Accept back
              </button>
            </form>
          ) : null}
          {canUndo ? (
            <form action={handleUndoSwipe.bind(null, resolvedProfile.id, resolvedSearchParams.from || "passed")}>
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