import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signupAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(signupAnim, {
      toValue: mode === "signup" ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [mode, signupAnim]);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMessage(null);
    setMode(next);
  }

  async function handleSubmit() {
    if (!supabase) {
      setMessage(
        "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env"
      );
      return;
    }

    if (!email || !password) {
      setMessage("Enter both email and password.");
      return;
    }

    if (mode === "signup") {
      if (!confirmPassword) {
        setMessage("Please confirm your password.");
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
    }

    setBusy(true);
    setMessage(null);

    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { data, error } = await action;

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "signup" && !data.session) {
      setMessage(
        "Account created. Check your email if Supabase confirmation is enabled, then come back to log in."
      );
      return;
    }

    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.kicker}>Account</Text>
          <Text style={styles.title}>
            {mode === "login" ? "Log in" : "Sign up"} to DevMatch
          </Text>
          <Text style={styles.body}>
            Use the same Supabase project as the web app so your account works
            across devices.
          </Text>

          <View style={styles.segmentRow}>
            <Pressable
              onPress={() => switchMode("login")}
              style={[styles.segment, mode === "login" && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === "login" && styles.segmentTextActive,
                ]}
              >
                Log in
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchMode("signup")}
              style={[styles.segment, mode === "signup" && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === "signup" && styles.segmentTextActive,
                ]}
              >
                Sign up
              </Text>
            </Pressable>
          </View>

          {!isSupabaseConfigured ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Supabase env is missing. Add the two EXPO_PUBLIC variables to
                mobile/.env first.
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            placeholderTextColor="#71717a"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType={mode === "login" ? "password" : "newPassword"}
              placeholderTextColor="#71717a"
              style={styles.input}
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={({ pressed }) => [
                styles.visibilityButton,
                pressed && styles.visibilityButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#c4b5fd"
              />
            </Pressable>
          </View>

          <Animated.View
            pointerEvents={mode === "signup" ? "auto" : "none"}
            style={[
              styles.confirmSection,
              {
                height: signupAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 86],
                }),
                opacity: signupAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                placeholderTextColor="#71717a"
                style={styles.input}
              />
              <Pressable
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                style={({ pressed }) => [
                  styles.visibilityButton,
                  pressed && styles.visibilityButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#c4b5fd"
                />
              </Pressable>
            </View>
          </Animated.View>

          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.message}>{message}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={busy}
            style={({ pressed }) => [
              styles.button,
              pressed && !busy && styles.buttonPressed,
              busy && styles.buttonDisabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fafafa" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "login" ? "Log in" : "Create account"}
              </Text>
            )}
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {mode === "login"
                ? "Need an account?"
                : "Already have an account?"}
            </Text>
            <Pressable
              onPress={() =>
                switchMode(mode === "login" ? "signup" : "login")
              }
            >
              <Text style={styles.footerLink}>
                {mode === "login" ? "Sign up" : "Log in"}
              </Text>
            </Pressable>
          </View>

          <Link href="/(tabs)" asChild>
            <Pressable style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Back to app</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0c0c0f" },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: "#141418",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 22,
  },
  kicker: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    color: "#f4f4f5",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  body: {
    marginTop: 12,
    color: "#a1a1aa",
    fontSize: 15,
    lineHeight: 22,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  segment: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  segmentActive: {
    backgroundColor: "rgba(124,58,237,0.18)",
    borderColor: "rgba(124,58,237,0.5)",
  },
  segmentText: { color: "#a1a1aa", fontWeight: "600" },
  segmentTextActive: { color: "#f4f4f5" },
  notice: {
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.18)",
  },
  noticeText: { color: "#fbbf24", fontSize: 13, lineHeight: 19 },
  label: {
    marginTop: 16,
    marginBottom: 8,
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0c0c0f",
    paddingHorizontal: 14,
    paddingVertical: 13,
    paddingRight: 66,
    color: "#f4f4f5",
    fontSize: 15,
  },
  inputWrap: {
    position: "relative",
  },
  visibilityButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 28,
    paddingHorizontal: 4,
  },
  visibilityButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  confirmSection: {
    overflow: "hidden",
  },
  messageBox: {
    marginTop: 16,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },
  message: { color: "#fca5a5", fontSize: 13, lineHeight: 19 },
  button: {
    marginTop: 20,
    borderRadius: 999,
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fafafa", fontSize: 16, fontWeight: "700" },
  footerRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  footerText: { color: "#a1a1aa", fontSize: 13 },
  footerLink: { color: "#c4b5fd", fontSize: 13, fontWeight: "700" },
  linkButton: {
    marginTop: 18,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  linkButtonText: { color: "#f4f4f5", fontWeight: "600" },
});
