import { useEffect, useMemo, useState } from "react";
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type CountryFilter = "all" | "canada" | "us" | "other";

type HackathonEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  image?: string;
  url: string;
  source: "devpost" | "mlh" | "other";
  description?: string;
};

const FALLBACK_EVENTS: HackathonEvent[] = [
  {
    id: "fallback-1",
    name: "HackMIT",
    date: "Sep 19-20, 2026",
    location: "Cambridge, MA",
    source: "mlh",
    url: "https://www.mlh.com/seasons/2026/events",
  },
  {
    id: "fallback-2",
    name: "Orion Build Challenge",
    date: "Apr 10 - May 02, 2026",
    location: "Online",
    source: "devpost",
    url: "https://orion-build-challenge.devpost.com/",
  },
  {
    id: "fallback-3",
    name: "HackUMass",
    date: "June 14-16, 2026",
    location: "Amherst, MA",
    source: "mlh",
    url: "https://www.mlh.com/seasons/2026/events",
  },
];

function getWebBaseUrl() {
  const env = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim();
  if (env) {
    return env.replace(/\/$/, "");
  }

  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
}

function classifyCountry(location: string) {
  if (
    /(?:\bcanada\b|,\s*ca\b|\bontario\b|\bquebec\b|\bbritish columbia\b|\balberta\b|\bmanitoba\b|\bsaskatchewan\b|\bnew brunswick\b|\bnova scotia\b|\bnewfoundland and labrador\b|\bprince edward island\b|\byukon\b|\bnorthwest territories\b|\bnunavut\b)/i.test(location)
  ) {
    return "canada";
  }

  if (
    /(?:\bunited states\b|\busa\b|,\s*us\b|\bcalifornia\b|\bnew york\b|\btexas\b|\bflorida\b|\bmassachusetts\b|\bwashington\b|\bnew jersey\b|\boregon\b|\bindiana\b|\bcolorado\b|\barizona\b|\bgeorgia\b|\bvirginia\b|\bmichigan\b|\billinois\b|\bpa\b)/i.test(location)
  ) {
    return "us";
  }

  return "other";
}

export function EventsFeed() {
  const [events, setEvents] = useState<HackathonEvent[]>(FALLBACK_EVENTS);
  const [filter, setFilter] = useState<CountryFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadEvents = async () => {
      try {
        const response = await fetch(`${getWebBaseUrl()}/api/events`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data = (await response.json()) as { events?: HackathonEvent[] };

        if (active && data.events?.length) {
          setEvents(data.events);
        }
      } catch {
        if (active) {
          setEvents(FALLBACK_EVENTS);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadEvents();

    return () => {
      active = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    if (filter === "all") {
      return events;
    }

    return events.filter((event) => classifyCountry(event.location) === filter);
  }, [events, filter]);

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.title}>Upcoming hackathons</Text>

        <View style={styles.chips}>
          {(["all", "canada", "us", "other"] as CountryFilter[]).map((value) => {
            const selected = filter === value;
            const label = value === "all" ? "No filter" : value === "us" ? "US" : value === "canada" ? "Canada" : "Other";

            return (
              <Pressable key={value} onPress={() => setFilter(value)} style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.grid}>
        {filteredEvents.map((event) => (
          <Pressable
            key={event.id}
            onPress={() => void Linking.openURL(event.url)}
            style={styles.card}
          >
            <View style={styles.imageWrap}>
              {event.image ? (
                <Image source={{ uri: event.image }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.noImageWrap}>
                  <Text style={styles.noImage}>NO IMAGE</Text>
                </View>
              )}
              <View style={styles.overlay} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{event.source === "mlh" ? "MLH" : event.source === "devpost" ? "Devpost" : "Event"}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
              <Text style={styles.meta}>📅 {event.date}</Text>
              <Text style={styles.meta}>📍 {event.location}</Text>
              {event.description ? (
                <Text style={styles.description} numberOfLines={3}>{event.description}</Text>
              ) : null}
              <Text style={styles.open}>Open</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {!isLoading && filteredEvents.length === 0 ? (
        <Text style={styles.end}>You&apos;ve gone too far.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    marginTop: 36,
  },
  headingRow: {
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    color: "#f4f4f5",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipSelected: {
    backgroundColor: "rgba(124,58,237,0.22)",
    borderColor: "rgba(124,58,237,0.5)",
  },
  chipText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#f4f4f5",
  },
  grid: {
    gap: 12,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#141418",
  },
  imageWrap: {
    height: 170,
    position: "relative",
    backgroundColor: "#1c1c22",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  noImageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  noImage: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardBody: {
    padding: 14,
  },
  eventName: {
    color: "#f4f4f5",
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    marginTop: 6,
    color: "#a1a1aa",
    fontSize: 12,
  },
  description: {
    marginTop: 10,
    color: "#d4d4d8",
    fontSize: 12,
    lineHeight: 18,
  },
  open: {
    marginTop: 12,
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  end: {
    marginTop: 16,
    textAlign: "center",
    color: "#a1a1aa",
    fontSize: 12,
  },
});