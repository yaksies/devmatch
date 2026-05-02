export type ScrapedEvent = {
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

const SOURCE_SEEDS: SourceSeed[] = [
  {
    source: "mlh",
    listingUrl: "https://www.mlh.com/seasons/2026/events",
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
    url: "https://www.mlh.com/seasons/2026/events",
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
    url: "https://www.mlh.com/seasons/2026/events",
  },
];

const HTTP_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
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
  const anchors: Array<{ href: string; text: string; html: string }> = [];
  const anchorMatches = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];

  for (const match of anchorMatches) {
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
        anchors.push({ href, text, html: innerHtml });
      }
    } catch {
      continue;
    }
  }

  return anchors;
}

function parseDateRange(text: string) {
  const monthDayYear = text.match(
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}(?:\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2})?(?:,?\s+\d{4})?/i,
  );

  if (monthDayYear?.[0]) {
    return monthDayYear[0].replace(/\s+/g, " ").trim();
  }

  const match = text.match(/\b\d+\s+(?:days?|hours?)\s+left\b/i);
  return match?.[0] ?? "Date coming soon";
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

function titleConfidence(value: string) {
  const title = collapseRepeatedPrefix(value);
  const lowered = title.toLowerCase();

  if (!isLikelyEventTitle(title)) {
    return 0;
  }

  let score = 0;

  if (/hackathon|hack|challenge|devpost/i.test(lowered)) score += 4;
  if (/[A-Z][a-z].+[A-Z][a-z]/.test(title)) score += 2;
  if (/[0-9]{2,4}/.test(title)) score += 1;
  if (title.split(" ").length >= 2) score += 1;
  if (/^[A-Z]/.test(title)) score += 1;
  if (title.length > 8) score += 1;

  return score;
}

function isLikelyEventTitle(value: string) {
  const title = normalizeWhitespace(value).toLowerCase();

  if (!title) {
    return false;
  }

  const blockedPatterns = [
    /^mlh\s+logo$/i,
    /^logo$/i,
    /^join\s+a\s+hackathon$/i,
    /^join\s+the\s+hackathon$/i,
    /^browse(\s+all)?$/i,
    /^view(\s+all)?$/i,
    /^learn\s+more$/i,
    /^sign\s+up$/i,
    /^submit$/i,
    /^apply$/i,
    /^home$/i,
    /^about$/i,
    /^events?$/i,
    /^hackathons?$/i,
    /^sponsors?$/i,
  ];

  if (blockedPatterns.some((pattern) => pattern.test(title))) {
    return false;
  }

  if (/(?:\bmlh\s+logo\b|\blogo\b|\bnavbar\b|\bmenu\b|\bfooter\b)/i.test(title)) {
    return false;
  }

  return /[a-z]/i.test(title) && title.length >= 4;
}

function extractImageUrl(innerHtml: string, baseUrl: string) {
  const imageMatch = innerHtml.match(/<img\b[^>]*(?:src|data-src)=["']([^"']+)["']/i);

  if (!imageMatch?.[1]) {
    return undefined;
  }

  try {
    return new URL(imageMatch[1], baseUrl).toString();
  } catch {
    return undefined;
  }
}

function pickBestTitle(anchors: Array<{ text: string; href: string; html: string }>, source: ScrapedEvent["source"]) {
  const sourceHint = source === "mlh" ? /hackathon|event|season|mlh/i : /hackathon|challenge|devpost|project/i;

  const titleCandidates = anchors
    .map((anchor) => {
      const text = collapseRepeatedPrefix(anchor.text);

      return {
        ...anchor,
        text,
        score: titleConfidence(text) + Number(sourceHint.test(text)),
      };
    })
    .filter((anchor) => anchor.score >= 4);

  const sorted = titleCandidates.sort((left, right) => right.score - left.score);
  return sorted[0];
}

function buildEvent(seed: SourceSeed, anchor: { href: string; text: string; html: string }, index: number): ScrapedEvent {
  const plainText = normalizeWhitespace(decodeEntities(anchor.text));
  const segments = plainText.split(" • ").map(normalizeWhitespace).filter(Boolean);
  const name = collapseRepeatedPrefix(segments[0] ?? plainText) || "Hackathon";
  const details = segments.slice(1).join(" • ") || plainText;

  return {
    id: `${seed.source}-${index}-${anchor.href}`,
    name,
    date: parseDateRange(details),
    location: /online/i.test(details) ? "Online" : (details.match(/(?:Location|Where)[:\s]+([^•|\n]+)/i)?.[1] ?? "Online").trim(),
    source: seed.source,
    url: anchor.href,
    description: details.length > name.length ? details : undefined,
    image: extractImageUrl(anchor.html, seed.listingUrl),
  };
}

async function scrapeSource(seed: SourceSeed): Promise<ScrapedEvent[]> {
  const html = await fetchHtml(seed.listingUrl);
  const anchors = extractAnchors(html, seed.listingUrl);
  const ranked = anchors
    .map((anchor) => {
      const text = collapseRepeatedPrefix(anchor.text);

      return {
        ...anchor,
        text,
        score: titleConfidence(text) + Number(/hackathon|event|challenge|devpost|mlh/i.test(anchor.html)),
      };
    })
    .filter((anchor) => anchor.score >= 4)
    .sort((left, right) => right.score - left.score);

  const best = pickBestTitle(ranked, seed.source);

  if (!best) {
    return [];
  }

  const uniqueAnchors = ranked.filter((anchor, index, list) => {
    const normalized = normalizeWhitespace(anchor.text).toLowerCase();

    return index === list.findIndex((candidate) => normalizeWhitespace(candidate.text).toLowerCase() === normalized);
  });

  return uniqueAnchors.slice(0, 12).map((anchor, index) => buildEvent(seed, anchor, index));
}

export async function scrapeHackathonEvents() {
  const results = await Promise.allSettled(SOURCE_SEEDS.map((seed) => scrapeSource(seed)));
  const events = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  if (events.length > 0) {
    return events;
  }

  return FALLBACK_EVENTS;
}