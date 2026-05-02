"use client";

import { useState } from "react";
import { ChatTimeline } from "./chat-timeline";
import { ChatMessageBox } from "@/components/ChatMessageBox";

type MessageRow = {
    id: string;
    room_id: string;
    sender_id: string;
    body: string;
    created_at: string;
    pinned: boolean;
};

type Props = {
    roomId: string;
    currentUserId: string;
    initialMessages: MessageRow[];
};

export function ChatPanel({ roomId, currentUserId, initialMessages }: Props) {
    const [, setPinnedMessages] = useState<MessageRow[]>([]);

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <ChatTimeline
                roomId={roomId}
                currentUserId={currentUserId}
                initialMessages={initialMessages}
                onPinnedChange={setPinnedMessages}
            />
            {/* ✅ No ref or onMessageSent — realtime subscription handles new messages */}
            <ChatMessageBox
                roomId={roomId}
                currentUserId={currentUserId}
            />
        </div>
    );
}