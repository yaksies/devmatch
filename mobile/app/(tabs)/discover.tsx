import { useEffect, useState } from "react";
import { DiscoverDeck } from "@/components/DiscoverDeck";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import type { HackathonProfile } from "@devmatch/shared";

export default function DiscoverScreen() {
  const [profiles, setProfiles] = useState<HackathonProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfiles() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch swipes by this user to exclude them from the deck
      const { data: swipes } = await supabase
        .from("swipes")
        .select("target_id")
        .eq("swiper_id", user.id);
        
      const swipedIds = new Set((swipes || []).map((s) => s.target_id));
      swipedIds.add(user.id);

      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("*");
        
      const loadedProfiles: HackathonProfile[] = (allProfiles || [])
        .filter((p) => !swipedIds.has(p.id))
        .map((p) => ({
          id: p.id,
          displayName: p.display_name,
          headline: p.headline || "",
          techStack: p.tech_stack || [],
          interests: p.interests || "",
        }));

      setProfiles(loadedProfiles);
      setLoading(false);
    }

    loadProfiles();
  }, []);

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#a1a1aa" }}>Loading profiles...</Text>
      </View>
    );
  }

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
      <DiscoverDeck initialProfiles={profiles} />
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
