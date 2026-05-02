import Link from "next/link";
import { redirect } from "next/navigation";

import { NotificationCarousel } from "@/components/NotificationCarousel";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Get people who liked me
  const { data: inboundLikes } = await supabase
    .from("swipes")
    .select("swiper_id")
    .eq("target_id", user.id)
    .eq("direction", "like");

  let profiles: any[] = [];

  if (inboundLikes && inboundLikes.length > 0) {
    const potentialSwiperIds = [...new Set(inboundLikes.map((row: any) => row.swiper_id))];

    // 2. Get my swipes to those people (any direction: like or pass)
    // We only show "pending" notifications - people I haven't swiped on yet.
    const { data: outboundSwipes } = await supabase
      .from("swipes")
      .select("target_id")
      .eq("swiper_id", user.id)
      .in("target_id", potentialSwiperIds);

    const swipedIds = new Set((outboundSwipes || []).map((s: any) => s.target_id));
    const pendingSwiperIds = potentialSwiperIds.filter((id) => !swipedIds.has(id));

    if (pendingSwiperIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, display_name, headline, tech_stack, interests")
        .in("id", pendingSwiperIds);
      
      profiles = profileData || [];
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/discover" className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {profiles.length > 0 ? "New notifications" : "No new notifications"}
        </h1>
        <div className="w-12" />
      </div>

      <NotificationCarousel profiles={profiles} userId={user.id} />
    </div>
  );
}