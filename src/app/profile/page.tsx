import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch existing profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Your hackathon profile
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This card is what others see while swiping. Keep it short and
          specific.
        </p>
      </div>
      <ProfileForm initialProfile={profile} />
    </div>
  );
}
