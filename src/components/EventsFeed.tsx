"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type HackathonEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  image?: string;
  url: string;
  source: "devpost" | "mlh" | "other" | "luma";
  description?: string;
};

type CountryFilter = "all" | "canada" | "us" | "other";

function classifyCountry(location: string) {
  if (
    /(?:\bcanada\b|,\s*ca\b|\bontario\b|\bquebec\b|\bbritish columbia\b|\balberta\b|\bmanitoba\b|\bsaskatchewan\b|\bnew brunswick\b|\bnova scotia\b|\bnewfoundland and labrador\b|\bprince edward island\b|\byukon\b|\bnorthwest territories\b|\bnunavut\b)/i.test(location)
  ) {
    return "canada";
  }

  if (
    /(?:\bunited states\b|\busa\b|,\s*us\b|\bcalifornia\b|\bnew york\b|\btexas\b|\bflorida\b|\bmassachusetts\b|\bwashington\b|\bnew jersey\b|\boregon\b|\bindiana\b|\bcolorado\b|\barizona\b|\bgeorgia\b|\bvirginia\b|\bmichigan\b|\billinois\b|\bpa\b)/i.test(location)
  ) {
    return "us";
  }

  return "other";
}

export function EventsFeed() {
  const [events, setEvents] = useState<HackathonEvent[]>([]);
  const [countryFilter, setCountryFilter] = useState<CountryFilter>("all");
  const [visibleCount, setVisibleCount] = useState(6);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/events", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data = (await response.json()) as { events: HackathonEvent[] };
        setEvents(data.events ?? []);
        setVisibleCount(Math.min(6, data.events?.length ?? 0));
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };

    void loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    if (countryFilter === "all") {
      return events;
    }

    return events.filter((event) => classifyCountry(event.location) === countryFilter);
  }, [countryFilter, events]);

  const visibleEvents = useMemo(
    () => filteredEvents.slice(0, visibleCount),
    [filteredEvents, visibleCount],
  );


  useEffect(() => {
    const target = observerTarget.current;
    if (!target || isLoading || filteredEvents.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        if (visibleCount < filteredEvents.length) {
          setVisibleCount((count) => Math.min(count + 3, filteredEvents.length));
          return;
        }

        setHasReachedEnd(true);
      },
      { threshold: 0.1 },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [filteredEvents.length, isLoading, visibleCount]);

  return (
    <div className="w-full bg-gradient-to-b from-[var(--surface)] to-transparent py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Upcoming hackathons
          </h2>

          <label className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--foreground)] shadow-sm">
            <span className="whitespace-nowrap text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Filter
            </span>
            <select
              value={countryFilter}
              onChange={(event) => {
                setCountryFilter(event.target.value as CountryFilter);
                setVisibleCount(6);
                setHasReachedEnd(false);
              }}
              className="bg-transparent text-sm text-[var(--foreground)] outline-none"
              aria-label="Filter hackathons by country"
            >
              <option value="all">No filter</option>
              <option value="canada">Canada</option>
              <option value="us">US</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/60 px-6 py-10 text-center">
            <p className="text-sm text-[var(--muted)]">Could not load the scraped feed.</p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              The scraper will fall back to sample items if the sites block requests.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEvents.map((event) => (
            <a
              key={event.id}
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] shadow-md transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/20"
            >
              <div className="relative flex h-full flex-col">
                <div className="relative h-1/2 min-h-[11rem] overflow-hidden">
                  {event.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.image}
                      alt={event.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[var(--surface-2)]">
                      <span className="text-sm font-semibold tracking-[0.2em] text-[var(--muted)]">
                        NO IMAGE
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                  <div className="absolute left-4 top-4 inline-flex rounded-full bg-black/35 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                    {event.source === "mlh" ? "MLH" : event.source === "devpost" ? "Devpost" : event.source === "luma" ? "Luma" : "Event"}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] transition-transform group-hover:-translate-y-0.5">
                      {event.name}
                    </h3>
                    <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                      <p>📅 {event.date}</p>
                      <p>📍 {event.location}</p>
                    </div>
                    {event.description ? (
                      <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--muted)]">
                        {event.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    Open
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div ref={observerTarget} className="mt-14 flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
              <p className="mt-4 text-sm text-[var(--muted)]">Scraping events...</p>
            </div>
          ) : hasReachedEnd ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-6 py-12 text-center">
              <p className="text-sm text-[var(--muted)]">You&apos;ve gone too far.</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                That&apos;s the end of the current feed. Try again later for more events.
              </p>
            </div>
          ) : (
            <div className="h-10" />
          )}
        </div>
      </div>
    </div>
  );
}
