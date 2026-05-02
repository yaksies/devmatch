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

  const { data: reciprocalSwipe } = await supabase
    .from("swipes")
    .select("id")
    .eq("swiper_id", targetId)
    .eq("target_id", userId)
    .eq("direction", "like")
    .maybeSingle();

  if (!reciprocalSwipe) {
    return { matchId: null };
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .upsert(pair, { onConflict: "user_a,user_b" })
    .select("id")
    .single();

  if (matchError || !match) {
    return { error: matchError };
  }

  const { error: roomError } = await supabase
    .from("chat_rooms")
    .upsert({ match_id: match.id }, { onConflict: "match_id" });

  return roomError ? { error: roomError } : { matchId: match.id };
}

export async function acceptBack(targetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("swipes").upsert({
    swiper_id: user.id,
    target_id: targetId,
    direction: "like",
  });

  if (error) {
    redirect(`/notifications?message=${encodeURIComponent(error.message)}`);
  }

  const matchResult = await ensureMatchRoom(user.id, targetId);
  if ("error" in matchResult && matchResult.error) {
    redirect(`/notifications?message=${encodeURIComponent(matchResult.error.message)}`);
  }

  revalidatePath("/notifications");
  revalidatePath("/accepted");
  revalidatePath("/chat");
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
