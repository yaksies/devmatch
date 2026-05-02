"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getOrderedMatchPair(userId: string, targetId: string) {
  return userId < targetId
    ? { user_a: userId, user_b: targetId }
    : { user_a: targetId, user_b: userId };
}

async function ensureMatchRoom(userId: string, targetId: string) {
  const supabase = await createClient();
  const pair = getOrderedMatchPair(userId, targetId);

  console.log(`[ensureMatchRoom] Checking for reciprocal swipe: swiper=${targetId}, target=${userId}`);
  const { data: reciprocalSwipe } = await supabase
    .from("swipes")
    .select("id")
    .eq("swiper_id", targetId)
    .eq("target_id", userId)
    .eq("direction", "like")
    .maybeSingle();

  console.log("[ensureMatchRoom] Reciprocal swipe found:", reciprocalSwipe);

  if (!reciprocalSwipe) {
    console.log("[ensureMatchRoom] No reciprocal swipe, returning null");
    return { matchId: null };
  }

  console.log("[ensureMatchRoom] Creating match with pair:", pair);
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .upsert(pair, { onConflict: "user_a,user_b" })
    .select("id")
    .single();

  if (matchError || !match) {
    console.error("[ensureMatchRoom] Error creating match:", matchError);
    return { error: matchError };
  }

  console.log("[ensureMatchRoom] Match created:", match.id);

  console.log("[ensureMatchRoom] Creating chat room");
  const { error: roomError } = await supabase
    .from("chat_rooms")
    .upsert({ match_id: match.id }, { onConflict: "match_id" });

  console.log("[ensureMatchRoom] Chat room creation result:", roomError ? "error" : "success");

  return roomError ? { error: roomError } : { matchId: match.id };
}

export async function acceptBack(targetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  console.log(`[acceptBack] User ${user.id} accepting ${targetId}`);

  const { error } = await supabase.from("swipes").upsert({
    swiper_id: user.id,
    target_id: targetId,
    direction: "like",
  });

  if (error) {
    console.error("[acceptBack] Error creating swipe:", error);
    redirect(`/notifications?message=${encodeURIComponent(error.message)}`);
  }

  console.log("[acceptBack] Swipe created, calling ensureMatchRoom");
  const matchResult = await ensureMatchRoom(user.id, targetId);
  console.log("[acceptBack] ensureMatchRoom result:", matchResult);

  if ("error" in matchResult && matchResult.error) {
    console.error("[acceptBack] Error creating match:", matchResult.error);
    redirect(`/notifications?message=${encodeURIComponent(matchResult.error.message)}`);
  }

  revalidatePath("/notifications");
  revalidatePath("/accepted");
  revalidatePath("/chat");
  console.log("[acceptBack] Redirecting to chat with matchId:", matchResult.matchId);
  redirect(matchResult.matchId ? `/chat?with=${targetId}` : "/accepted");
}

export async function undoSwipe(targetId: string, from: string = "passed", shouldRedirect: boolean = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  console.log(`[undoSwipe] Deleting swipe for user ${user.id}, target ${targetId}`);

  const { error, count } = await supabase
    .from("swipes")
    .delete()
    .eq("swiper_id", user.id)
    .eq("target_id", targetId);

  if (error) {
    console.error(`[undoSwipe] Error deleting swipe: ${error.message}`);
    if (shouldRedirect) {
      redirect(`/${from}?message=${encodeURIComponent(error.message)}`);
    }
    return { error: error.message };
  }

  console.log(`[undoSwipe] Successfully deleted ${count} swipe(s)`);

  const pair = getOrderedMatchPair(user.id, targetId);
  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("user_a", pair.user_a)
    .eq("user_b", pair.user_b)
    .maybeSingle();

  if (match) {
    console.log(`[undoSwipe] Deleting match ${match.id}`);
    await supabase.from("matches").delete().eq("id", match.id);
  }

  console.log(`[undoSwipe] Revalidating paths`);
  revalidatePath("/passed");
  revalidatePath("/accepted");
  revalidatePath("/discover");
  revalidatePath("/notifications");
  revalidatePath("/chat");

  if (shouldRedirect) {
    redirect(`/${from}`);
  }

  console.log(`[undoSwipe] Complete`);
  return { success: true };
}
export async function deleteSwipe(targetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("swipes")
    .delete()
    .eq("swiper_id", user.id)
    .eq("target_id", targetId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/passed");
  revalidatePath("/accepted");
  revalidatePath("/discover");
  revalidatePath("/notifications");

  return { success: true };
}

export async function passBack(targetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  console.log(`[passBack] User ${user.id} passing on ${targetId}`);

  const { error } = await supabase.from("swipes").upsert({
    swiper_id: user.id,
    target_id: targetId,
    direction: "pass",
  });

  if (error) {
    console.error("[passBack] Error creating pass swipe:", error);
    return { error: error.message };
  }

  revalidatePath("/notifications");
  revalidatePath("/discover");

  return { success: true };
}
