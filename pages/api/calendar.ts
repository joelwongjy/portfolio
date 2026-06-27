// GET /api/calendar?url=<ics url>
//
// Fetches and parses a public iCalendar feed server-side (avoids browser CORS)
// and returns upcoming located events. Works with iCloud "Public Calendar"
// share links and Google Calendar "Secret address in iCal format" URLs.

import type { NextApiRequest, NextApiResponse } from "next";

import { parseIcs } from "@/lib/leaveHouse/ics";
import { CalEvent } from "@/lib/leaveHouse/types";

type Data = { events: CalEvent[] } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { url } = req.query;
  if (typeof url !== "string" || !url) {
    return res.status(400).json({ error: "url is required" });
  }

  // Accept webcal:// (Apple's scheme) by normalizing to https.
  let target = url.trim();
  if (target.startsWith("webcal://")) {
    target = "https://" + target.slice("webcal://".length);
  }
  if (!/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: "url must be http(s) or webcal" });
  }

  try {
    const upstream = await fetch(target, {
      headers: { Accept: "text/calendar, text/plain, */*" },
    });
    if (!upstream.ok) {
      return res
        .status(502)
        .json({ error: `calendar fetch failed (${upstream.status})` });
    }
    const raw = await upstream.text();
    const nowMs = Date.now();
    const events = parseIcs(raw)
      .filter((e) => new Date(e.start).getTime() > nowMs)
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      )
      .slice(0, 25);

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ events });
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    return res.status(502).json({ error: message });
  }
}
