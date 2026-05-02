export default function ChatPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        Messages
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        After two people like each other, open a room backed by Supabase
        Realtime on <code className="rounded bg-[var(--muted-bg)] px-1">chat_messages</code>
        . Enable replication for that table in the Supabase dashboard, then
        subscribe with{" "}
        <code className="rounded bg-[var(--muted-bg)] px-1">
          supabase.channel(...)
        </code>{" "}
        from the browser client.
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center text-sm text-[var(--muted)]">
        No active chats yet — matching UI comes next.
      </div>
    </div>
  );
}
