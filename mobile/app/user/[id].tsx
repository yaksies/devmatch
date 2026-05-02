import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import { mockDiscoverDeck } from "@devmatch/shared";

type Insight = {
  summary: string;
  confidence: "low" | "medium" | "high";
  strengths: string[];
  signals: string[];
  caveats: string[];
  sources: string[];
  generatedAt: string;
};

function getWebBaseUrl() {
  const env = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim();
  if (env) {
    return env.replace(/\/$/, "");
  }

  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}

export default function UserProfile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const id = params.id ?? "";
  const from = params.from ?? "";
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCached, setAiCached] = useState(false);
  const [aiInsight, setAiInsight] = useState<Insight | null>(null);

  const mockProfile = mockDiscoverDeck.find((item) => item.id === id);

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
        .maybeSingle();

      if (!mounted) return;
      setProfile(
        data ??
          (mockProfile
            ? {
                id: mockProfile.id,
                display_name: mockProfile.displayName,
                headline: mockProfile.headline,
                tech_stack: mockProfile.techStack,
                interests: mockProfile.interests,
                avatar_url: null,
              }
            : null),
      );
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

  async function openAiInsight() {
    if (!id) return;

    setAiOpen(true);
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch(`${getWebBaseUrl()}/api/profile-analysis/${id}`, {
        cache: "no-store",
      });

      const data = (await response.json()) as {
        cached?: boolean;
        insight?: Insight;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze profile");
      }

      setAiCached(Boolean(data.cached));
      setAiInsight(data.insight ?? null);
    } catch (requestError) {
      setAiError(requestError instanceof Error ? requestError.message : "Failed to analyze profile");
    } finally {
      setAiLoading(false);
    }
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
  const isMockProfile = mockDiscoverDeck.some((item) => item.id === profile.id);

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
          {canUndo && currentUserId && !isMockProfile ? (
            <Pressable style={styles.undo} onPress={undoSwipe}>
              <Text style={styles.undoText}>Retake swipe</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.aiButton} onPress={() => void openAiInsight()}>
            <Text style={styles.aiButtonText}>Confirm with AI</Text>
          </Pressable>
        </View>
      </View>
      
      {currentUserId === null && (
        <View style={styles.loadingButtons}>
          <ActivityIndicator size="small" color="#7c3aed" />
        </View>
      )}

      <Modal visible={aiOpen} transparent animationType="fade" onRequestClose={() => setAiOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>AI profile check</Text>
                <Text style={styles.modalTitle}>{profile.display_name}</Text>
              </View>
              <Pressable onPress={() => setAiOpen(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              This summary uses the profile details they've shared plus any public GitHub info.
            </Text>

            {aiLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color="#7c3aed" />
                <Text style={styles.modalLoadingText}>Analyzing profile...</Text>
              </View>
            ) : aiError ? (
              <Text style={styles.modalError}>{aiError}</Text>
            ) : aiInsight ? (
              <ScrollView style={styles.modalBody} contentContainerStyle={{ gap: 16 }}>
                <View style={styles.summaryBox}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.sectionLabel}>Summary</Text>
                    <Text style={styles.confidencePill}>Confidence: {aiInsight.confidence}</Text>
                  </View>
                  <Text style={styles.summaryText}>{aiInsight.summary}</Text>
                </View>

                <View style={styles.modalGrid}>
                  <View style={styles.listColumn}>
                    <Text style={styles.sectionLabel}>Strengths</Text>
                    {aiInsight.strengths.map((item) => (
                      <Text key={item} style={styles.listItem}>• {item}</Text>
                    ))}
                  </View>
                  <View style={styles.listColumn}>
                    <Text style={styles.sectionLabel}>Signals</Text>
                    {aiInsight.signals.map((item) => (
                      <Text key={item} style={styles.listItem}>• {item}</Text>
                    ))}
                  </View>
                </View>

                {aiInsight.caveats.length > 0 ? (
                  <View style={styles.listColumn}>
                    <Text style={styles.sectionLabel}>Caveats</Text>
                    {aiInsight.caveats.map((item) => (
                      <Text key={item} style={[styles.listItem, styles.caveatItem]}>• {item}</Text>
                    ))}
                  </View>
                ) : null}

                <View style={styles.sourceRow}>
                  <Text style={styles.sourceTag}>{aiCached ? "Cached result" : "Fresh analysis"}</Text>
                  {aiInsight.sources.map((source) => (
                    <Text key={source} style={styles.sourceTag}>{source}</Text>
                  ))}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
  aiButton: {
    backgroundColor: "rgba(124,58,237,0.16)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.4)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  aiButtonText: { color: "#e9d5ff", fontWeight: "700", fontSize: 15 },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    maxHeight: "86%",
    backgroundColor: "#141418",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 18,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  modalKicker: { color: "#7c3aed", fontSize: 11, fontWeight: "700", letterSpacing: 1.3, textTransform: "uppercase" },
  modalTitle: { marginTop: 6, color: "#f4f4f5", fontSize: 22, fontWeight: "700" },
  modalClose: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalCloseText: { color: "#f4f4f5", fontSize: 13, fontWeight: "600" },
  modalSub: { marginTop: 12, color: "#a1a1aa", fontSize: 13, lineHeight: 19 },
  modalLoading: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 10 },
  modalLoadingText: { color: "#a1a1aa", fontSize: 13 },
  modalError: { marginTop: 18, color: "#fca5a5", fontSize: 14 },
  modalBody: { marginTop: 18 },
  summaryBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "center" },
  sectionLabel: { color: "#a1a1aa", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  confidencePill: { color: "#e9d5ff", fontSize: 11, fontWeight: "700" },
  summaryText: { marginTop: 10, color: "#f4f4f5", fontSize: 14, lineHeight: 21 },
  modalGrid: { flexDirection: "row", gap: 12 },
  listColumn: { flex: 1, gap: 8 },
  listItem: { color: "#e4e4e7", fontSize: 13, lineHeight: 19 },
  caveatItem: { color: "#d4d4d8" },
  sourceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sourceTag: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  notFound: { paddingTop: 40, alignItems: "center" },
  notFoundText: { color: "#f4f4f5", fontSize: 16, fontWeight: "600" },
  notFoundSub: { color: "#a1a1aa", marginTop: 8, fontSize: 14 },
});
