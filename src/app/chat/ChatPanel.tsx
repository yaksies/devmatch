"use client";

import { useRef } from "react";
import { ChatTimeline, ChatTimelineHandle } from "./chat-timeline";
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
    const timelineRef = useRef<ChatTimelineHandle | null>(null);

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <ChatTimeline
                ref={timelineRef}
                roomId={roomId}
                currentUserId={currentUserId}
                initialMessages={initialMessages}
            />
            <ChatMessageBox
                roomId={roomId}
                currentUserId={currentUserId}
                onMessageSent={(msg) => timelineRef.current?.addMessage(msg as MessageRow)}
            />
        </div>
    );
}