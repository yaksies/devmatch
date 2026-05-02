import { DiscoverDeck } from "./discover-deck";
import type { HackathonProfile } from "@/types/profile";

const mockDeck: HackathonProfile[] = [
  {
    id: "1",
    displayName: "Aisha K.",
    headline: "Frontend + design systems",
    techStack: ["React", "TypeScript", "Figma"],
    interests: "Climate data viz, accessibility-first UI, overnight coffee.",
  },
  {
    id: "2",
    displayName: "Jordan L.",
    headline: "ML infra & APIs",
    techStack: ["Python", "FastAPI", "Postgres"],
    interests: "NLP for dev tools, quick prototypes, clear docs.",
  },
  {
    id: "3",
    displayName: "Sam R.",
    headline: "Product + full-stack",
    techStack: ["Next.js", "Supabase", "UX research"],
    interests: "B2B hacks, user interviews between commits.",
  },
];

export default function DiscoverPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-lg text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Find your hackathon crew
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Swipe through participants going to the same event. Mutual likes
          become matches — then open a realtime chat.
        </p>
      </div>
      <DiscoverDeck initialProfiles={mockDeck} />
    </div>
  );
}
