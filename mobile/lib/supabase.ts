import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      // ✅ Required for Expo/React Native — tells the Supabase realtime client
      // to use the global WebSocket provided by React Native's runtime.
      // Without this, realtime subscriptions silently fail on mobile.
      transport: WebSocket,
    },
    // ✅ Required for React Native — the fetch global isn't always picked up
    // automatically by the Supabase client in an Expo environment.
    global: {
      fetch: fetch.bind(globalThis),
    },
  })
  : null;