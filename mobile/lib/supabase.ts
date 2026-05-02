import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native"; // Add this import

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // CRITICAL: Must be true on Web to handle Realtime auth handshakes
      detectSessionInUrl: Platform.OS === 'web',
    },
    // Optimization for Realtime stability on browsers
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
  : null;