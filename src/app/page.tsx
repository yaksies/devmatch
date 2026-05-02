import Link from "next/link";
import Spotlight from "../components/Spotlight";
import SwipeDemo from "../components/SwipeDemo";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col">
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
            Hackathon teammate matching
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            DevMatch — swipe local talent before the opening keynote.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
            Participants publish a fast profile: tech stack, interests, and what
            they want to ship. Browse people at the same event, like the ones
            who complement your team, then coordinate in realtime chat.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
            >
              Open discover
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted-bg)]"
            >
              Edit your profile
            </Link>
          </div>
        </div>

        <div>
          <SwipeDemo />
        </div>
      </section>
      <Spotlight />
    </div>
  );
}
