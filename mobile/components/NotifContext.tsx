import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type NotifContextType = {
    unreadCount: number;
    refresh: () => void;
};

const NotifContext = createContext<NotifContextType>({ unreadCount: 0, refresh: () => { } });

export function useNotifCount() {
    return useContext(NotifContext);
}

export function NotifProvider({ children }: { children: ReactNode }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const userIdRef = useRef<string | null>(null);
    const channelRef = useRef<any>(null);

    const refresh = useCallback(async () => {
        if (!supabase) return;

        // Get user once and cache it
        if (!userIdRef.current) {
            const { data: userData } = await supabase.auth.getUser();
            userIdRef.current = userData?.user?.id ?? null;
        }

        const userId = userIdRef.current;
        if (!userId) return;

        const { data: inbound } = await supabase
            .from("swipes")
            .select("swiper_id")
            .eq("target_id", userId)
            .eq("direction", "like");

        if (!inbound || inbound.length === 0) {
            setUnreadCount(0);
            return;
        }

        const swiperIds = inbound.map((r: any) => r.swiper_id);

        const { data: outbound } = await supabase
            .from("swipes")
            .select("target_id")
            .eq("swiper_id", userId)
            .in("target_id", swiperIds);

        const matchedSet = new Set((outbound ?? []).map((r: any) => r.target_id));
        const pending = swiperIds.filter((id: string) => !matchedSet.has(id));
        setUnreadCount(pending.length);
    }, []);

    // ✅ Set up realtime subscription once — after we have the user ID
    useEffect(() => {
        if (!supabase) return;
        const client = supabase;

        async function setup() {
            const { data: userData } = await client.auth.getUser();
            const userId = userData?.user?.id;
            if (!userId) return;

            userIdRef.current = userId;

            // Do initial count fetch
            await refresh();

            // Remove any stale channel with the same name before creating a new one.
            // This prevents the "cannot add postgres_changes callbacks after subscribe()" error
            // caused by React Strict Mode double-invoking effects.
            const CHANNEL_NAME = "notif-count-swipes";
            const existing = client.getChannels().find((c: any) => c.topic === `realtime:${CHANNEL_NAME}`);
            if (existing) {
                await client.removeChannel(existing);
            }

            channelRef.current = client
                .channel(CHANNEL_NAME)
                .on("postgres_changes", {
                    event: "INSERT",
                    schema: "public",
                    table: "swipes",
                    filter: `target_id=eq.${userId}`,
                }, () => {
                    void refresh();
                })
                .subscribe((status, err) => {
                    if (status === "CHANNEL_ERROR") {
                        console.error("[NotifContext] Channel error:", err);
                    }
                });
        }

        void setup();

        return () => {
            if (channelRef.current) {
                void client.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
        // ✅ Empty deps — run once on mount only, no re-subscribing
    }, []);

    return (
        <NotifContext.Provider value={{ unreadCount, refresh }}>
            {children}
        </NotifContext.Provider>
    );
}