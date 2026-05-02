import { DiscoverDeck } from "./discover-deck";
import { EventsFeed } from "@/components/EventsFeed";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { HackathonProfile } from "@devmatch/shared";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch swipes by this user to exclude them from the deck
  const { data: swipes } = await supabase
    .from("swipes")
    .select("target_id")
    .eq("swiper_id", user.id);
    
  const swipedIds = new Set((swipes || []).map((s) => s.target_id));
  swipedIds.add(user.id); // Also exclude themselves
  
  // Fetch remaining profiles
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*");
    
  const profiles: HackathonProfile[] = (allProfiles || [])
    .filter((p) => !swipedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      displayName: p.display_name,
      headline: p.headline || "",
      techStack: p.tech_stack || [],
      interests: p.interests || "",
    }));

  return (
    <div className="relative w-full">
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
        <DiscoverDeck initialProfiles={profiles} />
      </div>
      <EventsFeed />
    </div>
  );
}
