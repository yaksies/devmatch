"use client";

import { useCallback, useState } from "react";
import type { HackathonProfile } from "@devmatch/shared";

type Props = {
  initialProfiles: HackathonProfile[];
};

export function DiscoverDeck({ initialProfiles }: Props) {
  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const current = initialProfiles[index];

  const goNext = useCallback(
    (_direction: "like" | "pass") => {
      if (!current) return;
      void _direction; // TODO: POST to Supabase `swipes`
      setReviewed((n) => n + 1);
      setIndex((i) => i + 1);
    },
    [current],
  );

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center">
        <p className="text-lg font-medium text-[var(--foreground)]">
          You&apos;re caught up
        </p>
        <p className="max-w-sm text-sm text-[var(--muted)]">
          Wire this view to Supabase to load real participants for your
          hackathon. For now, refresh to reset the mock deck.
        </p>
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setReviewed(0);
          }}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
        >
          Reset demo deck
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <article className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] shadow-lg shadow-black/20">
        <div className="aspect-[4/5] p-6 flex flex-col justify-end">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-soft),transparent_55%)] opacity-90" />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Looking for teammates
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
              {current.displayName}
            </h2>
            {current.headline ? (
              <p className="mt-2 text-sm text-[var(--muted)]">{current.headline}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {current.techStack.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--muted-bg)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            {current.interests ? (
              <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]">
                {current.interests}
              </p>
            ) : null}
          </div>
        </div>
      </article>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => goNext("pass")}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted-bg)]"
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => goNext("like")}
          className="flex-1 rounded-full bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
        >
          Like
        </button>
      </div>

      {reviewed > 0 ? (
        <p className="text-center text-xs text-[var(--muted)]">
          {reviewed} reviewed — wire Pass/Like to Supabase{" "}
          <code className="rounded bg-[var(--muted-bg)] px-1">swipes</code>
        </p>
      ) : null}
    </div>
  );
}
