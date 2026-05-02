import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { useNotifCount } from "@/components/NotifContext";

type LikeRow = {
  swiper_id: string;
  created_at: string;
  profiles: {
    display_name: string;
    headline: string | null;
    avatar_url: string | null;
  } | null;
  isMatch: boolean;
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<LikeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();
  const { refresh: refreshBadge } = useNotifCount(); // ✅ refresh badge after actions

  const load = useCallback(async () => {
    if (!supabase) return setLoading(false);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setCurrentUserId(userId);

    const { data: inboundLikes, error } = await supabase
      .from("swipes")
      .select("swiper_id, created_at, profiles(display_name, headline, avatar_url)")
      .eq("target_id", userId)
      .eq("direction", "like")
      .order("created_at", { ascending: false });

    if (error || !inboundLikes) {
      setItems([]);
      setLoading(false);
      return;
    }

    const swiperIds = inboundLikes.map((r: any) => r.swiper_id);
    const { data: outboundSwipes } = swiperIds.length
      ? await supabase
        .from("swipes")
        .select("target_id")
        .eq("swiper_id", userId)
        .in("target_id", swiperIds)
      : { data: [] };

    const swipedSet = new Set((outboundSwipes ?? []).map((r: any) => r.target_id));

    const rows: LikeRow[] = inboundLikes
      .filter((row: any) => !swipedSet.has(row.swiper_id))
      .map((row: any) => ({
        swiper_id: row.swiper_id,
        created_at: row.created_at,
        profiles: row.profiles ?? null,
        isMatch: false,
      }));

    setItems(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!supabase || !currentUserId) return;
    const client = supabase;
    const CHANNEL_NAME = "notifications-swipes";

    let channel: ReturnType<typeof client.channel>;

    // Remove any stale channel with the same name before creating a new one.
    // This prevents the "cannot add postgres_changes callbacks after subscribe()" error
    // caused by React Strict Mode double-invoking effects.
    const existing = client.getChannels().find((c: any) => c.topic === `realtime:${CHANNEL_NAME}`);
    const setup = async () => {
      if (existing) await client.removeChannel(existing);
      channel = client
        .channel(CHANNEL_NAME)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "swipes",
          filter: `target_id=eq.${currentUserId}`,
        }, () => {
          void load();
        })
        .subscribe();
    };
    void setup();

    return () => { if (channel) void client.removeChannel(channel); };
  }, [currentUserId, load]);

  async function acceptBack(targetId: string) {
    if (!supabase || !currentUserId) return;
    const client = supabase;

    const { error } = await client
      .from("swipes")
      .upsert({ swiper_id: currentUserId, target_id: targetId, direction: "like" });

    if (error) {
      console.error("Error accepting:", error.message);
      return;
    }

    // ✅ Refresh badge so the count drops immediately
    void refreshBadge();
    void load();

    const { data: match } = await client
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${currentUserId},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${currentUserId})`
      )
      .single();

    if (match) {
      const { data: room } = await client
        .from("chat_rooms")
        .select("id")
        .eq("match_id", match.id)
        .single();

      if (room) {
        const targetName = items.find((i) => i.swiper_id === targetId)?.profiles?.display_name ?? "Chat";
        router.push(`/room/${room.id}?name=${encodeURIComponent(targetName)}`);
        return;
      }
    }

    router.replace("/(tabs)/chat");
  }

  async function pass(targetId: string) {
    if (!supabase || !currentUserId) return;
    const client = supabase;

    const { error } = await client
      .from("swipes")
      .upsert({ swiper_id: currentUserId, target_id: targetId, direction: "pass" });

    if (error) {
      console.error("Error passing:", error.message);
      return;
    }

    void refreshBadge();
    void load();
  }

  async function goToChat(swiperId: string, displayName: string) {
    if (!supabase || !currentUserId) return;
    const client = supabase;

    const { data: match } = await client
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${currentUserId},user_b.eq.${swiperId}),and(user_a.eq.${swiperId},user_b.eq.${currentUserId})`
      )
      .single();

    if (match) {
      const { data: room } = await client
        .from("chat_rooms")
        .select("id")
        .eq("match_id", match.id)
        .single();

      if (room) {
        router.push(`/room/${room.id}?name=${encodeURIComponent(displayName)}`);
      }
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Who liked you</Text>
        {items.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#c4b5fd" />
      ) : items.length > 0 ? (
        items.map((row) => {
          const profile = row.profiles ?? { display_name: "Unknown", headline: null };
          return (
            <View key={row.swiper_id} style={styles.cardRow}>
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/user/${row.swiper_id}?from=notifications`)}
              >
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profile.display_name}</Text>
                  {row.isMatch && (
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchBadgeText}>✓ Matched</Text>
                    </View>
                  )}
                </View>
                {profile.headline ? (
                  <Text style={styles.headline}>{profile.headline}</Text>
                ) : null}
              </Pressable>

              <View style={styles.actionButtons}>
                <Pressable style={styles.pass} onPress={() => pass(row.swiper_id)}>
                  <Text style={styles.passText}>Skip</Text>
                </Pressable>
                <Pressable style={styles.accept} onPress={() => acceptBack(row.swiper_id)}>
                  <Text style={styles.acceptText}>Accept</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.blank}>
          <Text style={styles.blankTitle}>Nothing here yet</Text>
          <Text style={styles.blankSub}>No one has liked you yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: { padding: 20, gap: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  title: { color: "#f4f4f5", fontSize: 20, fontWeight: "700" },
  countBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  card: {
    flex: 1,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#141418",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { color: "#f4f4f5", fontWeight: "700", fontSize: 16 },
  matchBadge: {
    backgroundColor: "#10b98120",
    borderWidth: 1,
    borderColor: "#10b981",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  matchBadgeText: { color: "#10b981", fontSize: 11, fontWeight: "600" },
  headline: { color: "#a1a1aa", marginTop: 6 },
  accept: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#10b981",
    borderRadius: 10,
  },
  acceptText: { color: "#fff", fontWeight: "700" },
  pass: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#1f1f23",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  passText: { color: "#a1a1aa", fontWeight: "700" },
  actionButtons: { flexDirection: "row", gap: 8, marginTop: 12 },
  chatButton: {
    marginLeft: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#8b5cf6",
    borderRadius: 10,
  },
  chatButtonText: { color: "#fff", fontWeight: "700" },
  blank: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  blankTitle: { color: "#f4f4f5", fontSize: 18, fontWeight: "700", textAlign: "center" },
  blankSub: { color: "#71717a", fontSize: 13, textAlign: "center", lineHeight: 18 },
});