"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MessageRow = {
    id: string;
    room_id: string;
    sender_id: string;
    body: string;
    created_at: string;
};

type Props = {
    roomId: string;
    currentUserId: string;
    onMessageSent?: (message: MessageRow) => void;
};

export function ChatMessageBox({ roomId, currentUserId, onMessageSent }: Props) {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const body = message.trim();
        if (!body || isSending) {
            return;
        }

        setIsSending(true);

        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user || user.id !== currentUserId) {
                return;
            }

            const { data, error } = await supabase
                .from("chat_messages")
                .insert({
                    room_id: roomId,
                    sender_id: user.id,
                    body,
                })
                .select("id, room_id, sender_id, body, created_at")
                .single();

            if (error) {
                console.error("Failed to send chat message", error);
                return;
            }

            setMessage("");
            onMessageSent?.(data as MessageRow);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-[var(--border)] pt-4">
            <label className="sr-only" htmlFor="chat-message">
                Message
            </label>
            <div className="flex gap-3">
                <textarea
                    id="chat-message"
                    name="message"
                    rows={2}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write a message..."
                    className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                />
                <button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Send
                </button>
            </div>
        </form>
    );
}
