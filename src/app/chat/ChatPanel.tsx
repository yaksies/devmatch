"use client";

import { useRef } from "react";
import { ChatTimeline } from "./chat-timeline";
import { ChatMessageBox } from "@/components/ChatMessageBox";

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
    initialMessages: MessageRow[];
};

export function ChatPanel({ roomId, currentUserId, initialMessages }: Props) {
    const addMessageRef = useRef<((msg: MessageRow) => void) | null>(null);

    return (
        <>
            <ChatTimeline
                key={roomId}
                roomId={roomId}
                currentUserId={currentUserId}
                initialMessages={initialMessages}
                onReady={(fn) => { addMessageRef.current = fn; }}
            />
            <ChatMessageBox
                roomId={roomId}
                currentUserId={currentUserId}
                onMessageSent={(msg) => addMessageRef.current?.(msg)}
            />
        </>
    );
}