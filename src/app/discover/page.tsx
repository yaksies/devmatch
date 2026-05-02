import { DiscoverDeck } from "./discover-deck";
import { mockDiscoverDeck } from "@devmatch/shared";

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
      <DiscoverDeck initialProfiles={mockDiscoverDeck} />
    </div>
  );
}
