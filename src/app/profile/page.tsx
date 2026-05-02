import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch existing profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { count: notificationCount } = await supabase
    .from("swipes")
    .select("id", { count: "exact", head: true })
    .eq("target_id", user.id)
    .eq("direction", "like");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex justify-end gap-2">
        <Link
          href="/passed"
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted-bg)]"
        >
          Passed
        </Link>
        <Link
          href="/accepted"
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted-bg)]"
        >
          Accepted
        </Link>
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-lg transition-colors hover:bg-[var(--muted-bg)]"
        >
          <span className={notificationCount ? "text-red-400" : "text-[var(--foreground)]/80"}>
            {notificationCount ? "♥" : "♡"}
          </span>
        </Link>
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Your hackathon profile
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This card is what others see while swiping. Keep it short and
          specific.
        </p>
      </div>
      <ProfileForm initialProfile={profile} />
    </div>
  );
}
