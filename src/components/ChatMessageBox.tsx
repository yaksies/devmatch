"use client";

import { useRef, useState } from "react";
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
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    async function handleSend() {
        const body = textareaRef.current?.value.trim();
        if (!body) return;
        setSending(true);
        setError(null);
        const supabase = createClient();
        onMessageSent?.({
            id: `optimistic-${Date.now()}`,
            room_id: roomId,
            sender_id: currentUserId,
            body,
            created_at: new Date().toISOString(),
        });
        if (textareaRef.current) textareaRef.current.value = "";
        const { error } = await supabase.from("chat_messages").insert({
            room_id: roomId,
            sender_id: currentUserId,
            body,
        });
        if (error) setError(error.message);
        setSending(false);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="border-t border-[var(--border)] pt-4">
            {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
            <label className="sr-only" htmlFor="message">Message</label>
            <div className="flex gap-3">
                <textarea
                    ref={textareaRef}
                    id="message"
                    rows={2}
                    placeholder="Write a message..."
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    className="min-h-[52px] flex-1 resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] disabled:opacity-50"
                />
                <button
                    onClick={handleSend}
                    disabled={sending}
                    className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {sending ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
}