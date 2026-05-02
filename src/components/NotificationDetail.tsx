"use client";

import Link from "next/link";
import { acceptBack, passBack } from "@/app/notifications/actions";
import { useRef, useState, useEffect, useTransition } from "react";

type Profile = {
  id: string;
  display_name: string;
  headline: string | null;
  tech_stack: string[] | null;
  interests: string | null;
};

type Props = {
  profile: Profile;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  /** Called with the profile id immediately after the user accepts or skips, so the carousel can remove it */
  onDismiss?: (profileId: string) => void;
};

export function NotificationDetail({
  profile,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  onDismiss,
}: Props) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDir, setSwipeDir] = useState<-1 | 1 | null>(null);
  const [isPending, startTransition] = useTransition();

  const startX = useRef(0);
  const wheelDragX = useRef(0);
  const wheelEndTimer = useRef<number | null>(null);
  const handledRef = useRef(false);

  // Reset animation state whenever the displayed profile changes.
  useEffect(() => {
    handledRef.current = false;
    setDragX(0);
    setSwipeDir(null);
    wheelDragX.current = 0;
  }, [profile.id]);

  useEffect(() => {
    return () => {
      if (wheelEndTimer.current) window.clearTimeout(wheelEndTimer.current);
    };
  }, []);

  // ── drag / wheel helpers ──────────────────────────────────────────────────

  const finishDrag = () => {
    setIsDragging(false);
    if (Math.abs(dragX) > 78) {
      handleDirection(dragX > 0 ? "accept" : "skip");
      return;
    }
    setDragX(0);
  };

  const finishWheelGesture = () => {
    setIsDragging(false);
    if (Math.abs(wheelDragX.current) > 120) {
      handleDirection(wheelDragX.current > 0 ? "accept" : "skip");
      return;
    }
    wheelDragX.current = 0;
    setDragX(0);
  };

  // ── core action ──────────────────────────────────────────────────────────

  const handleDirection = (direction: "accept" | "skip") => {
    // Guard: only handle once per card
    if (handledRef.current || swipeDir) return;
    handledRef.current = true;

    const dir = direction === "accept" ? 1 : -1;
    setSwipeDir(dir);

    if (direction === "skip") {
      // Animate out, then dismiss & advance
      window.setTimeout(() => {
        onDismiss?.(profile.id);
        startTransition(async () => {
          await passBack(profile.id);
        });
        onNext?.();
      }, 220);
    } else {
      // Animate out, then call server action via transition
      window.setTimeout(() => {
        onDismiss?.(profile.id);
        startTransition(async () => {
          await acceptBack(profile.id);
        });
      }, 220);
    }
  };

  // ── derived styles ───────────────────────────────────────────────────────

  const x = swipeDir ? swipeDir * 460 : dragX;
  const rotation = swipeDir ? swipeDir * 15 : dragX / 22;
  const opacity = swipeDir ? 0.12 : Math.max(1 - Math.abs(dragX) / 420 * 0.25, 0.75);

  const cardStyle = {
    transform: `translateX(${x}px) rotate(${rotation}deg)`,
    opacity,
    transition: isDragging
      ? "none"
      : "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 240ms ease",
  };

  const showSkip = dragX < -8;
  const showAccept = dragX > 8;
  const indicatorOpacity = Math.min(Math.abs(dragX) / 70, 1);

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Swipeable Card */}
      <div
        className="relative w-full max-w-md cursor-grab select-none touch-none active:cursor-grabbing"
        onMouseDown={(e) => {
          startX.current = e.clientX;
          setIsDragging(true);
        }}
        onMouseMove={(e) => {
          if (!isDragging || swipeDir) return;
          setDragX(e.clientX - startX.current);
        }}
        onMouseUp={() => finishDrag()}
        onMouseLeave={() => { if (isDragging) finishDrag(); }}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
          e.preventDefault();
          if (swipeDir) return;
          // Negate deltaX so swiping right = positive (like discover-deck)
          wheelDragX.current = Math.max(-240, Math.min(240, wheelDragX.current - e.deltaX));
          setDragX(wheelDragX.current);
          setIsDragging(true);
          if (wheelEndTimer.current) window.clearTimeout(wheelEndTimer.current);
          wheelEndTimer.current = window.setTimeout(finishWheelGesture, 110);
        }}
        onTouchStart={(e) => {
          startX.current = e.touches[0]!.clientX;
          setIsDragging(true);
        }}
        onTouchMove={(e) => {
          if (!isDragging || swipeDir) return;
          setDragX(e.touches[0]!.clientX - startX.current);
        }}
        onTouchEnd={() => finishDrag()}
      >
        <div
          className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--muted-bg)] p-8 shadow-2xl shadow-black/20"
          style={cardStyle as React.CSSProperties}
        >
          {/* Swipe direction indicators */}
          <div className="pointer-events-none absolute left-5 right-5 top-5 flex items-center justify-between">
            <div
              className="rounded-full border border-rose-400/50 bg-rose-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200"
              style={{ opacity: showSkip ? indicatorOpacity : 0 }}
            >
              Skip
            </div>
            <div
              className="rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200"
              style={{ opacity: showAccept ? indicatorOpacity : 0 }}
            >
              Accept
            </div>
          </div>

          {/* Badge */}
          <div className="mb-6 inline-block rounded-full bg-green-500/20 px-4 py-2">
            <p className="text-sm font-semibold text-green-400">✓ They liked you!</p>
          </div>

          {/* Profile info */}
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {profile.display_name}
          </h2>

          {profile.headline && (
            <p className="mt-3 text-lg leading-7 text-[var(--muted)]">{profile.headline}</p>
          )}

          {profile.tech_stack && profile.tech_stack.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {profile.tech_stack.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--accent)]/20 px-3 py-1 text-xs font-medium text-[var(--accent)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {profile.interests && (
            <p className="mt-6 text-sm leading-7 text-[var(--foreground)]">{profile.interests}</p>
          )}

          {/* Swipe hints */}
          <div className="mt-8 flex justify-between text-xs font-medium text-[var(--muted)]">
            <span>← Skip</span>
            <span>Accept →</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={() => handleDirection("skip")}
          disabled={!!swipeDir}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--muted-bg)] active:scale-95 disabled:opacity-50"
        >
          Skip
        </button>

        <Link
          href={`/user/${profile.id}?from=notifications`}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--muted-bg)] active:scale-95"
        >
          View Profile
        </Link>

        <button
          onClick={() => handleDirection("accept")}
          disabled={!!swipeDir || isPending}
          className="flex-1 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-fg)] transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
        >
          {isPending ? "Accepting…" : "Accept Back"}
        </button>
      </div>

      {/* Navigation Indicators */}
      {(hasPrevious || hasNext) && (
        <div className="flex gap-2 text-xs font-medium text-[var(--muted)]">
          {hasPrevious && (
            <button onClick={onPrevious} className="rounded px-3 py-1 hover:bg-[var(--muted-bg)]">
              ← Previous
            </button>
          )}
          {hasNext && (
            <button onClick={onNext} className="rounded px-3 py-1 hover:bg-[var(--muted-bg)]">
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
