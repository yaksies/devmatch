import { useEffect, useState, useCallback, useRef } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { SectionBackButton } from "@/components/SectionBackButton";

type MessageRow = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function ChatRoomScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<string>("connecting");
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  // Setup realtime subscription
  const setupRealtime = useCallback(async () => {
    if (!supabase || !id) return;

    // Clean up existing channel if any
    if (channelRef.current) {
      console.log("[Realtime] Removing old channel for room:", id);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data: initialMessages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", id)
      .order("created_at", { ascending: true });

    if (initialMessages) setMessages(initialMessages);
    setLoading(false);

    console.log("[Realtime] Subscribing to room:", id);

    const channel = supabase
      .channel(`chat-room-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${id}`,
        },
        (payload) => {
          console.log("[Realtime] INSERT received:", payload.new);
          const nextMessage = payload.new as MessageRow;
          setMessages((current) => {
            if (current.some((msg) => msg.id === nextMessage.id)) return current;
            return [...current, nextMessage];
          });
        }
      )
      .subscribe((status, err) => {
        console.log("[Realtime] Status:", status, err ?? "");
        setRealtimeStatus(status);
        if (status === "CHANNEL_ERROR") {
          console.error("[Realtime] Channel error:", err);
        }
        if (status === "TIMED_OUT") {
          console.error("[Realtime] Timed out — WebSocket likely not reaching Supabase");
        }
      });

    channelRef.current = channel;
  }, [id]);

  // Use useFocusEffect to ensure realtime is active when screen is in focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setupRealtime();

      return () => {
        // Don't clean up the channel here - keep it alive in the background
      };
    }, [setupRealtime])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (supabase && channelRef.current) {
        console.log("[Realtime] Removing channel on unmount for room:", id);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [id]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !supabase || !currentUserId) return;

    setInputText("");
    console.log("[Chat] Sending message to room:", id);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ room_id: id, sender_id: currentUserId, body: text })
      .select("*")
      .single();

    if (error) {
      console.error("[Chat] Send error:", error.message);
    } else {
      // Optimistically add own message in case realtime is delayed
      console.log("[Chat] Inserted message:", data);
      if (data) {
        setMessages((current) => {
          if (current.some((msg) => msg.id === data.id)) return current;
          return [...current, data as MessageRow];
        });
      }
    }
  };

  const renderMessage = useCallback(({ item }: { item: MessageRow }) => {
    const isMine = item.sender_id === currentUserId;
    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
        <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs]}>
          <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextTheirs]}>
            {item.body}
          </Text>
        </View>
      </View>
    );
  }, [currentUserId]);

  // Scroll to bottom whenever messages change (new message received)
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <SectionBackButton style={styles.backButton} />
        <View style={[styles.root, styles.center]}>
          <Stack.Screen options={{ title: name || "Chat" }} />
          <ActivityIndicator color="#c4b5fd" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]} key={id}>
      <SectionBackButton style={styles.backButton} />
      <Stack.Screen options={{ title: name || "Chat" }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Debug banner — remove once realtime is confirmed working */}
        {__DEV__ && (
          <View style={[
            styles.debugBanner,
            realtimeStatus === "SUBSCRIBED" ? styles.debugOk : styles.debugWarn
          ]}>
            <Text style={styles.debugText}>Realtime: {realtimeStatus}</Text>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          scrollEnabled={true}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Write a message..."
            placeholderTextColor="#a1a1aa"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <FontAwesome name="send" size={16} color={inputText.trim() ? "#fff" : "#a1a1aa"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  center: { justifyContent: "center", alignItems: "center" },
  backButton: { marginLeft: 16, marginTop: 4, marginBottom: 4 },
  container: { flex: 1 },
  messageList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: "row", marginBottom: 12 },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowTheirs: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "80%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  messageBubbleMine: { backgroundColor: "#c4b5fd" },
  messageBubbleTheirs: { backgroundColor: "#27272a" },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextMine: { color: "#3b0764" },
  messageTextTheirs: { color: "#f4f4f5" },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#141418",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#27272a",
    color: "#f4f4f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  sendButtonDisabled: { backgroundColor: "#3f3f46" },
  debugBanner: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  debugOk: { backgroundColor: "#052e16" },
  debugWarn: { backgroundColor: "#450a0a" },
  debugText: { color: "#fff", fontSize: 11, fontWeight: "600" },
});