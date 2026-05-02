import { isSupabaseConfigured } from "@/lib/supabase";
import { StyleSheet, Text, View } from "react-native";

export default function ChatScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.body}>
        After two people like each other, back messages with Supabase Realtime
        on the <Text style={styles.code}>chat_messages</Text> table. Enable
        replication in the Supabase dashboard, then subscribe from the client.
      </Text>
      <View style={styles.panel}>
        <Text style={styles.panelText}>
          {isSupabaseConfigured
            ? "Supabase env is set — you can wire channels next."
            : "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f", padding: 20 },
  body: { color: "#a1a1aa", fontSize: 14, lineHeight: 22 },
  code: { fontFamily: "SpaceMono", color: "#e4e4e7" },
  panel: {
    marginTop: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#141418",
  },
  panelText: { color: "#71717a", fontSize: 13, textAlign: "center" },
});
