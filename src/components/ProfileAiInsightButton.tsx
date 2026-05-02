"use client";

import { useState } from "react";

type Insight = {
  summary: string;
  confidence: "low" | "medium" | "high";
  strengths: string[];
  signals: string[];
  caveats: string[];
  sources: string[];
  generatedAt: string;
};

type Props = {
  profileId: string;
  profileName: string;
};

export function ProfileAiInsightButton({ profileId, profileName }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);

  async function loadInsight() {
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile-analysis/${profileId}`, {
        cache: "no-store",
      });

      const data = (await response.json()) as {
        cached?: boolean;
        insight?: Insight;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to load AI insight");
      }

      setCached(Boolean(data.cached));
      setInsight(data.insight ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load AI insight");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void loadInsight()}
        className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted-bg)]"
      >
        Confirm with AI
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">AI profile check</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  {profileName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]"
              >
                Close
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              This summary uses the profile details they've shared plus any public GitHub info.
            </p>

            {loading ? (
              <p className="mt-6 text-sm text-[var(--muted)]">Analyzing profile...</p>
            ) : error ? (
              <p className="mt-6 text-sm text-red-300">{error}</p>
            ) : insight ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted-bg)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Summary</span>
                    <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                      Confidence: {insight.confidence}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{insight.summary}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Strengths</p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                      {insight.strengths.map((item) => (
                        <li key={item} className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Signals</p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                      {insight.signals.map((item) => (
                        <li key={item} className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {insight.caveats.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Caveats</p>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                      {insight.caveats.map((item) => (
                        <li key={item} className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 leading-6">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1">{cached ? "Cached result" : "Fresh analysis"}</span>
                  {insight.sources.map((source) => (
                    <span key={source} className="rounded-full border border-[var(--border)] px-2.5 py-1">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}