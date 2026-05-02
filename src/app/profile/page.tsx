import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
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
      <ProfileForm />
    </div>
  );
}
