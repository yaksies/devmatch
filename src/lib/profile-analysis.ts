import { createHash } from "node:crypto";

export type ProfileRow = {
    id: string;
    display_name: string;
    headline: string | null;
    tech_stack: string[] | null;
    interests: string | null;
    discord: string | null;
    email: string | null;
    linkedin: string | null;
    github: string | null;
    projects: string | null;
};

export type GithubRepo = {
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
    url: string;
};

export type GithubProfile = {
    username: string;
    name: string | null;
    bio: string | null;
    publicRepos: number;
    followers: number;
    repos: GithubRepo[];
};
export type ProfileInsight = {
    summary: string;
    confidence: "low" | "medium" | "high";
    generatedAt: string;
};

const ANALYSIS_VERSION = "2026-05-02-v4";

export function normalizeGithubUsername(value: string | null | undefined) {
    if (!value) return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
        if (/^https?:\/\//i.test(trimmed)) {
            const parsed = new URL(trimmed);
            const segment = parsed.pathname.split("/").filter(Boolean)[0];
            return segment ? segment.replace(/^@/, "") : null;
        }
    } catch {
        return trimmed.replace(/^@/, "").replace(/\/$/, "");
    }

    return trimmed.replace(/^@/, "").replace(/\/$/, "");
}

function normalizeProfile(profile: ProfileRow) {
    return {
        id: profile.id,
        displayName: profile.display_name.trim(),
        headline: profile.headline?.trim() ?? "",
        techStack: (profile.tech_stack ?? []).map((item) => item.trim()).filter(Boolean),
        interests: profile.interests?.trim() ?? "",
        discord: profile.discord?.trim() ?? "",
        email: profile.email?.trim() ?? "",
        linkedin: profile.linkedin?.trim() ?? "",
        github: profile.github?.trim() ?? "",
        projects: profile.projects?.trim() ?? "",
    };
}

function fallbackConfidence(profile: ReturnType<typeof normalizeProfile>, github: GithubProfile | null): ProfileInsight["confidence"] {
    const richness = [
        profile.headline,
        profile.interests,
        profile.projects,
        profile.discord,
        profile.email,
        profile.linkedin,
        profile.github,
        ...profile.techStack,
        github?.bio ?? "",
        github?.repos.length ? "repos" : "",
    ].filter(Boolean).length;

    if (richness >= 8) return "high";
    if (richness >= 4) return "medium";
    return "low";
}

function buildFallbackInsight(profile: ReturnType<typeof normalizeProfile>, github: GithubProfile | null): ProfileInsight {
    const techs = profile.techStack.slice(0, 4);
    const repoNames = github?.repos.slice(0, 3).map((repo) => repo.name) ?? [];
    const summaryParts = [
        profile.headline || `${profile.displayName} has a profile with limited written detail, so this is a quick best-effort summary.`,
        profile.projects ? `They mentioned extra projects or experience: ${profile.projects.slice(0, 140)}${profile.projects.length > 140 ? "…" : ""}.` : null,
        github?.bio ? `Their public GitHub bio says: ${github.bio}.` : null,
        techs.length ? `Listed technologies include ${techs.join(", ")}.` : null,
        repoNames.length ? `Recent public repos include ${repoNames.join(", ")}.` : null,
    ].filter(Boolean);

    return {
        summary: summaryParts.join(" "),
        confidence: fallbackConfidence(profile, github),
        generatedAt: new Date().toISOString(),
    };
}

export async function fetchGithubProfile(username: string): Promise<GithubProfile | null> {
    const userResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: {
            accept: "application/vnd.github+json",
            "user-agent": "DevMatch",
        },
        cache: "no-store",
    });

    if (!userResponse.ok) {
        return null;
    }

    const userData = (await userResponse.json()) as {
        login: string;
        name: string | null;
        bio: string | null;
        public_repos: number;
        followers: number;
    };

    const reposResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=6&sort=updated`, {
        headers: {
            accept: "application/vnd.github+json",
            "user-agent": "DevMatch",
        },
        cache: "no-store",
    });

    let reposData: Array<{
        name: string;
        description: string | null;
        language: string | null;
        stargazers_count: number;
        html_url: string;
    }> = [];

    if (reposResponse.ok) {
        reposData = (await reposResponse.json()) as Array<{
            name: string;
            description: string | null;
            language: string | null;
            stargazers_count: number;
            html_url: string;
        }>;
    }

    return {
        username: userData.login,
        name: userData.name,
        bio: userData.bio,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        repos: reposData.slice(0, 6).map((repo) => ({
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            url: repo.html_url,
        })),
    };
}

function extractJsonObject(value: string) {
    const trimmed = value.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");

    if (start < 0 || end < 0 || end <= start) {
        throw new Error("AI response did not contain JSON");
    }

    return JSON.parse(trimmed.slice(start, end + 1)) as Partial<ProfileInsight>;
}

export function getProfileInsightSignature(profile: ProfileRow, github: GithubProfile | null) {
    const normalized = normalizeProfile(profile);

    return createHash("sha256")
        .update(
            JSON.stringify({
                version: ANALYSIS_VERSION,
                profile: normalized,
                github,
            }),
        )
        .digest("hex");
}

export async function generateProfileInsight(profile: ProfileRow, github: GithubProfile | null) {
    const normalized = normalizeProfile(profile);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        return buildFallbackInsight(normalized, github);
    }

    const payload = { profile: normalized, github };

    const prompt = [
        "Analyze this hackathon participant profile for teammate matching.",
        "Use only the supplied profile fields and any public GitHub signals.",
        "Do not claim access to private LinkedIn or resume content.",
        "Return valid JSON with keys: summary (string), confidence (low|medium|high).",
        "Thoroughly summarize all the information available, including their public GitHub repositories, to provide a comprehensive overview of the candidate.",
        JSON.stringify(payload),
    ].join("\n\n");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
        apiKey,
    )}`;

    const maxAttempts = 3;
    let attempt = 0;
    let response: Response | null = null;

    while (attempt < maxAttempts) {
        attempt += 1;
        response = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json",
                },
            }),
            cache: "no-store",
        });

        if (response.ok) break;

        const bodyText = await response.text();
        if (response.status === 429 && attempt < maxAttempts) {
            const backoffMs = 250 * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
            console.warn(`Gemini 429 rate-limited, attempt ${attempt}, backing off ${backoffMs}ms`);
            await new Promise((res) => setTimeout(res, backoffMs));
            continue;
        }

        console.error("Gemini API Error:", response.status, bodyText);
        return buildFallbackInsight(normalized, github);
    }

    if (!response || !response.ok) {
        return buildFallbackInsight(normalized, github);
    }

    const data = (await response.json()) as {
        candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
        }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

    try {
        const parsed = extractJsonObject(text);
        const fallback = buildFallbackInsight(normalized, github);

        return {
            summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : fallback.summary,
            confidence: parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
                ? parsed.confidence
                : fallback.confidence,
            generatedAt: new Date().toISOString(),
        };
    } catch (e) {
        console.error("Gemini Parse Error:", e, "Raw text:", text);
        return buildFallbackInsight(normalized, github);
    }
}
