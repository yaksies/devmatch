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
  onReady?: (appendMessage: (message: MessageRow) => void) => void;
};

export function ChatTimeline({ roomId, currentUserId, initialMessages, onReady }: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onReady?.((message) => {
      setMessages((current) =>
        current.some((existingMessage) => existingMessage.id === message.id)
          ? current
          : [...current, message],
      );
    });
  }, [onReady]);

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
          const nextMessage = payload.new as MessageRow;
          setMessages((current) =>
            current.some((message) => message.id === nextMessage.id)
              ? current
              : [...current, nextMessage],
          );
          // Mark as new for animation
          setNewMessageIds((current) => new Set(current).add(nextMessage.id));
          // Clean up animation class after it finishes
          setTimeout(() => {
            setNewMessageIds((current) => {
              const next = new Set(current);
              next.delete(nextMessage.id);
              return next;
            });
          }, 400);
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
  }, [roomId]);

  // Only scroll if the user is already near the bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    // Only auto-scroll if within 100px of the bottom
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
    <div ref={containerRef} className="flex-1 overflow-y-auto py-5">
      <style>{`
        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
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