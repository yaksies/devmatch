import { DiscoverDeck } from "@/components/DiscoverDeck";
import { mockDiscoverDeck } from "@devmatch/shared";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function DiscoverScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      style={styles.root}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Find your hackathon crew</Text>
        <Text style={styles.sub}>
          Swipe through participants. Mutual likes become matches — then chat.
        </Text>
      </View>
      <DiscoverDeck initialProfiles={mockDiscoverDeck} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  header: { marginBottom: 24, maxWidth: 360 },
  title: {
    color: "#f4f4f5",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    marginTop: 8,
    color: "#a1a1aa",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
