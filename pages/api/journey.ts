// GET /api/journey?from=...&to=...&arriveBy=<ISO>
//
// Proxies the configured transit provider so the API key never reaches the
// browser. With no GOOGLE_MAPS_API_KEY set it transparently uses the mock
// provider, so the app is fully usable out of the box.

import type { NextApiRequest, NextApiResponse } from "next";

import { resolveProvider } from "@/lib/leaveHouse/transit";
import { JourneyResult } from "@/lib/leaveHouse/types";

type Data = JourneyResult | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { from, to, arriveBy } = req.query;
  if (typeof from !== "string" || typeof to !== "string") {
    return res.status(400).json({ error: "from and to are required" });
  }
  const arrive =
    typeof arriveBy === "string" && arriveBy
      ? arriveBy
      : new Date().toISOString();

  try {
    const provider = resolveProvider();
    const result = await provider.getJourney({
      origin: from,
      destination: to,
      arriveBy: arrive,
    });
    // Transit data is time-sensitive; let clients cache only very briefly.
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "lookup failed";
    return res.status(502).json({ error: message });
  }
}
