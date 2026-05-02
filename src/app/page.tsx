import Link from "next/link";
import HomepageIntroGate from "../components/HomepageIntroGate";
import Spotlight from "../components/Spotlight";
import SwipeDemo from "../components/SwipeDemo";

export default function Home() {
  return (
    <HomepageIntroGate>
      <div className="relative flex flex-1 flex-col overflow-x-hidden">
        <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:min-h-[calc(100vh-3.5rem)]">
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
              <Link
                href="#about"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-transparent px-6 py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
              >
                Learn more
              </Link>
            </div>
          </div>

          <div>
            <SwipeDemo />
          </div>
        </section>

        <section
          id="about"
          className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6"
        >
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="max-w-xl">
              <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
                About DevMatch
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                A fast, social way to find teammates at hackathons.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--muted)]">
                DevMatch helps participants publish a compact profile, discover
                complementary builders nearby, and start conversations without
                the usual awkward wandering. Profiles stay focused on what matters:
                skills, interests, and what someone wants to ship this weekend.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Profiles
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  Short, focused, and easy to scan
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Highlight a stack, a one-line pitch, and the weekend project you
                  actually want to build.
                </p>
              </article>

              <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Matching
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  Swipe with intent
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Like people who fill gaps in your team, pass on the rest, and
                  keep the conversation moving in realtime chat.
                </p>
              </article>

              <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Collaboration
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  Built for team formation under pressure
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Designed to help judges see a polished product story while the
                  team is still forming around it.
                </p>
              </article>

              <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                  Realtime
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                  Profiles and chat stay in sync
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Supabase backs profiles, matches, and messages so the demo can
                  feel live even in a short judging window.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(255,255,255,0.03))] p-8 shadow-2xl sm:p-10">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-wider text-[var(--accent)]">
                Ready to try it
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
                Build your profile, swipe for teammates, and keep the app open
                while the event is still live.
              </h2>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
                Finish your profile
              </Link>
            </div>
          </div>
        </section>
        <Spotlight />
      </div>
    </HomepageIntroGate>
  );
}
