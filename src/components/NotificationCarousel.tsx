"use client";

import { useState, useEffect } from "react";
import { NotificationDetail } from "@/components/NotificationDetail";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  display_name: string;
  headline: string | null;
  tech_stack: string[] | null;
  interests: string | null;
};

type Props = {
  profiles: Profile[];
  userId: string;
};

export function NotificationCarousel({ profiles: initialProfiles, userId }: Props) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "swipes",
          filter: `target_id=eq.${userId}`,
        },
        async (payload) => {
          const newSwipe = payload.new;
          if (newSwipe.direction === "like") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, display_name, headline, tech_stack, interests")
              .eq("id", newSwipe.swiper_id)
              .single();

            if (profile) {
              setProfiles((current) => {
                const exists = current.some((p) => p.id === profile.id);
                return exists ? current : [profile, ...current];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  // Called by NotificationDetail after a card is acted on (accept or skip).
  // Removes the profile from the list so it never loops back.
  const handleDismiss = (profileId: string) => {
    setProfiles((current) => {
      const next = current.filter((p) => p.id !== profileId);
      // Keep the index in bounds
      setCurrentIndex((idx) => Math.min(idx, Math.max(next.length - 1, 0)));
      return next;
    });
  };

  if (!profiles.length) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 text-center">
        <p className="text-lg font-semibold text-[var(--foreground)]">There&apos;s nothing to be seen here...</p>
        <p className="text-sm text-[var(--muted)]">No one has liked you yet.</p>
        <Link
          href="/discover"
          className="mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
        >
          Go discover
        </Link>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div>
      <div className="mb-6 flex items-center justify-center gap-2 text-xs font-medium text-[var(--muted)]">
        <span>{currentIndex + 1}</span>
        <div className="flex gap-1">
          {profiles.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? "w-6 bg-[var(--accent)]" : "w-2 bg-[var(--muted-bg)]"
              }`}
              aria-label={`Go to notification ${idx + 1}`}
            />
          ))}
        </div>
        <span>/ {profiles.length}</span>
      </div>

      {currentProfile && (
        <NotificationDetail
          key={currentProfile.id}
          profile={currentProfile}
          onNext={() => setCurrentIndex((i) => Math.min(i + 1, profiles.length - 1))}
          onPrevious={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          hasNext={currentIndex < profiles.length - 1}
          hasPrevious={currentIndex > 0}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
