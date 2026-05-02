import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { mockDiscoverDeck } from "@devmatch/shared";

import { SectionBackButton } from "@/components/SectionBackButton";
import { supabase } from "@/lib/supabase";

type ProfileRecord = {
    id: string;
    display_name: string | null;
    headline: string | null;
    tech_stack: string[] | null;
    interests: string | null;
    discord: string | null;
    email: string | null;
    linkedin: string | null;
    github: string | null;
    projects: string | null;
};

type Props = {
    id: string;
    from?: string;
};

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

function isUrl(value: string) {
    return /^https?:\/\//i.test(value) || /^www\./i.test(value);
}

function normalizeUrl(value: string) {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function openUrl(value: string) {
    void Linking.openURL(normalizeUrl(value));
}

function openEmail(value: string) {
    void Linking.openURL(`mailto:${value}`);
}

function RichText({ text, style }: { text: string; style: any }) {
    const parts = text.split(/(https?:\/\/[^\s]+|www\.[^\s]+)/g);

    return (
        <Text style={style}>
            {parts.map((part, index) =>
                isUrl(part) ? (
                    <Text key={`${part}-${index}`} onPress={() => openUrl(part)} style={styles.linkText} suppressHighlighting>
                        {part}
                    </Text>
                ) : (
                    <Text key={`${part}-${index}`}>{part}</Text>
                ),
            )}
        </Text>
    );
}

export function MobileProfileDetail({ id, from }: Props) {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [aiOpen, setAiOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiCached, setAiCached] = useState(false);
    const [aiInsight, setAiInsight] = useState<Insight | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadCurrentUser() {
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data: userData } = await supabase.auth.getUser();
            if (mounted) {
                setCurrentUserId(userData?.user?.id ?? null);
            }
        }

        void loadCurrentUser();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            if (!supabase || !id) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from("profiles")
                .select("id, display_name, headline, tech_stack, interests, discord, email, linkedin, github, projects")
                .eq("id", id)
                .maybeSingle();

            if (!mounted) return;

            const mockProfile = mockDiscoverDeck.find((item) => item.id === id);

            setProfile(
                data ??
                (mockProfile
                    ? {
                        id: mockProfile.id,
                        display_name: mockProfile.displayName,
                        headline: mockProfile.headline,
                        tech_stack: mockProfile.techStack,
                        interests: mockProfile.interests,
                        discord: null,
                        email: null,
                        linkedin: null,
                        github: null,
                        projects: null,
                    }
                    : null),
            );
            setLoading(false);
        }

        void loadProfile();

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
            <SafeAreaView style={styles.root} edges={["top"]}>
                <SectionBackButton style={styles.backButton} />
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={styles.root} edges={["top"]}>
                <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
                    <SectionBackButton style={styles.backButton} />
                    <View style={styles.card}>
                        <Text style={styles.emptyTitle}>Profile not found</Text>
                        <Text style={styles.emptyText}>
                            This person may have left the event or deleted their profile.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const canAcceptBack = from === "notifications" && profile.id !== currentUserId;
    const canUndo = (from === "passed" || from === "accepted") && profile.id !== currentUserId;

    return (
        <SafeAreaView style={styles.root} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.scroll} style={styles.root}>
                <SectionBackButton style={styles.backButton} />

                <View style={styles.card}>
                    <Text style={styles.kicker}>Hackathon profile</Text>
                    <Text style={styles.name}>{profile.display_name ?? "Unknown"}</Text>
                    {profile.headline ? <RichText text={profile.headline} style={styles.headline} /> : null}

                    {profile.tech_stack && profile.tech_stack.length > 0 ? (
                        <View style={styles.tags}>
                            {profile.tech_stack.map((tag) => (
                                <View key={tag} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    {profile.interests ? <RichText text={profile.interests} style={styles.sectionText} /> : null}

                    {profile.projects ? (
                        <View style={styles.sectionBlock}>
                            <Text style={styles.sectionLabel}>Projects & Experience</Text>
                            <RichText text={profile.projects} style={styles.sectionText} />
                        </View>
                    ) : null}

                    <View style={styles.socialGrid}>
                        {profile.github ? (
                            <View style={styles.socialItem}>
                                <Text style={styles.socialLabel}>GitHub</Text>
                                <RichText text={profile.github} style={styles.socialValue} />
                            </View>
                        ) : null}
                        {profile.linkedin ? (
                            <View style={styles.socialItem}>
                                <Text style={styles.socialLabel}>LinkedIn</Text>
                                <RichText text={profile.linkedin} style={styles.socialValue} />
                            </View>
                        ) : null}
                        {profile.discord ? (
                            <View style={styles.socialItem}>
                                <Text style={styles.socialLabel}>Discord</Text>
                                <RichText text={profile.discord} style={styles.socialValue} />
                            </View>
                        ) : null}
                        {profile.email ? (
                            <View style={styles.socialItem}>
                                <Text style={styles.socialLabel}>Email</Text>
                                <Text style={styles.socialValue} onPress={() => openEmail(profile.email ?? "")} suppressHighlighting>
                                    {profile.email}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.actions}>
                        <Pressable style={styles.aiAction} onPress={() => void openAiInsight()}>
                            <Text style={styles.aiActionText}>Confirm with AI</Text>
                        </Pressable>
                        {canAcceptBack && currentUserId ? (
                            <Pressable style={styles.primaryAction} onPress={acceptBack}>
                                <Text style={styles.primaryActionText}>Accept back</Text>
                            </Pressable>
                        ) : null}
                        {canUndo && currentUserId ? (
                            <Pressable style={styles.secondaryAction} onPress={undoSwipe}>
                                <Text style={styles.secondaryActionText}>Retake swipe</Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>
            </ScrollView>

            <Modal visible={aiOpen} transparent animationType="fade" onRequestClose={() => setAiOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalKicker}>AI profile check</Text>
                                <Text style={styles.modalTitle}>{profile?.display_name ?? "Profile"}</Text>
                            </View>
                            <Pressable onPress={() => setAiOpen(false)} style={styles.modalClose}>
                                <Text style={styles.modalCloseText}>Close</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.modalSub}>
                            This summary uses the profile details they&apos;ve shared plus any public GitHub info.
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#0c0c0f" },
    scroll: { padding: 16, paddingBottom: 28, maxWidth: 480, width: "100%", alignSelf: "center" },
    backButton: { marginBottom: 8 },
    loading: { flex: 1, minHeight: 420, alignItems: "center", justifyContent: "center" },
    card: {
        backgroundColor: "#141418",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        padding: 18,
    },
    kicker: { color: "#7c3aed", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
    name: { marginTop: 10, color: "#f4f4f5", fontSize: 24, fontWeight: "700", lineHeight: 30 },
    headline: { marginTop: 8, color: "#a1a1aa", fontSize: 15, lineHeight: 22 },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
    tag: {
        backgroundColor: "rgba(255,255,255,0.06)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    tagText: { color: "#f4f4f5", fontSize: 12, fontWeight: "600" },
    sectionBlock: { marginTop: 18 },
    sectionLabel: { color: "#a1a1aa", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
    sectionText: { marginTop: 8, color: "#e4e4e7", fontSize: 14, lineHeight: 21 },
    socialGrid: { marginTop: 18, gap: 12 },
    socialItem: {
        padding: 12,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    socialLabel: { color: "#a1a1aa", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
    socialValue: { marginTop: 4, color: "#f4f4f5", fontSize: 13, lineHeight: 18 },
    linkText: {
        color: "#93c5fd",
        textDecorationLine: "underline",
    },
    actions: { marginTop: 18, gap: 10 },
    aiAction: {
        backgroundColor: "rgba(124,58,237,0.16)",
        borderWidth: 1,
        borderColor: "rgba(124,58,237,0.4)",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    aiActionText: { color: "#e9d5ff", fontSize: 15, fontWeight: "700" },
    primaryAction: {
        backgroundColor: "#10b981",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    primaryActionText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    secondaryAction: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    secondaryActionText: { color: "#f4f4f5", fontSize: 15, fontWeight: "700" },
    emptyTitle: { color: "#f4f4f5", fontSize: 18, fontWeight: "700" },
    emptyText: { marginTop: 8, color: "#a1a1aa", fontSize: 14, lineHeight: 20 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        padding: 16,
    },
    modalCard: {
        maxHeight: "86%",
        backgroundColor: "#141418",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        padding: 16,
    },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    modalKicker: { color: "#7c3aed", fontSize: 11, fontWeight: "700", letterSpacing: 1.3, textTransform: "uppercase" },
    modalTitle: { marginTop: 6, color: "#f4f4f5", fontSize: 20, fontWeight: "700" },
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
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    summaryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    confidencePill: {
        backgroundColor: "rgba(124,58,237,0.16)",
        color: "#e9d5ff",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        fontSize: 11,
        fontWeight: "700",
        overflow: "hidden",
    },
    summaryText: { marginTop: 12, color: "#f4f4f5", fontSize: 14, lineHeight: 21 },
    modalGrid: { flexDirection: "row", gap: 12 },
    listColumn: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        padding: 12,
        gap: 8,
    },
    listItem: { color: "#e4e4e7", fontSize: 13, lineHeight: 18 },
    caveatItem: { color: "#fca5a5" },
    sourceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    sourceTag: {
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "#f4f4f5",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 11,
        fontWeight: "600",
        overflow: "hidden",
    },
});
