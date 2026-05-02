import Link from "next/link";
import { redirect } from "next/navigation";

import { NotificationCarousel } from "@/components/NotificationCarousel";
import { createClient } from "@/lib/supabase/server";

type Row = {
  swiper_id: string;
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: swipes } = await supabase
    .from("swipes")
    .select("swiper_id")
    .eq("target_id", user.id)
    .eq("direction", "like")
    .order("created_at", { ascending: false });

  const swiperIds = [...new Set((swipes as Row[] | null | undefined)?.map((row) => row.swiper_id) ?? [])];

  const { data: profiles } = swiperIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, headline, tech_stack, interests")
        .in("id", swiperIds)
    : { data: [] as Array<{ id: string; display_name: string; headline: string | null; tech_stack: string[] | null; interests: string | null }> };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/discover" className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {profiles && profiles.length > 0 ? "New notifications" : "Who accepted you"}
        </h1>
        <div className="w-12" />
      </div>

      <NotificationCarousel profiles={profiles ?? []} />
    </div>
  );
}