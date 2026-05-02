import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Link, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { supabase } from "@/lib/supabase";

function parseStack(raw: string): string[] {
    return raw
        .split(/[,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

export default function ProfileScreen() {
    const [displayName, setDisplayName] = useState("");
    const [headline, setHeadline] = useState("");
    const [techRaw, setTechRaw] = useState("React, TypeScript, Figma");
    const [interests, setInterests] = useState("");
    const [discord, setDiscord] = useState("");
    const [email, setEmail] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [github, setGithub] = useState("");
    const [projects, setProjects] = useState("");
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [hasUser, setHasUser] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const router = useRouter();

    const tags = parseStack(techRaw);

    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            if (!supabase) {
                setMessage("Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env.");
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                if (mounted) {
                    setHasUser(false);
                }
                return;
            }

            if (mounted) {
                setHasUser(true);
            }

            const { count } = await supabase
                .from("swipes")
                .select("id", { count: "exact", head: true })
                .eq("target_id", user.id)
                .eq("direction", "like");

            if (mounted) {
                setNotificationCount(count ?? 0);
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("display_name, headline, tech_stack, interests, discord, email, linkedin, github, projects")
                .eq("id", user.id)
                .single();

            if (profile && mounted) {
                setDisplayName(profile.display_name ?? "");
                setHeadline(profile.headline ?? "");
                setTechRaw((profile.tech_stack ?? []).join(", ") || "React, TypeScript, Figma");
                setInterests(profile.interests ?? "");
                setDiscord(profile.discord ?? "");
                setEmail(profile.email ?? "");
                setLinkedin(profile.linkedin ?? "");
                setGithub(profile.github ?? "");
                setProjects(profile.projects ?? "");
            }
        }

        loadProfile();

        const {
            data: { subscription },
        } = supabase?.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;
            setHasUser(Boolean(session?.user));
            if (!session?.user) {
                setMessage("You are signed out.");
            }
        }) ?? { data: { subscription: { unsubscribe: () => undefined } } };

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    async function onSignOut() {
        if (!supabase) {
            setMessage("Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env.");
            return;
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
            setMessage(error.message);
            return;
        }

        setHasUser(false);
        setMessage("Signed out.");
    }

    async function onSave() {
        if (!supabase) {
            setMessage("Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env.");
            return;
        }

        setLoading(true);
        setMessage(null);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            setHasUser(false);
            setMessage("Log in first so your profile can be saved to Supabase.");
            return;
        }

        setHasUser(true);

        const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            display_name: displayName,
            headline,
            tech_stack: tags,
            interests,
            discord,
            email,
            linkedin,
            github,
            projects,
            updated_at: new Date().toISOString(),
        });

        setLoading(false);

        if (error) {
            console.error("Error saving profile:", error);
            setMessage("Failed to save profile: " + error.message);
            return;
        }

        setSaved(true);
        setMessage("Profile saved to Supabase.");
        setTimeout(() => setSaved(false), 2200);
    }

    return (
        <SafeAreaView style={styles.root} edges={["top"]}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scroll}
            >
                <View style={styles.headerActions}>
                    <Pressable style={styles.headerIcon} onPress={() => router.push("/notifications")}>
                        <FontAwesome
                            name={notificationCount > 0 ? "heart" : "heart-o"}
                            size={18}
                            color={notificationCount > 0 ? "#ff6b6b" : "rgba(255,255,255,0.92)"}
                        />
                    </Pressable>
                </View>
                <Text style={styles.title}>Your hackathon profile</Text>
                <Text style={styles.sub}>
                    This is what others see while swiping. Keep it short and specific.
                </Text>

                {!hasUser ? (
                    <View style={styles.notice}>
                        <Text style={styles.noticeText}>
                            Log in to persist this profile to Supabase.
                        </Text>
                        <Link href="/auth" asChild>
                            <Pressable style={styles.noticeButton}>
                                <Text style={styles.noticeButtonText}>Go to log in / sign up</Text>
                            </Pressable>
                        </Link>
                    </View>
                ) : null}

                {message ? <Text style={styles.message}>{message}</Text> : null}

                <View style={styles.card}>
                    <Text style={[styles.label, styles.labelFirst]}>Display name</Text>
                    <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="How you want to appear"
                        placeholderTextColor="#71717a"
                        style={styles.input}
                    />

                    <Text style={styles.label}>One-line pitch</Text>
                    <TextInput
                        value={headline}
                        onChangeText={setHeadline}
                        placeholder="e.g. Frontend + motion design"
                        placeholderTextColor="#71717a"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Tech stack</Text>
                    <TextInput
                        value={techRaw}
                        onChangeText={setTechRaw}
                        placeholder="Comma-separated skills"
                        placeholderTextColor="#71717a"
                        style={styles.input}
                    />
                    {tags.length > 0 ? (
                        <View style={styles.tags}>
                            {tags.map((t) => (
                                <View key={t} style={styles.tag}>
                                    <Text style={styles.tagText}>{t}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    <Text style={styles.label}>What you want to build</Text>
                    <TextInput
                        value={interests}
                        onChangeText={setInterests}
                        placeholder="Themes, domains, or weekend goals…"
                        placeholderTextColor="#71717a"
                        multiline
                        style={[styles.input, styles.textarea]}
                    />

                    <Text style={styles.label}>Discord username</Text>
                    <TextInput
                        value={discord}
                        onChangeText={setDiscord}
                        placeholder="yourname#1234 or yourname (optional)"
                        placeholderTextColor="#71717a"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com (optional)"
                        placeholderTextColor="#71717a"
                        keyboardType="email-address"
                        style={styles.input}
                    />

                    <Text style={styles.label}>LinkedIn</Text>
                    <TextInput
                        value={linkedin}
                        onChangeText={setLinkedin}
                        placeholder="linkedin.com/in/yourprofile (optional)"
                        placeholderTextColor="#71717a"
                        style={styles.input}
                    />

                    <Text style={styles.label}>GitHub</Text>
                    <TextInput
                        value={github}
                        onChangeText={setGithub}
                        placeholder="github.com/yourprofile (optional)"
                        placeholderTextColor="#71717a"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Previous projects & experience</Text>
                    <TextInput
                        value={projects}
                        onChangeText={setProjects}
                        placeholder="Projects, internships, hackathons, or anything else not on your resume…"
                        placeholderTextColor="#71717a"
                        multiline
                        style={[styles.input, styles.textarea]}
                    />

                    <Text style={styles.label}>Resume</Text>
                    <View style={styles.resumeNote}>
                        <Text style={styles.resumeNoteText}>
                            Resume uploads are not yet available on mobile. To add a resume, use the web app or link to it via email/Discord.
                        </Text>
                    </View>

                    <Pressable style={styles.save} onPress={onSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fafafa" />
                        ) : (
                            <Text style={styles.saveText}>Save profile</Text>
                        )}
                    </Pressable>
                    {hasUser ? (
                        <Pressable style={styles.signOut} onPress={onSignOut}>
                            <Text style={styles.signOutText}>Sign out</Text>
                        </Pressable>
                    ) : null}
                    {saved ? <Text style={styles.saved}>Profile saved successfully!</Text> : null}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#0c0c0f" },
    scroll: { padding: 20, paddingBottom: 56, maxWidth: 480, width: "100%", alignSelf: "center" },
    headerActions: { position: "absolute", right: 20, top: 20, zIndex: 40 },
    headerIcon: { padding: 8, backgroundColor: "transparent", borderRadius: 8 },
    title: { color: "#f4f4f5", fontSize: 22, fontWeight: "700" },
    sub: { marginTop: 8, color: "#a1a1aa", fontSize: 14, lineHeight: 20, marginBottom: 20 },
    notice: {
        backgroundColor: "rgba(124,58,237,0.12)",
        borderWidth: 1,
        borderColor: "rgba(124,58,237,0.25)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        gap: 12,
    },
    noticeText: { color: "#e9d5ff", fontSize: 14, lineHeight: 20 },
    noticeButton: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    noticeButtonText: { color: "#f4f4f5", fontWeight: "600", fontSize: 13 },
    message: { color: "#a1a1aa", fontSize: 13, marginBottom: 12, lineHeight: 18 },
    card: {
        backgroundColor: "#141418",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        padding: 20,
        gap: 0,
    },
    label: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: "#a1a1aa",
        marginTop: 16,
    },
    labelFirst: { marginTop: 0 },
    input: {
        marginTop: 8,
        backgroundColor: "#0c0c0f",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: "#f4f4f5",
        fontSize: 15,
    },
    textarea: { minHeight: 100, textAlignVertical: "top" },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    tag: {
        backgroundColor: "rgba(255,255,255,0.06)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    tagText: { color: "#f4f4f5", fontSize: 12 },
    save: {
        marginTop: 20,
        backgroundColor: "#7c3aed",
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: "center",
        minHeight: 50,
        justifyContent: "center",
    },
    saveText: { color: "#fafafa", fontWeight: "600", fontSize: 16 },
    signOut: {
        marginTop: 10,
        backgroundColor: "rgba(239,68,68,0.14)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.35)",
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
    signOutText: { color: "#fca5a5", fontWeight: "700", fontSize: 15 },
    saved: { marginTop: 12, textAlign: "center", color: "#71717a", fontSize: 12 },
    resumeNote: {
        marginTop: 8,
        backgroundColor: "rgba(124,58,237,0.08)",
        borderWidth: 1,
        borderColor: "rgba(124,58,237,0.2)",
        borderRadius: 12,
        padding: 12,
    },
    resumeNoteText: { color: "#b4a4e8", fontSize: 13, lineHeight: 18 },
});