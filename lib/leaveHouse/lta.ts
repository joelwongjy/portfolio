// Singapore LTA DataMall — live bus arrivals. Server-side helper so the
// AccountKey (LTA_ACCOUNT_KEY env var) never reaches the browser.
// Free key: https://datamall.lta.gov.sg

export interface BusArrival {
  serviceNo: string;
  /** Up to three upcoming ISO arrival times, soonest first. */
  arrivals: string[];
}

const BASE =
  "https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival";

interface LtaNextBus {
  EstimatedArrival?: string;
}
interface LtaService {
  ServiceNo: string;
  NextBus?: LtaNextBus;
  NextBus2?: LtaNextBus;
  NextBus3?: LtaNextBus;
}

export async function fetchBusArrivals(
  accountKey: string,
  busStopCode: string
): Promise<BusArrival[]> {
  const url = `${BASE}?BusStopCode=${encodeURIComponent(busStopCode)}`;
  const res = await fetch(url, {
    headers: { AccountKey: accountKey, accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`LTA ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { Services?: LtaService[] };
  return (data.Services ?? [])
    .map((svc) => ({
      serviceNo: svc.ServiceNo,
      arrivals: [svc.NextBus, svc.NextBus2, svc.NextBus3]
        .map((b) => b?.EstimatedArrival)
        .filter((t): t is string => !!t)
        .sort(),
    }))
    .filter((s) => s.arrivals.length > 0)
    .sort((a, b) =>
      a.serviceNo.localeCompare(b.serviceNo, undefined, { numeric: true })
    );
}
