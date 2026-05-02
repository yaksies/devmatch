import { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

type ChatPreviewRow = {
  room_id: string;
  partner_id: string;
  partner_name: string;
  partner_headline: string | null;
};

export default function ChatScreen() {
  const [chats, setChats] = useState<ChatPreviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadChats = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch matches
    const { data: matches } = await supabase
      .from("matches")
      .select("id, user_a, user_b")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

    if (!matches || matches.length === 0) {
      setChats([]);
      setLoading(false);
      return;
    }

    const partnerIds = matches.map(m => m.user_a === user.id ? m.user_b : m.user_a);
    const matchIds = matches.map(m => m.id);

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, headline")
      .in("id", partnerIds);

    // Fetch chat rooms
    const { data: rooms } = await supabase
      .from("chat_rooms")
      .select("id, match_id")
      .in("match_id", matchIds);

    if (!profiles || !rooms) {
      setLoading(false);
      return;
    }

    const previews: ChatPreviewRow[] = matches.map(match => {
      const partnerId = match.user_a === user.id ? match.user_b : match.user_a;
      const profile = profiles.find(p => p.id === partnerId);
      const room = rooms.find(r => r.match_id === match.id);
      
      return {
        room_id: room?.id ?? "",
        partner_id: partnerId,
        partner_name: profile?.display_name ?? "Unknown",
        partner_headline: profile?.headline ?? null,
      };
    }).filter(c => c.room_id !== "");

    setChats(previews);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.root}>
        <View style={styles.panel}>
          <Text style={styles.panelText}>
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color="#c4b5fd" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {chats.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySub}>
            Keep swiping on the Discover tab to find your crew.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.room_id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatCard}
              onPress={() => router.push(`/room/${item.room_id}?name=${encodeURIComponent(item.partner_name)}`)}
            >
              <Text style={styles.chatName}>{item.partner_name}</Text>
              {item.partner_headline ? (
                <Text style={styles.chatHeadline} numberOfLines={1}>
                  {item.partner_headline}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  panel: {
    margin: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#141418",
  },
  panelText: { color: "#71717a", fontSize: 13, textAlign: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#f4f4f5", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#a1a1aa", textAlign: "center" },
  chatCard: {
    backgroundColor: "#141418",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f4f4f5",
  },
  chatHeadline: {
    fontSize: 13,
    color: "#a1a1aa",
    marginTop: 4,
  },
});
