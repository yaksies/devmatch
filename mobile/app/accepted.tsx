import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";
import { SectionBackButton } from "@/components/SectionBackButton";

export default function AcceptedScreen() {
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
        .select("target_id, created_at, profiles!swipes_target_id_fkey(display_name, headline, avatar_url)")
        .eq("swiper_id", userId)
        .eq("direction", "like")
        .order("created_at", { ascending: false });
      console.log("Current User ID:", userId);
      console.log("Raw Data from Supabase:", data);
      console.log("Supabase Error:", error);
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

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
        <SectionBackButton style={styles.backButton} />
        <Text style={styles.title}>People you accepted</Text>
        <Text style={styles.sub}>People you swiped right on.</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : items && items.length > 0 ? (
          items.map((row: any) => {
            const profile = row.profiles ?? { display_name: "Unknown", headline: "" };
            return (
              <Pressable key={row.target_id} style={styles.card} onPress={() => router.push({ pathname: "/user/[id]", params: { id: row.target_id, from: "accepted" } })}>
                <Text style={styles.name}>{profile.display_name}</Text>
                {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
              </Pressable>
            );
          })
        ) : (
          <View style={styles.blank}>
            <Text style={styles.blankTitle}>There&apos;s nothing to be seen here...</Text>
            <Text style={styles.blankSub}>No accepted people yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: { padding: 20, gap: 12 },
  backButton: { marginBottom: 4 },
  title: { color: "#f4f4f5", fontSize: 20, fontWeight: "700" },
  sub: { color: "#a1a1aa", marginTop: 6 },
  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#141418",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  name: { color: "#f4f4f5", fontWeight: "700", fontSize: 16 },
  headline: { color: "#a1a1aa", marginTop: 6 },
  blank: { flex: 1, minHeight: 420, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 10 },
  blankTitle: { color: "#f4f4f5", fontSize: 18, fontWeight: "700", textAlign: "center" },
  blankSub: { color: "#71717a", fontSize: 13, textAlign: "center", lineHeight: 18 },
});
