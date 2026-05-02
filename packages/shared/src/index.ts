export type HackathonProfile = {
  id: string;
  displayName: string;
  headline: string;
  techStack: string[];
  interests: string;
};

/** Demo deck — replace with Supabase query per hackathon. */
export const mockDiscoverDeck: HackathonProfile[] = [
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

export type { ScrapedEvent } from "./events";
export { scrapeHackathonEvents } from "./events";
