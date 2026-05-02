import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
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
        <Link href="/(tabs)/discover" asChild>
          <Pressable style={styles.primary}>
            <Text style={styles.primaryText}>Open discover</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/profile" asChild>
          <Pressable style={styles.secondary}>
            <Text style={styles.secondaryText}>Edit profile</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: {
    padding: 24,
    paddingTop: 16,
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
});
