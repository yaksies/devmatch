import { NextResponse } from "next/server";

type ScrapedEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  source: "mlh" | "devpost" | "other";
  url: string;
  description?: string;
  image?: string;
};

type SourceSeed = {
  source: ScrapedEvent["source"];
  listingUrl: string;
};

type ListingCard = {
  name: string;
  date: string;
  location: string;
  url: string;
  source: ScrapedEvent["source"];
  description?: string;
  image?: string;
};

const SOURCE_SEEDS: SourceSeed[] = [
  {
    source: "mlh",
    listingUrl: "https://mlh.io/seasons/2026/events",
  },
  {
    source: "devpost",
    listingUrl: "https://devpost.com/hackathons",
  },
];

const FALLBACK_EVENTS: ScrapedEvent[] = [
  {
    id: "fallback-1",
    name: "HackMIT",
    date: "Sep 19-20, 2026",
    location: "Cambridge, MA",
    source: "mlh",
    url: "https://mlh.io/seasons/2026/events",
  },
  {
    id: "fallback-2",
    name: "Orion Build Challenge",
    date: "Apr 10 - May 02, 2026",
    location: "Online",
    source: "devpost",
    url: "https://orion-build-challenge.devpost.com/",
  },
  {
    id: "fallback-3",
    name: "HackUMass",
    date: "June 14-16, 2026",
    location: "Amherst, MA",
    source: "mlh",
    url: "https://mlh.io/seasons/2026/events",
  },
];

const HTTP_HEADERS = {
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function collapseRepeatedPrefix(value: string) {
  const words = normalizeWhitespace(value).split(" ").filter(Boolean);

  for (let size = 1; size <= Math.floor(words.length / 2); size += 1) {
    const candidate = words.slice(0, size).join(" ");
    let cursor = 0;

    while (cursor + size <= words.length && words.slice(cursor, cursor + size).join(" ") === candidate) {
      cursor += size;
    }

    if (cursor === words.length) {
      return candidate;
    }
  }

  return normalizeWhitespace(value);
}

function titleCaseSlug(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function titleFromUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const subdomain = parsed.hostname.split(".")[0] || "";

    if (subdomain && subdomain !== "devpost" && subdomain !== "www") {
      return titleCaseSlug(subdomain);
    }

    const slug = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    if (slug) {
      return titleCaseSlug(slug.replace(/^\d+-/, ""));
    }

    return "";
  } catch {
    return "";
  }
}

function parseDateRange(text: string) {
  const match = text.match(
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}(?:\s*[-–]\s*(?:\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}))?(?:,?\s+\d{4})?/i,
  );

  return match?.[0] ? normalizeWhitespace(match[0]) : "Date coming soon";
}

function extractImageUrl(innerHtml: string, baseUrl: string) {
  // Check inline <img> tags
  const imageMatch = innerHtml.match(/<img\b[^>]*(?:src|data-src)=["']([^"']+)["']/i);
  if (imageMatch?.[1]) {
    try {
      return new URL(imageMatch[1], baseUrl).toString();
    } catch {}
  }

  // Check inline style background-image: url(...)
  const bgMatch = innerHtml.match(/background(?:-image)?\s*:\s*url\(([^)]+)\)/i);
  if (bgMatch?.[1]) {
    const cleaned = bgMatch[1].replace(/^["']|["']$/g, "").trim();
    try {
      return new URL(cleaned, baseUrl).toString();
    } catch {}
  }

  return undefined;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: HTTP_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function extractAnchors(html: string, baseUrl: string) {
  const anchors: Array<{ href: string; text: string; html: string; context: string }> = [];
  const matches = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];

  for (const match of matches) {
    const attrs = match[1];
    const innerHtml = match[2];
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);

    if (!hrefMatch) {
      continue;
    }

    try {
      const href = new URL(hrefMatch[1], baseUrl).toString();
      const text = normalizeWhitespace(decodeEntities(innerHtml.replace(/<[^>]+>/g, " ")));

      if (text) {
        const start = Math.max(0, (match.index ?? 0) - 300);
        const end = Math.min(html.length, (match.index ?? 0) + match[0].length + 300);
        const context = html.slice(start, end);
        anchors.push({ href, text, html: innerHtml, context });
      }
    } catch {
      continue;
    }
  }

  return anchors;
}

function extractMlhCard(anchor: { href: string; text: string; html: string; context?: string }): ListingCard | null {
  const text = anchor.text.replace(/\bbackground\b/gi, " ");
  const dateMatch = text.match(
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}\s*[-–]\s*(?:\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2})/i,
  );

  if (!dateMatch) {
    return null;
  }

  const splitIndex = text.indexOf(dateMatch[0]);
  const rawName = normalizeWhitespace(text.slice(0, splitIndex));
  const cleanedName = rawName.replace(/\b(background|event|hackathon)\b/gi, " ").replace(/\s{2,}/g, " ").trim();
  const title = collapseRepeatedPrefix(cleanedName);

  const locationPart = normalizeWhitespace(text.slice(splitIndex + dateMatch[0].length));
  const location = locationPart.replace(/\b(?:DIGITAL|IN-PERSON|HYBRID|DIVERSITY|HIGH SCHOOL)\b/gi, " ");

  const url = anchor.href;
  const name = collapseRepeatedPrefix(titleFromUrl(url) || title || cleanedName || "MLH event");

  return {
    name,
    date: parseDateRange(dateMatch[0]),
    location: location || "Location coming soon",
    url,
    source: "mlh",
    description: cleanedName && cleanedName !== name ? cleanedName : undefined,
    image: extractImageUrl(anchor.context || anchor.html, anchor.href),
  };
}

