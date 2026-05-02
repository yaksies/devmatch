"use client";

import { useEffect, useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { createClient } from "@/lib/supabase/client";

type MessageRow = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ChatTimelineHandle = {
  addMessage: (msg: MessageRow) => void;
};

type Props = {
  roomId: string;
  currentUserId: string;
  initialMessages: MessageRow[];
};

export const ChatTimeline = forwardRef<ChatTimelineHandle, Props>(
  function ChatTimeline({ roomId, currentUserId, initialMessages }, ref) {
    const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
    const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const addMessage = useCallback((msg: MessageRow) => {
      setMessages((current) =>
        current.some((m) => m.id === msg.id) ? current : [...current, msg]
      );
      setNewMessageIds((current) => new Set(current).add(msg.id));
      setTimeout(() => {
        setNewMessageIds((current) => {
          const next = new Set(current);
          next.delete(msg.id);
          return next;
        });
      }, 400);
    }, []);

    // Expose addMessage to parent via ref
    useImperativeHandle(ref, () => ({ addMessage }), [addMessage]);

    useEffect(() => {
      setMessages(initialMessages);
    }, [roomId, initialMessages]);

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
            addMessage(payload.new as MessageRow);
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.error(`Realtime subscription failed for room ${roomId}`);
          }
        });

      return () => {
        void supabase.removeChannel(channel);
      };
    }, [roomId, addMessage]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom < 100) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, [messages]);

    const renderedMessages = useMemo(
      () =>
        messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          const isNew = newMessageIds.has(message.id);
          return (
            <div
              key={message.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"} ${isNew ? "animate-message-in" : ""
                }`}
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
      [currentUserId, messages, newMessageIds],
    );

    return (
      <div ref={containerRef} className="h-full overflow-y-auto py-5">
        <style>{`
          @keyframes message-in {
            from { opacity: 0; transform: translateY(10px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
          .animate-message-in {
            animation: message-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>
        {messages.length ? (
          <div className="space-y-3">{renderedMessages}</div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-8 py-16 text-center">
            <div>
              <p className="text-lg font-medium text-[var(--foreground)]">Say hello</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                This room is ready. Send the first message to start the conversation.
              </p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    );
  }
);