import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
  const [hasUser, setHasUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      if (!supabase || !mounted) {
        setHasUser(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setHasUser(Boolean(user));
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setHasUser(Boolean(session?.user));
      }
    }) ?? { data: { subscription: { unsubscribe: () => undefined } } };

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      style={styles.root}
    >
      <Text style={styles.kicker}>Hackathon teammate matching</Text>
      <Text style={styles.title}>
        DevMatch — find your crew before the opening keynote.
      </Text>
      <Text style={styles.body}>
        Swipe through people at the same event, match on skills, and
        coordinate in chat. This app shares types and Supabase with the Next.js
        web app in the monorepo.
      </Text>
      <View style={styles.row}>
        <Pressable style={styles.primary} onPress={() => router.push("/discover")}>
          <Text style={styles.primaryText}>Open discover</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push("/profile")}>
          <Text style={styles.secondaryText}>Edit profile</Text>
        </Pressable>
      </View>
      {hasUser ? (
        <View style={[styles.row, { marginTop: 14 }]}> 
          <Pressable style={styles.secondary} onPress={() => router.push("/passed")}>
            <Text style={styles.secondaryText}>Passed</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push("/accepted")}>
            <Text style={styles.secondaryText}>Accepted</Text>
          </Pressable>
        </View>
      ) : null}
      {!hasUser ? (
        <Link href={"/auth" as any} asChild>
          <Pressable style={styles.authButton}>
            <Text style={styles.authButtonText}>Log in / Sign up</Text>
          </Pressable>
        </Link>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: {
    padding: 28,
    paddingTop: 24,
    paddingBottom: 48,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  kicker: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    color: "#f4f4f5",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },
  body: {
    marginTop: 16,
    color: "#a1a1aa",
    fontSize: 16,
    lineHeight: 24,
  },
  row: { marginTop: 28, gap: 12 },
  primary: {
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryText: { color: "#fafafa", fontWeight: "600", fontSize: 16 },
  secondary: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#141418",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryText: { color: "#f4f4f5", fontWeight: "600", fontSize: 16 },
  authButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.35)",
    backgroundColor: "rgba(124,58,237,0.12)",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  authButtonText: { color: "#e9d5ff", fontWeight: "700", fontSize: 16 },
});