function extractDevpostCard(anchor: { href: string; text: string; html: string; context?: string }): ListingCard | null {
  const text = anchor.text;
  const url = anchor.href;

  const isChallengeLink = /(?:^|\.)devpost\.com\/\?(?:.*ref_feature=challenge|.*ref_medium=discover)/i.test(url)
    || /(?:^|\.)devpost\.com\/[^/?#]+/i.test(url);

  if (!isChallengeLink || /\/hackathons(?:$|[/?#])/i.test(url)) {
    return null;
  }

  const titleMatch = text.match(/^(.+?)(?:\s+\b(?:\d+\s+(?:days?|hours?)\s+left|[A-Z][a-z]{2}\s+\d{1,2}\s*-\s*[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})\b)/);
  const name = collapseRepeatedPrefix(titleFromUrl(url) || normalizeWhitespace((titleMatch?.[1] ?? text).replace(/^\[?Online\]?/i, ""))) || "Devpost hackathon";
  const date = parseDateRange(text);

  return {
    name,
    date,
    location: text.includes("Online") ? "Online" : "Location coming soon",
    url,
    source: "devpost",
    description: normalizeWhitespace(text.replace(titleMatch?.[1] ?? name, "")).slice(0, 180) || undefined,
    image: extractImageUrl(anchor.context || anchor.html, anchor.href),
  };
}

function isLikelyEventCard(anchor: { href: string; text: string }, source: ScrapedEvent["source"]) {
  if (!anchor.text) return false;

  if (source === "mlh") {
    return /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}\s*[-–]\s*\d{1,2}/i.test(anchor.text);
  }

  if (source === "devpost") {
    return /\b(?:\d+\s+(?:days?|hours?)\s+left|[A-Z][a-z]{2}\s+\d{1,2}\s*-\s*[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})\b/i.test(anchor.text);
  }

  return false;
}

async function scrapeSource(seed: SourceSeed) {
  try {
    const listingHtml = await fetchHtml(seed.listingUrl);
    const anchors = extractAnchors(listingHtml, seed.listingUrl).filter((anchor) =>
      isLikelyEventCard(anchor, seed.source),
    );

    const cards = anchors
      .map((anchor) => {
        if (seed.source === "mlh") {
          return extractMlhCard(anchor);
        }

        if (seed.source === "devpost") {
          return extractDevpostCard(anchor);
        }

        return null;
      })
      .filter((card): card is ListingCard => Boolean(card));

    return cards.map((card) => ({
      id: `${card.source}:${card.url}`,
      name: card.name,
      date: card.date,
      location: card.location,
      source: card.source,
      url: card.url,
      description: card.description,
      image: card.image,
    }));
  } catch {
    return [];
  }
}

async function probeImageFromPage(url: string, baseUrl: string) {
  try {
    const html = await fetchHtml(url);

    // Look for og:image meta
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    if (ogMatch?.[1]) {
      try {
        return new URL(ogMatch[1], baseUrl).toString();
      } catch {}
    }

    // Look for first <img src=> on the page
    const imgMatch = html.match(/<img\b[^>]*(?:src|data-src)=['"]([^'"\s>]+)['"]/i);
    if (imgMatch?.[1]) {
      try {
        return new URL(imgMatch[1], baseUrl).toString();
      } catch {}
    }

    // background-image in inline styles
    const bgMatch = html.match(/background(?:-image)?\s*:\s*url\(([^)]+)\)/i);
    if (bgMatch?.[1]) {
      const cleaned = bgMatch[1].replace(/^["']|["']$/g, "").trim();
      try {
        return new URL(cleaned, baseUrl).toString();
      } catch {}
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export async function scrapeHackathonEvents() {
  const scraped = await Promise.all(SOURCE_SEEDS.map((seed) => scrapeSource(seed)));
  const deduped = new Map<string, ScrapedEvent>();

  for (const event of scraped.flat()) {
    const key = `${event.name.toLowerCase()}|${event.date.toLowerCase()}|${event.location.toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, event);
    }
  }

  let results = [...deduped.values()];

  // If we have too few results, fall back to more permissive anchors (try to include more)
  if (results.length < 12) {
    try {
      // Try rescanning seeds for additional anchors by grabbing more anchors per page
      const extra = await Promise.all(
        SOURCE_SEEDS.map(async (seed) => {
          const html = await fetchHtml(seed.listingUrl);
          const anchors = extractAnchors(html, seed.listingUrl);
          return anchors
            .slice(0, 72)
            .filter((a) => isLikelyEventCard(a, seed.source))
            .map((a) => ({ href: a.href, text: a.text }));
        }),
      );

      // flatten and attempt to convert loose anchors into minimal events
      for (const group of extra.flat()) {
        const id = `other:${group.href}`;
        if (!deduped.has(id)) {
          deduped.set(id, {
            id,
            name: titleFromUrl(group.href) || normalizeWhitespace(group.text).slice(0, 60) || "Hackathon",
            date: "Date coming soon",
            location: "Location coming soon",
            source: "other",
            url: group.href,
          });
        }
      }

      results = [...deduped.values()];
    } catch {
      // ignore
    }
  }

  // For items missing images, probe their linked page for og:image / img (limit probes)
  const probeLimit = 36;
  const toProbe = results.filter((r) => !r.image).slice(0, probeLimit);
  await Promise.all(
    toProbe.map(async (r) => {
      try {
        const found = await probeImageFromPage(r.url, r.url);
        if (found) r.image = found;
      } catch {}
    }),
  );

  return results.length > 0 ? results : FALLBACK_EVENTS;
}