import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";

export default function UserProfile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const id = params.id ?? "";
  const from = params.from ?? "";
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (mounted) {
        setCurrentUserId(userData?.user?.id ?? null);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!supabase || !id) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,headline,tech_stack,interests,avatar_url")
        .eq("id", id)
        .single();

      if (!mounted) return;
      setProfile(data ?? null);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  async function acceptBack() {
    if (!supabase || !id || !currentUserId) return;

    await supabase
      .from("swipes")
      .upsert({ swiper_id: currentUserId, target_id: id, direction: "like" });

    router.back();
  }

  async function undoSwipe() {
    if (!supabase || !id || !currentUserId) return;

    await supabase
      .from("swipes")
      .delete()
      .eq("swiper_id", currentUserId)
      .eq("target_id", id);

    router.back();
  }

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!profile) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Profile not found</Text>
          <Text style={styles.notFoundSub}>
            This person may have left the event or deleted their profile.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const canAcceptBack = from === "notifications" && profile.id !== currentUserId;
  const canUndo = (from === "passed" || from === "accepted") && profile.id !== currentUserId;

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View>
        <Text style={styles.name}>{profile.display_name}</Text>
        {profile.headline ? <Text style={styles.headline}>{profile.headline}</Text> : null}

        {profile.tech_stack && profile.tech_stack.length > 0 ? (
          <View style={styles.tagsContainer}>
            {profile.tech_stack.map((t: string) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {profile.interests ? (
          <Text style={styles.interests}>{profile.interests}</Text>
        ) : null}

        <View style={styles.buttonRow}>
          {canAcceptBack && currentUserId ? (
            <Pressable style={styles.accept} onPress={acceptBack}>
              <Text style={styles.acceptText}>Accept back</Text>
            </Pressable>
          ) : null}
          {canUndo && currentUserId ? (
            <Pressable style={styles.undo} onPress={undoSwipe}>
              <Text style={styles.undoText}>Retake swipe</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      
      {currentUserId === null && (
        <View style={styles.loadingButtons}>
          <ActivityIndicator size="small" color="#7c3aed" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: { padding: 20 },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginBottom: 20,
  },
  backText: { color: "#c7c7cc", fontSize: 14, fontWeight: "600" },
  name: { fontSize: 22, color: "#f4f4f5", fontWeight: "700" },
  headline: { marginTop: 8, color: "#a1a1aa", fontSize: 15 },
  tagsContainer: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  tag: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: { color: "#f4f4f5", fontSize: 13 },
  interests: { marginTop: 12, color: "#e4e4e7", fontSize: 14, lineHeight: 20 },
  buttonRow: { marginTop: 18, gap: 10 },
  loadingButtons: { marginTop: 18, alignItems: "center" },
  accept: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  undo: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  undoText: { color: "#f4f4f5", fontWeight: "700", fontSize: 15 },
  notFound: { paddingTop: 40, alignItems: "center" },
  notFoundText: { color: "#f4f4f5", fontSize: 16, fontWeight: "600" },
  notFoundSub: { color: "#a1a1aa", marginTop: 8, fontSize: 14 },
});
