"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function sendMessage(roomId: string, peerId: string, formData: FormData) {
  const body = String(formData.get("message") ?? "").trim();

  if (!body) {
    redirect(`/chat?with=${peerId}&message=${encodeURIComponent("Message cannot be empty.")}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("chat_messages").insert({
    room_id: roomId,
    sender_id: user.id,
    body,
  });

  if (error) {
    redirect(`/chat?with=${peerId}&message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/chat");
  redirect(`/chat?with=${peerId}`);
}