import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";

export default function NotificationsScreen() {
  const [items, setItems] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase) return setLoading(false);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("swipes")
        .select("swiper_id, created_at, profiles(display_name, headline, avatar_url)")
        .eq("target_id", userId)
        .eq("direction", "like")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setItems([]);
      } else {
        setItems(data ?? []);
      }
      setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function acceptBack(targetId: string) {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    // insert a like as the current user toward the swiper
    await supabase.from("swipes").upsert({ swiper_id: userId, target_id: targetId, direction: "like" });

    // navigate to matches or refresh
    router.replace("/accepted");
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Who liked you</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : items && items.length > 0 ? (
        items.map((row: any) => {
          const profile = row.profiles ?? { display_name: "Unknown", headline: "" };
          const id = row.swiper_id;
          return (
            <View key={id} style={styles.cardRow}>
              <Pressable style={styles.card} onPress={() => router.push(`/user/${id}?from=notifications`)}>
                <Text style={styles.name}>{profile.display_name}</Text>
                {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
              </Pressable>
              <Pressable style={styles.accept} onPress={() => acceptBack(id)}>
                <Text style={styles.acceptText}>Accept</Text>
              </Pressable>
            </View>
          );
        })
      ) : (
        <View style={styles.blank}>
          <Text style={styles.blankTitle}>There&apos;s nothing to be seen here...</Text>
          <Text style={styles.blankSub}>No one has liked you yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: { padding: 20, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { padding: 8 },
  backText: { color: "#c7c7cc", fontSize: 18 },
  title: { color: "#f4f4f5", fontSize: 20, fontWeight: "700" },
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
  name: { color: "#f4f4f5", fontWeight: "700", fontSize: 16 },
  headline: { color: "#a1a1aa", marginTop: 6 },
  accept: {
    marginLeft: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#10b981",
    borderRadius: 10,
  },
  acceptText: { color: "#fff", fontWeight: "700" },
  blank: { flex: 1, minHeight: 420, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 10 },
  blankTitle: { color: "#f4f4f5", fontSize: 18, fontWeight: "700", textAlign: "center" },
  blankSub: { color: "#71717a", fontSize: 13, textAlign: "center", lineHeight: 18 },
});
