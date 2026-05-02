"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  initialMessages: MessageRow[];
};

export function ChatTimeline({ roomId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const nextMessage = payload.new as MessageRow;
          setMessages((current) =>
            current.some((message) => message.id === nextMessage.id)
              ? current
              : [...current, nextMessage],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => {
        const isMine = message.sender_id === currentUserId;

        return (
          <div
            key={message.id}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 ${isMine
                  ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                  : "bg-[var(--muted-bg)] text-[var(--foreground)]"
                }`}
            >
              {message.body}
            </div>
          </div>
        );
      }),
    [currentUserId, messages],
  );

  return (
    <div className="flex-1 overflow-y-auto py-5">
      {messages.length ? (
        <div className="space-y-3">{renderedMessages}</div>
      ) : (
        <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-8 py-16 text-center">
          <div>
            <p className="text-lg font-medium text-[var(--foreground)]">
              Say hello
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This room is ready. Send the first message to start the
              conversation.
            </p>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}