import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

import { ChatPanel } from "@/app/chat/ChatPanel";
import { createClient } from "@/lib/supabase/server";
import { ChatSidebar } from "@/components/ChatSidebar";

type MatchRow = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

type RoomRow = {
  id: string;
  match_id: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
  headline: string | null;
};

type MessageRow = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function getPartnerId(match: MatchRow, userId: string) {
  return match.user_a === userId ? match.user_b : match.user_a;
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const resolvedParams = await searchParams;
  const requestedPartnerId = Array.isArray(resolvedParams.with)
    ? resolvedParams.with[0]
    : resolvedParams.with;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: matchesData } = await supabase
    .from("matches")
    .select("id, user_a, user_b, created_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const matches = (matchesData ?? []) as MatchRow[];
  const partnerIds: string[] = matches.length
    ? [...new Set(matches.map((match) => getPartnerId(match, user.id)))]
    : [];

  const { data: profileData } = partnerIds.length
    ? await supabase
      .from("profiles")
      .select("id, display_name, headline")
      .in("id", partnerIds)
    : { data: [] as ProfileRow[] };

  const { data: roomData } = matches.length
    ? await supabase
      .from("chat_rooms")
      .select("id, match_id")
      .in("match_id", matches.map((match) => match.id))
    : { data: [] as RoomRow[] };

  const profileMap = new Map((profileData ?? []).map((profile) => [profile.id, profile]));
  const roomMap = new Map((roomData ?? []).map((room) => [room.match_id, room]));

  const selectedPartnerId =
    requestedPartnerId && partnerIds.includes(requestedPartnerId)
      ? requestedPartnerId
      : undefined;

  const selectedMatch = selectedPartnerId
    ? matches.find((match) => getPartnerId(match, user.id) === selectedPartnerId)
    : undefined;
  const selectedRoom = selectedMatch ? roomMap.get(selectedMatch.id) : undefined;
  const selectedProfile = selectedPartnerId ? profileMap.get(selectedPartnerId) : undefined;

  const { data: messageData } = selectedRoom
    ? await supabase
      .from("chat_messages")
      .select("id, room_id, sender_id, body, created_at")
      .eq("room_id", selectedRoom.id)
      .order("created_at", { ascending: true })
    : { data: [] as MessageRow[] };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-start">
      <aside className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl shadow-black/10 lg:max-w-sm">
        <ChatSidebar
          initialPartnerIds={partnerIds ?? []}
          initialProfiles={profileData ?? []}
          userId={user.id}
          selectedPartnerId={selectedPartnerId}
        />
      </aside>

      <section className="flex h-[640px] max-h-[640px] flex-1 flex-col rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl shadow-black/10 sm:p-6 lg:h-[calc(100vh-10rem)] lg:max-h-[calc(100vh-10rem)]">
        {selectedPartnerId && selectedProfile && selectedRoom ? (
          <>
            <div className="border-b border-[var(--border)] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Active room
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                {selectedProfile.display_name}
              </h2>
              {selectedProfile.headline ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {selectedProfile.headline}
                </p>
              ) : null}
            </div>

            <ChatPanel
              roomId={selectedRoom.id}
              currentUserId={user.id}
              initialMessages={messageData ?? []}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-[1.75rem] border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-8 py-16 text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Your matches will show up here
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Open Discover, like someone who also likes you back, and this
                panel will turn into a live conversation.
              </p>
              <Link
                href="/discover"
                className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
              >
                Discover people
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}