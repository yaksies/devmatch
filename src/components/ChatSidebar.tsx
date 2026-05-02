"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = {
    id: string;
    display_name: string;
    headline: string | null;
};

type Match = {
    id: string;
    user_a: string;
    user_b: string;
    created_at: string;
};

type Props = {
    initialPartnerIds: string[];
    initialProfileMap: Map<string, Profile>;
    userId: string;
    selectedPartnerId?: string;
};

export function ChatSidebar({ initialPartnerIds, initialProfileMap, userId, selectedPartnerId }: Props) {
    const [partnerIds, setPartnerIds] = useState(initialPartnerIds);
    const [profileMap, setProfileMap] = useState(initialProfileMap);

    useEffect(() => {
        const supabase = createClient();

        // Subscribe to new matches for this user
        const channel = supabase
            .channel(`chat-matches-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "matches",
                },
                async (payload) => {
                    console.log("New match detected:", payload);
                    const newMatch = payload.new as Match;
                    if (newMatch.user_a === userId || newMatch.user_b === userId) {
                        console.log("Match involves current user:", newMatch);
                        const partnerId = newMatch.user_a === userId ? newMatch.user_b : newMatch.user_a;

                        // Fetch the partner's profile if we don't have it
                        if (!profileMap.has(partnerId)) {
                            console.log("Fetching profile for:", partnerId);
                            const { data: profile } = await supabase
                                .from("profiles")
                                .select("id, display_name, headline")
                                .eq("id", partnerId)
                                .single();

                            if (profile) {
                                console.log("Profile fetched:", profile);
                                setProfileMap(current => new Map(current.set(partnerId, profile)));
                            }
                        }

                        // Add to partnerIds if not already there
                        console.log("Current partnerIds:", partnerIds);
                        console.log("Adding partnerId:", partnerId);
                        setPartnerIds(current =>
                            current.includes(partnerId) ? current : [...current, partnerId]
                        );
                    }
                }
            )
            .subscribe((status) => {
                console.log("ChatSidebar subscription status:", status);
            });

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [userId]);

    return (
        <>
            <div className="mb-4 px-2 pt-1">
                <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    Chat
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    Conversations only appear after both people like each other.
                </p>
            </div>

            {partnerIds.length ? (
                <div className="space-y-2">
                    {partnerIds.map((partnerId) => {
                        const profile = profileMap.get(partnerId);
                        const isSelected = partnerId === selectedPartnerId;

                        return (
                            <Link
                                key={partnerId}
                                href={`/chat?with=${partnerId}`}
                                className={`block rounded-2xl border px-4 py-3 transition-colors ${isSelected
                                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                    : "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--muted-bg)]"
                                    }`}
                            >
                                <p className="font-medium text-[var(--foreground)]">
                                    {profile?.display_name ?? "Unknown"}
                                </p>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                    {profile?.headline ?? "Matched on DevMatch"}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-6 py-12 text-center">
                    <p className="text-base font-medium text-[var(--foreground)]">
                        No matches yet
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                        Once you and another participant accept each other, the chat room
                        will appear here.
                    </p>
                    <Link
                        href="/discover"
                        className="mt-5 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
                    >
                        Keep swiping
                    </Link>
                </div>
            )}
        </>
    );
}