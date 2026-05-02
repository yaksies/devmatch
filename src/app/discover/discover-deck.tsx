"use client";

import type { HackathonProfile } from "@devmatch/shared";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  initialProfiles: HackathonProfile[];
};

export function DiscoverDeck({ initialProfiles }: Props) {
  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPromotingNext, setIsPromotingNext] = useState(false);
  const [swipeDir, setSwipeDir] = useState<-1 | 1 | null>(null);

  const startX = useRef(0);
  const wheelDragX = useRef(0);
  const wheelEndTimer = useRef<number | null>(null);
  const swipeCooldownUntil = useRef(0);

  const current = initialProfiles[index];
  const next = initialProfiles[index + 1];

  useEffect(() => {
    return () => {
      if (wheelEndTimer.current) {
        window.clearTimeout(wheelEndTimer.current);
      }
    };
  }, []);

  const commitSwipe = async (direction: "like" | "pass") => {
    if (!current || swipeDir) return;

    swipeCooldownUntil.current = Date.now() + 320;
    setSwipeDir(direction === "like" ? 1 : -1);
    setIsPromotingNext(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("swipes").insert({
        swiper_id: user.id,
        target_id: current.id,
        direction,
      });
    }

    window.setTimeout(() => {
      setReviewed((n) => n + 1);
      setIndex((i) => i + 1);
      setDragX(0);
      wheelDragX.current = 0;
      setSwipeDir(null);
      setIsPromotingNext(false);
    }, 220);
  };

  const finishDrag = () => {
    setIsDragging(false);

    if (Math.abs(dragX) > 78) {
      void commitSwipe(dragX > 0 ? "like" : "pass");
      return;
    }

    setDragX(0);
    setIsPromotingNext(false);
  };

  const finishWheelGesture = () => {
    setIsDragging(false);

    if (Math.abs(wheelDragX.current) > 120) {
      void commitSwipe(wheelDragX.current > 0 ? "like" : "pass");
      return;
    }

    wheelDragX.current = 0;
    setDragX(0);
    setIsPromotingNext(false);
  };

  const cardStyle = useMemo(() => {
    const x = swipeDir ? swipeDir * 460 : dragX;
    const rotation = x / 22;
    const opacity = swipeDir ? 0.12 : 1 - Math.min(Math.abs(x) / 420, 0.25);

    return {
      transform: `translateX(${x}px) rotate(${rotation}deg)`,
      opacity,
      transition: isDragging
        ? "none"
        : "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 240ms ease",
    };
  }, [dragX, isDragging, swipeDir]);

  const nextCardStyle = useMemo(() => {
    const liftProgress = isPromotingNext ? 1 : Math.min(Math.abs(dragX) / 160, 1);
    const y = 40 - liftProgress * 40;
    const scale = 0.88 + liftProgress * 0.12;
    const opacity = 0.46 + liftProgress * 0.54;

    return {
      transform: `translateY(${y}px) scale(${scale})`,
      opacity,
      zIndex: isPromotingNext ? 20 : 0,
      transformOrigin: "center bottom",
      boxShadow: isPromotingNext
        ? "0 28px 70px rgba(0,0,0,0.42)"
        : "0 10px 24px rgba(0,0,0,0.22)",
      transition: isDragging
        ? "none"
        : "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 280ms ease",
    };
  }, [dragX, isDragging, isPromotingNext]);

  const indicatorOpacity = Math.min(Math.abs(dragX) / 70, 1);
  const showPass = dragX < -8;
  const showLike = dragX > 8;

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center">
        <p className="text-lg font-medium text-[var(--foreground)]">
          You&apos;re caught up
        </p>
        <p className="max-w-sm text-sm text-[var(--muted)]">
          Wire this view to Supabase to load real participants for your
          hackathon.
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg shadow-black/20"
      onWheel={(event) => {
        if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;
        event.preventDefault();
        if (Date.now() < swipeCooldownUntil.current) return;
        if (swipeDir) return;

        wheelDragX.current = Math.max(
          -260,
          Math.min(260, wheelDragX.current - event.deltaX)
        );
        setDragX(wheelDragX.current);
        setIsDragging(true);

        if (wheelEndTimer.current) {
          window.clearTimeout(wheelEndTimer.current);
        }

        wheelEndTimer.current = window.setTimeout(() => {
          finishWheelGesture();
        }, 110);
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--accent-soft),transparent_55%)] opacity-90" />

        <article
          style={nextCardStyle}
          className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-[#17171b] p-5 shadow-xl"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Up next
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {next?.displayName}
          </h3>
          {next?.headline ? (
            <p className="mt-2 text-sm text-[var(--muted)]">{next.headline}</p>
          ) : null}
        </article>

        <article
          style={cardStyle}
          className="absolute inset-x-4 bottom-4 relative rounded-2xl border border-white/15 bg-[#1f1f25] p-6 shadow-2xl"
          onPointerDown={(event) => {
            if (event.button !== 0 && event.pointerType === "mouse") return;
            event.currentTarget.setPointerCapture(event.pointerId);
            startX.current = event.clientX;
            setIsDragging(true);
            setIsPromotingNext(false);
          }}
          onPointerMove={(event) => {
            if (!isDragging || swipeDir) return;
            setDragX(event.clientX - startX.current);
          }}
          onPointerUp={() => finishDrag()}
          onPointerCancel={() => finishDrag()}
        >
          <div className="pointer-events-none absolute left-5 right-5 top-5 flex items-center justify-between">
            <div
              className="rounded-full border border-rose-400/50 bg-rose-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200"
              style={{ opacity: showPass ? indicatorOpacity : 0 }}
            >
              Pass
            </div>
            <div
              className="rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200"
              style={{ opacity: showLike ? indicatorOpacity : 0 }}
            >
              Like
            </div>
          </div>

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
        </article>
      </div>

      {reviewed > 0 ? (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          {reviewed} reviewed — swipe left or right to continue
        </p>
      ) : null}
    </div>
  );
}
