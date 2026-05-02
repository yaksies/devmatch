import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";

export default function UserProfile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase || !id) return setLoading(false);

      const { data } = await supabase.from("profiles").select("display_name,headline,tech_stack,interests,avatar_url").eq("id", id).single();
      if (!mounted) return;
      setProfile(data ?? null);
      setLoading(false);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function acceptBack() {
    if (!supabase || !id) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    await supabase.from("swipes").upsert({ swiper_id: userId, target_id: id, direction: "like" });
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator />
      ) : profile ? (
        <View>
          <Text style={styles.name}>{profile.display_name}</Text>
          {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}
          {profile.tech_stack ? (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              {profile.tech_stack.map((t: string) => (
                <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
              ))}
            </View>
          ) : null}
          {profile.interests ? <Text style={styles.interests}>{profile.interests}</Text> : null}

          <Pressable style={styles.accept} onPress={acceptBack}>
            <Text style={styles.acceptText}>Accept</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={{ color: "#71717a" }}>Profile not found.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: { padding: 20 },
  backButton: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 2, marginBottom: 20 },
  backText: { color: "#c7c7cc", fontSize: 14, fontWeight: "600" },
  name: { fontSize: 22, color: "#f4f4f5", fontWeight: "700" },
  headline: { marginTop: 8, color: "#a1a1aa" },
  tag: { backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  tagText: { color: "#f4f4f5" },
  interests: { marginTop: 12, color: "#e4e4e7" },
  accept: { marginTop: 18, backgroundColor: "#10b981", padding: 12, borderRadius: 10, alignItems: "center" },
  acceptText: { color: "#fff", fontWeight: "700" },
});
