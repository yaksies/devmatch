"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function parseStack(raw: string): string[] {
  return raw
    .split(/[,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type ProfileFormProps = {
  initialProfile?: any;
};

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || "");
  const [headline, setHeadline] = useState(initialProfile?.headline || "");
  const [techRaw, setTechRaw] = useState(
    initialProfile?.tech_stack?.join(", ") || "React, TypeScript, Figma"
  );
  const [interests, setInterests] = useState(initialProfile?.interests || "");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName,
        headline,
        tech_stack: parseStack(techRaw),
        interests,
        updated_at: new Date().toISOString(),
      });
    }

    setLoading(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  const previewTags = parseStack(techRaw);

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="displayName"
          className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
        >
          Display name
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          placeholder="How you want to appear"
          className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="headline"
          className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
        >
          One-line pitch
        </label>
        <input
          id="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Frontend + motion design"
          className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor="tech"
          className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
        >
          Tech stack
        </label>
        <input
          id="tech"
          value={techRaw}
          onChange={(e) => setTechRaw(e.target.value)}
          placeholder="Comma-separated skills"
          className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-[var(--accent)] focus:ring-2"
        />
        {previewTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {previewTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--muted-bg)] px-2.5 py-0.5 text-xs text-[var(--foreground)]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="interests"
          className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]"
        >
          What you want to build
        </label>
        <textarea
          id="interests"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          rows={4}
          placeholder="Themes, domains, or weekend goals…"
          className="mt-1.5 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-[var(--accent)] focus:ring-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save profile"}
      </button>

      {saved ? (
        <p className="text-center text-xs text-[var(--accent)] font-medium">
          Profile saved successfully!
        </p>
      ) : null}
    </form>
  );
}
