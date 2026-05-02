"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/login?message=" + encodeURIComponent(error.message));
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data: authData } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/login?message=" + encodeURIComponent(error.message));
  }

  // After signup, we also want to insert an empty profile row to ensure they exist
  // Wait, the DB has "id references auth.users (id) on delete cascade", but we must insert the profile!
  if (authData.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      display_name: data.email.split("@")[0], // default display name
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
