import type { HackathonProfile } from "@devmatch/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";

type Props = {
  initialProfiles: HackathonProfile[];
};

export function DiscoverDeck({ initialProfiles }: Props) {
  const [index, setIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPromotingNext, setIsPromotingNext] = useState(false);
  const [swipeDir, setSwipeDir] = useState<-1 | 1 | null>(null);

  const current = initialProfiles[index];
  const next = initialProfiles[index + 1];

  const startX = useRef(0);

  useEffect(() => {
    return () => {
      setIsDragging(false);
    };
  }, []);

  const commitSwipe = (direction: -1 | 1) => {
    if (!current || swipeDir) return;

    setSwipeDir(direction);
    setIsPromotingNext(true);

    setTimeout(() => {
      setReviewed((n) => n + 1);
      setIndex((i) => i + 1);
      setDragX(0);
      setSwipeDir(null);
      setIsPromotingNext(false);
    }, 220);
  };

  const finishDrag = () => {
    setIsDragging(false);

    if (Math.abs(dragX) > 78) {
      commitSwipe(dragX > 0 ? 1 : -1);
      return;
    }

    setDragX(0);
    setIsPromotingNext(false);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: (event) => {
          startX.current = event.nativeEvent.pageX;
          setIsDragging(true);
          setIsPromotingNext(false);
        },
        onPanResponderMove: (event) => {
          if (!isDragging || swipeDir) return;
          setDragX(event.nativeEvent.pageX - startX.current);
        },
        onPanResponderRelease: finishDrag,
        onPanResponderTerminate: finishDrag,
      }),
    [dragX, isDragging, swipeDir],
  );

  const cardStyle = useMemo(() => {
    const x = swipeDir ? swipeDir * 460 : dragX;
    const rotation = x / 22;
    const opacity = swipeDir ? 0.12 : 1 - Math.min(Math.abs(x) / 420, 0.25);

    return {
      transform: [{ translateX: x }, { rotate: `${rotation}deg` }],
      opacity,
    };
  }, [dragX, swipeDir]);

  const nextCardStyle = useMemo(() => {
    const liftProgress = isPromotingNext ? 1 : Math.min(Math.abs(dragX) / 160, 1);
    const y = 40 - liftProgress * 40;
    const scale = 0.88 + liftProgress * 0.12;
    const opacity = 0.46 + liftProgress * 0.54;

    return {
      transform: [{ translateY: y }, { scale }],
      opacity,
      zIndex: isPromotingNext ? 20 : 0,
    };
  }, [dragX, isPromotingNext]);

  const indicatorOpacity = Math.min(Math.abs(dragX) / 70, 1);
  const showPass = dragX < -8;
  const showLike = dragX > 8;

  if (!current) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>You’re caught up</Text>
        <Text style={styles.emptySub}>
          Connect Supabase to load real participants.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.stack}>
        <View style={[styles.card, styles.nextCard, nextCardStyle]}>
          <Text style={styles.kicker}>Up next</Text>
          <Text style={styles.name}>{next?.displayName}</Text>
          {next?.headline ? <Text style={styles.headline}>{next.headline}</Text> : null}
        </View>

        <View style={[styles.card, styles.frontCard, cardStyle]} {...panResponder.panHandlers}>
          <View style={styles.cardBody}>
            <View style={styles.indicatorRow}>
              <View
                style={[
                  styles.indicator,
                  styles.passIndicator,
                  { opacity: showPass ? indicatorOpacity : 0 },
                ]}
              >
                <Text style={styles.passIndicatorText}>Pass</Text>
              </View>
              <View
                style={[
                  styles.indicator,
                  styles.likeIndicator,
                  { opacity: showLike ? indicatorOpacity : 0 },
                ]}
              >
                <Text style={styles.likeIndicatorText}>Like</Text>
              </View>
            </View>

            <Text style={[styles.kicker, styles.kickerActive]}>Looking for teammates</Text>
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
        </View>
      </View>

      {reviewed > 0 ? (
        <Text style={styles.hint}>
          {reviewed} reviewed — swipe left or right to continue
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", maxWidth: 400, gap: 16 },
  stack: {
    position: "relative",
    height: 360,
    width: "100%",
  },
  card: {
    position: "absolute",
    inset: 0,
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#141418",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minHeight: 320,
    justifyContent: "flex-end",
  },
  nextCard: {
    backgroundColor: "#17171b",
    opacity: 0.7,
    transform: [{ translateY: 40 }, { scale: 0.88 }],
    zIndex: 0,
  },
  frontCard: {
    backgroundColor: "#1f1f25",
    zIndex: 10,
  },
  cardBody: {
    position: "relative",
    flex: 1,
    justifyContent: "flex-end",
  },
  indicatorRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 20,
  },
  indicator: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  passIndicator: {
    backgroundColor: "rgba(244,63,94,0.14)",
    borderColor: "rgba(244,63,94,0.5)",
  },
  likeIndicator: {
    backgroundColor: "rgba(16,185,129,0.14)",
    borderColor: "rgba(16,185,129,0.5)",
  },
  passIndicatorText: {
    color: "#fecdd3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  likeIndicatorText: {
    color: "#a7f3d0",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#a1a1aa",
    marginBottom: 6,
  },
  kickerActive: { color: "#c4b5fd" },
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
});
