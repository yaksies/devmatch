import { useEffect, useState, useCallback, useRef } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
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
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    let channel: any;

    async function initChat() {
      if (!supabase || !id) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: initialMessages } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", id)
        .order("created_at", { ascending: true });

      if (initialMessages) setMessages(initialMessages);
      setLoading(false);

      channel = supabase
        .channel(`chat-room-${id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.'${id}'`,
          },
          (payload) => {
            const nextMessage = payload.new as MessageRow;
            setMessages((current) => {
              if (current.some((msg) => msg.id === nextMessage.id)) return current;
              return [...current, nextMessage];
            });
          }
        )
        .subscribe();
    }

    initChat();

    return () => {
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [id]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !supabase || !currentUserId) return;

    setInputText("");

    const { error } = await supabase.from("chat_messages").insert({
      room_id: id,
      sender_id: currentUserId,
      body: text,
    });

    if (error) console.error("Error sending message:", error.message);
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
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
});