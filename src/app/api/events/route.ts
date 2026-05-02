import { NextResponse } from "next/server";

import { scrapeHackathonEvents } from "@/lib/events/scrape-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const events = await scrapeHackathonEvents();

  return NextResponse.json(
    {
      events,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}