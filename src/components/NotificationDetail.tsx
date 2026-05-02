"use client";

import Link from "next/link";
import { acceptBack } from "@/app/notifications/actions";
import { useRef, useState, useEffect } from "react";

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
};

export function NotificationDetail({
  profile,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: Props) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDir, setSwipeDir] = useState<-1 | 1 | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const startX = useRef(0);
  const wheelDragX = useRef(0);
  const wheelEndTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (wheelEndTimer.current) {
        window.clearTimeout(wheelEndTimer.current);
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX.current;
    setDragX(delta);
  };

  const handleMouseUp = () => {
    finishDrag();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      wheelDragX.current += e.deltaX;
      setDragX(wheelDragX.current);

      if (wheelEndTimer.current) {
        window.clearTimeout(wheelEndTimer.current);
      }

      wheelEndTimer.current = window.setTimeout(() => {
        finishWheelGesture();
      }, 150);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0]!.clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0]!.clientX - startX.current;
    setDragX(delta);
  };

  const handleTouchEnd = () => {
    finishDrag();
  };

  const finishDrag = () => {
    setIsDragging(false);

    if (Math.abs(dragX) > 78) {
      const direction = dragX > 0 ? "accept" : "skip";
      handleDirection(direction);
      return;
    }

    setDragX(0);
  };

  const finishWheelGesture = () => {
    setIsDragging(false);

    if (Math.abs(wheelDragX.current) > 120) {
      const direction = wheelDragX.current > 0 ? "accept" : "skip";
      handleDirection(direction);
      return;
    }

    wheelDragX.current = 0;
    setDragX(0);
  };

  const handleDirection = (direction: "accept" | "skip") => {
    if (swipeDir || isProcessing) return;
    
    setSwipeDir(direction === "accept" ? 1 : -1);
    
    if (direction === "skip") {
      // Just move to next
      setTimeout(() => {
        onNext?.();
        resetState();
      }, 220);
    } else {
      // Accept back - we'll trigger the form submission
      setTimeout(() => {
        const form = document.querySelector('[data-accept-form]') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }, 50);
    }
  };

  const resetState = () => {
    setDragX(0);
    wheelDragX.current = 0;
    setSwipeDir(null);
    setIsProcessing(false);
  };

  const cardStyle = {
    transform: `translateX(${swipeDir ? (swipeDir * 460) : dragX}px) rotate(${swipeDir ? (swipeDir * 15) : (dragX / 22)}deg)`,
    opacity: swipeDir ? 0.12 : Math.max(1 - Math.abs(dragX) / 420 * 0.25, 0.75),
    transition: isDragging
      ? "none"
      : "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 240ms ease",
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Swipeable Card */}
      <div
        className="relative w-full max-w-md cursor-grab active:cursor-grabbing select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--muted-bg)] p-8 shadow-2xl shadow-black/20"
          style={cardStyle as React.CSSProperties}
        >
          {/* Notification Badge */}
          <div className="mb-6 inline-block rounded-full bg-green-500/20 px-4 py-2">
            <p className="text-sm font-semibold text-green-400">✓ They accepted you!</p>
          </div>

          {/* Profile Info */}
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {profile.display_name}
          </h2>

          {profile.headline && (
            <p className="mt-3 text-lg leading-7 text-[var(--muted)]">
              {profile.headline}
            </p>
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
            <p className="mt-6 text-sm leading-7 text-[var(--foreground)]">
              {profile.interests}
            </p>
          )}

          {/* Swipe Hints */}
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
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--muted-bg)] active:scale-95"
        >
          Skip
        </button>

        <Link
          href={`/user/${profile.id}?from=notifications`}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--muted-bg)] active:scale-95"
        >
          View Profile
        </Link>

        <form
          data-accept-form
          action={acceptBack.bind(null, profile.id)}
          className="flex-1"
          onSubmit={() => setIsProcessing(true)}
        >
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-fg)] transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
          >
            {isProcessing ? "Accepting..." : "Accept Back"}
          </button>
        </form>
      </div>

      {/* Navigation Indicators */}
      {(hasPrevious || hasNext) && (
        <div className="flex gap-2 text-xs font-medium text-[var(--muted)]">
          {hasPrevious && (
            <button
              onClick={onPrevious}
              className="rounded px-3 py-1 hover:bg-[var(--muted-bg)]"
            >
              ← Previous
            </button>
          )}
          {hasNext && (
            <button
              onClick={onNext}
              className="rounded px-3 py-1 hover:bg-[var(--muted-bg)]"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
