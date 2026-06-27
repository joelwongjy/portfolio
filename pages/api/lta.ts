// GET /api/lta?stop=83139
//
// Proxies Singapore LTA DataMall live bus arrivals. The AccountKey is read from
// the LTA_ACCOUNT_KEY env var, so it stays server-side. Get a free key at
// https://datamall.lta.gov.sg.

import type { NextApiRequest, NextApiResponse } from "next";

import { BusArrival, fetchBusArrivals } from "@/lib/leaveHouse/lta";

type Data = { arrivals: BusArrival[] } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { stop } = req.query;
  if (typeof stop !== "string" || !stop) {
    return res.status(400).json({ error: "stop (bus stop code) is required" });
  }
  const key = process.env.LTA_ACCOUNT_KEY;
  if (!key) {
    return res
      .status(400)
      .json({ error: "LTA_ACCOUNT_KEY is not configured on the server." });
  }
  try {
    const arrivals = await fetchBusArrivals(key, stop);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ arrivals });
  } catch (err) {
    const message = err instanceof Error ? err.message : "lookup failed";
    return res.status(502).json({ error: message });
  }
}
