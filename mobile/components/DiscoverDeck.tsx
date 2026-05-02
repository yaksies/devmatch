import type { HackathonProfile } from "@devmatch/shared";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  initialProfiles: HackathonProfile[];
};

export function DiscoverDeck({ initialProfiles }: Props) {
  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const current = initialProfiles[index];

  const goNext = useCallback(
    (_direction: "like" | "pass") => {
      if (!current) return;
      void _direction;
      setReviewed((n) => n + 1);
      setIndex((i) => i + 1);
    },
    [current],
  );

  if (!current) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>You’re caught up</Text>
        <Text style={styles.emptySub}>
          Connect Supabase to load real participants. Tap below to reset the
          demo deck.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            setIndex(0);
            setReviewed(0);
          }}
        >
          <Text style={styles.primaryBtnText}>Reset demo deck</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Looking for teammates</Text>
        <Text style={styles.name}>{current.displayName}</Text>
        {current.headline ? (
          <Text style={styles.headline}>{current.headline}</Text>
        ) : null}
        <View style={styles.tags}>
          {current.techStack.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        {current.interests ? (
          <Text style={styles.interests}>{current.interests}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.btnGhost]}
          onPress={() => goNext("pass")}
        >
          <Text style={styles.btnGhostText}>Pass</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => goNext("like")}
        >
          <Text style={styles.btnPrimaryText}>Like</Text>
        </Pressable>
      </View>

      {reviewed > 0 ? (
        <Text style={styles.hint}>
          {reviewed} reviewed — wire actions to Supabase `swipes`
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", maxWidth: 400, gap: 16 },
  card: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#141418",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minHeight: 320,
    justifyContent: "flex-end",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#a1a1aa",
    marginBottom: 6,
  },
  name: { fontSize: 24, fontWeight: "700", color: "#f4f4f5" },
  headline: { marginTop: 8, fontSize: 14, color: "#a1a1aa" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  tag: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: { fontSize: 12, fontWeight: "500", color: "#f4f4f5" },
  interests: { marginTop: 16, fontSize: 14, lineHeight: 20, color: "#e4e4e7" },
  actions: { flexDirection: "row", gap: 12 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  btnGhost: {
    backgroundColor: "#141418",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  btnGhostText: { fontSize: 15, fontWeight: "600", color: "#f4f4f5" },
  btnPrimary: { backgroundColor: "#7c3aed" },
  btnPrimaryText: { fontSize: 15, fontWeight: "600", color: "#fafafa" },
  hint: { textAlign: "center", fontSize: 11, color: "#71717a" },
  empty: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#f4f4f5" },
  emptySub: {
    fontSize: 13,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: "#7c3aed",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryBtnText: { color: "#fafafa", fontWeight: "600", fontSize: 14 },
});
