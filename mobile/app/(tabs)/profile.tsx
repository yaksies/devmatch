import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
  const [saved, setSaved] = useState(false);

  const tags = parseStack(techRaw);

  function onSave() {
    setSaved(true);
    // TODO: upsert Supabase `profiles`
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scroll}
      style={styles.root}
    >
      <Text style={styles.title}>Your hackathon profile</Text>
      <Text style={styles.sub}>
        This is what others see while swiping. Keep it short and specific.
      </Text>

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

        <Pressable style={styles.save} onPress={onSave}>
          <Text style={styles.saveText}>Save profile</Text>
        </Pressable>
        {saved ? (
          <Text style={styles.saved}>
            Saved locally — connect Supabase to persist.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: { padding: 20, paddingBottom: 40, maxWidth: 480, width: "100%", alignSelf: "center" },
  title: { color: "#f4f4f5", fontSize: 22, fontWeight: "700" },
  sub: { marginTop: 8, color: "#a1a1aa", fontSize: 14, lineHeight: 20, marginBottom: 20 },
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
  },
  saveText: { color: "#fafafa", fontWeight: "600", fontSize: 16 },
  saved: { marginTop: 12, textAlign: "center", color: "#71717a", fontSize: 12 },
});
