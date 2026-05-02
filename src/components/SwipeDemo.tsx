"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DemoProfile = {
  name: string;
  role: string;
  stack: string;
  vibe: string;
};

const DEMO_PROFILES: DemoProfile[] = [
  {
    name: "Ava Lin",
    role: "Frontend + Product",
    stack: "Next.js, Tailwind, Figma",
    vibe: "Fast UI prototypes and polished demos",
  },
  {
    name: "Noah Patel",
    role: "Backend + AI",
    stack: "Python, FastAPI, RAG",
    vibe: "MVP today, scalability tomorrow",
  },
  {
    name: "Mila Rodriguez",
    role: "Mobile + Realtime",
    stack: "Expo, Supabase, WebSockets",
    vibe: "Ships smooth mobile flows under pressure",
  },
];

export default function SwipeDemo() {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDir, setSwipeDir] = useState<-1 | 1 | null>(null);

  const startX = useRef(0);
  const wheelDragX = useRef(0);
  const wheelEndTimer = useRef<number | null>(null);
  const swipeCooldownUntil = useRef(0);

  const current = DEMO_PROFILES[index % DEMO_PROFILES.length];
  const next = DEMO_PROFILES[(index + 1) % DEMO_PROFILES.length];

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

  useEffect(() => {
    return () => {
      if (wheelEndTimer.current) {
        window.clearTimeout(wheelEndTimer.current);
      }
    };
  }, []);

  const commitSwipe = (dir: -1 | 1) => {
    if (swipeDir) return;

    swipeCooldownUntil.current = Date.now() + 320;
    setSwipeDir(dir);
    window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % DEMO_PROFILES.length);
      setDragX(0);
      wheelDragX.current = 0;
      setSwipeDir(null);
    }, 220);
  };

  const finishDrag = () => {
    setIsDragging(false);

    if (Math.abs(dragX) > 78) {
      commitSwipe(dragX > 0 ? 1 : -1);
      return;
    }

    setDragX(0);
  };

  const finishWheelGesture = () => {
    setIsDragging(false);

    if (Math.abs(wheelDragX.current) > 120) {
      commitSwipe(wheelDragX.current > 0 ? 1 : -1);
      return;
    }

    wheelDragX.current = 0;
    setDragX(0);
  };

  return (
    <div
      className="mx-auto w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)]/70 p-4 backdrop-blur"
      onWheel={(event) => {
        if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) return;
        event.preventDefault();
        if (Date.now() < swipeCooldownUntil.current) return;
        if (swipeDir) return;

        // On most trackpads: positive deltaX is a leftward gesture.
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
      <p className="px-2 pb-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        Interactive Demo
      </p>

      <div className="relative h-[420px] touch-pan-y overflow-hidden rounded-2xl bg-black/20 p-2">
        <div className="absolute inset-2 rounded-2xl border border-white/10 bg-white/[0.02]" />

        <div className="absolute inset-0 flex items-center justify-center">
          <article className="h-[320px] w-[90%] max-w-[320px] rounded-2xl border border-white/10 bg-[#17171b] p-5 opacity-70">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)]">Up next</p>
            <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{next.name}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{next.role}</p>
            <p className="mt-5 text-sm text-[var(--muted)]">{next.stack}</p>
          </article>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <article
            style={cardStyle}
            className="h-[330px] w-[92%] max-w-[330px] rounded-2xl border border-white/15 bg-[#1f1f25] p-6 shadow-2xl"
            onPointerDown={(event) => {
              if (event.button !== 0 && event.pointerType === "mouse") return;
              event.currentTarget.setPointerCapture(event.pointerId);
              startX.current = event.clientX;
              setIsDragging(true);
            }}
            onPointerMove={(event) => {
              if (!isDragging || swipeDir) return;
              setDragX(event.clientX - startX.current);
            }}
            onPointerUp={() => finishDrag()}
            onPointerCancel={() => finishDrag()}
          >
            <p className="text-xs uppercase tracking-widest text-[var(--accent)]">Available now</p>
            <h3 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{current.name}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">{current.role}</p>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Stack</p>
              <p className="mt-1 text-sm text-[var(--foreground)]">{current.stack}</p>
            </div>

            <p className="mt-4 text-sm text-[var(--muted)]">{current.vibe}</p>

            <div className="mt-6 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Swipe left to pass</span>
              <span>Swipe right to connect</span>
            </div>
          </article>
        </div>
      </div>

      <p className="px-2 pt-4 text-xs text-[var(--muted)]">
        Touch/drag on mobile. On web, hover this panel and use a two-finger
        horizontal swipe on your trackpad.
      </p>
    </div>
  );
}
