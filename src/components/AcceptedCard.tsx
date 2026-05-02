"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  display_name?: string;
  headline?: string | null;
};

export function AcceptedCard({ profile, isMatched }: { profile: Profile; isMatched: boolean }) {
  const [isHidden, setIsHidden] = useState(false);

  const handleRetake = async () => {
    setIsHidden(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
      .from("swipes")
      .delete()
      .eq("swiper_id", user.id)
      .eq("target_id", profile.id);
  };

  if (isHidden) return null;

  return (
    <div
      className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--muted-bg)]"
      style={{
        opacity: isHidden ? 0 : 1,
        transform: isHidden ? "scale(0.95)" : "scale(1)",
      }}
    >
      <button
        onClick={handleRetake}
        className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--muted)] opacity-0 transition-all hover:bg-rose-500/15 hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100"
        aria-label={`Retake swipe for ${profile.display_name ?? "this profile"}`}
        title="Retake swipe"
      >
        x
      </button>
      <Link href={`/user/${profile.id}?from=accepted`} className="block rounded-xl pr-9 transition-opacity hover:opacity-90">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          {profile.display_name ?? "Unknown"}
        </p>
        {profile.headline ? (
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{profile.headline}</p>
        ) : null}
      </Link>
      {isMatched ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
            Matched
          </span>
          <Link
            href={`/chat?with=${profile.id}`}
            className="inline-flex rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
          >
            Open chat
          </Link>
        </div>
      ) : null}
    </div>
  );
}
