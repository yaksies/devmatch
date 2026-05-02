import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { mockDiscoverDeck } from "@devmatch/shared";
import {
  fetchGithubProfile,
  generateProfileInsight,
  getProfileInsightSignature,
  normalizeGithubUsername,
  type ProfileInsight,
} from "@/lib/profile-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const profileId = resolvedParams.id;

  if (!profileId) {
    return jsonError("Missing profile id", 400);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, headline, tech_stack, interests, discord, email, linkedin, github, projects")
    .eq("id", profileId)
    .maybeSingle();

  const mockProfile = !profile ? mockDiscoverDeck.find((item) => item.id === profileId) : null;

  if (error && !mockProfile) {
    return jsonError("Profile not found", 404);
  }

  if (!profile && !mockProfile) {
    return jsonError("Profile not found", 404);
  }

  const analysisProfile = profile ?? {
    id: mockProfile!.id,
    display_name: mockProfile!.displayName,
    headline: mockProfile!.headline,
    tech_stack: mockProfile!.techStack,
    interests: mockProfile!.interests,
    discord: null,
    email: null,
    linkedin: null,
    github: null,
    projects: null,
  };

  const normalizedGithub = normalizeGithubUsername(analysisProfile.github);
  const githubProfile = normalizedGithub ? await fetchGithubProfile(normalizedGithub) : null;
  const signature = getProfileInsightSignature(analysisProfile, githubProfile);

  const { data: cachedInsight } = await supabase
    .from("profile_ai_insights")
    .select("signature,payload,generated_at")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (cachedInsight?.signature === signature && cachedInsight.payload) {
    return NextResponse.json({
      cached: true,
      signature,
      profileId,
      insight: cachedInsight.payload as ProfileInsight,
    });
  }

  const insight = await generateProfileInsight(analysisProfile, githubProfile);

  const { error: upsertError } = await supabase.from("profile_ai_insights").upsert({
    profile_id: profileId,
    signature,
    payload: insight,
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    return NextResponse.json({
      cached: false,
      signature,
      profileId,
      insight,
      warning: upsertError.message,
    });
  }

  return NextResponse.json({
    cached: false,
    signature,
    profileId,
    insight,
  });
}