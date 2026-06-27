// Pluggable transit providers. The app only ever talks to the `TransitProvider`
// interface, so swapping Google for a city feed (TfL/GTFS) later is a one-file
// change. These run server-side (in /api/journey) so API keys stay secret.
//
// Why not Citymapper? Citymapper shut down its public/self-serve developer API
// in June 2023 (existing keys stopped working), so it is no longer an option
// for an individual app. Google Routes gives equivalent next-departure +
// journey-duration data with global coverage.

import { JourneyLeg, JourneyOption, JourneyResult } from "./types";

export interface JourneyQuery {
  origin: string;
  destination: string;
  /** ISO-8601 — we want to arrive by this time. */
  arriveBy: string;
}

export interface TransitProvider {
  name: string;
  getJourney(q: JourneyQuery): Promise<JourneyResult>;
}

// ---------------------------------------------------------------------------
// Mock provider — works with zero configuration so the whole app is usable and
// testable without any API key. It invents a believable bus service.
// ---------------------------------------------------------------------------

export class MockTransitProvider implements TransitProvider {
  name = "mock";

  async getJourney(q: JourneyQuery): Promise<JourneyResult> {
    const arriveBy = new Date(q.arriveBy).getTime();
    const journeyMin = 34; // total door-to-door
    const walkToStopMin = 6;
    const rideMin = journeyMin - walkToStopMin - 4; // 4 = walk at the far end
    const headwayMin = 12; // a bus every 12 minutes

    // Three departures spaced by the headway, the latest arriving ~on time.
    const options: JourneyOption[] = [0, 1, 2].map((i) => {
      const arrival = arriveBy - i * headwayMin * 60 * 1000;
      const departure = arrival - journeyMin * 60 * 1000;
      const busDeparture = departure + walkToStopMin * 60 * 1000;
      const legs: JourneyLeg[] = [
        {
          mode: "WALK",
          durationSeconds: walkToStopMin * 60,
          departureTime: new Date(departure).toISOString(),
        },
        {
          mode: "TRANSIT",
          line: "Bus 12",
          headsign: "towards Town Centre",
          departureStop: "Home Road",
          departureTime: new Date(busDeparture).toISOString(),
          durationSeconds: rideMin * 60,
        },
        { mode: "WALK", durationSeconds: 4 * 60 },
      ];
      return {
        departureTime: new Date(departure).toISOString(),
        arrivalTime: new Date(arrival).toISOString(),
        durationSeconds: journeyMin * 60,
        summary: "Bus 12 → walk",
        legs,
      };
    });

    // Earliest first.
    options.reverse();
    return {
      provider: this.name,
      origin: q.origin,
      destination: q.destination,
      options,
    };
  }
}

// ---------------------------------------------------------------------------
// Google Routes API provider (routes.googleapis.com computeRoutes, TRANSIT).
// Needs env var GOOGLE_MAPS_API_KEY with the Routes API enabled.
// ---------------------------------------------------------------------------

const ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

const FIELD_MASK = [
  "routes.duration",
  "routes.legs.duration",
  "routes.legs.startLocation",
  "routes.legs.steps.travelMode",
  "routes.legs.steps.staticDuration",
  "routes.legs.steps.transitDetails",
].join(",");

interface GoogleStep {
  travelMode?: string;
  staticDuration?: string; // e.g. "360s"
  transitDetails?: {
    stopDetails?: {
      departureStop?: { name?: string };
      departureTime?: string;
    };
    transitLine?: {
      nameShort?: string;
      name?: string;
      vehicle?: { type?: string };
    };
    headsign?: string;
  };
}

interface GoogleRoute {
  duration?: string;
  legs?: { duration?: string; steps?: GoogleStep[] }[];
}

function parseDurationSeconds(d?: string): number {
  if (!d) return 0;
  const n = parseInt(d.replace("s", ""), 10);
  return Number.isFinite(n) ? n : 0;
}

export class GoogleTransitProvider implements TransitProvider {
  name = "google";
  constructor(private apiKey: string) {}

  async getJourney(q: JourneyQuery): Promise<JourneyResult> {
    const body = {
      origin: { address: q.origin },
      destination: { address: q.destination },
      travelMode: "TRANSIT",
      arrivalTime: new Date(q.arriveBy).toISOString(),
      computeAlternativeRoutes: true,
    };

    const res = await fetch(ROUTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Routes ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as { routes?: GoogleRoute[] };
    const arriveByMs = new Date(q.arriveBy).getTime();

    const options: JourneyOption[] = (data.routes ?? []).map((route) => {
      const steps = route.legs?.flatMap((l) => l.steps ?? []) ?? [];
      const legs: JourneyLeg[] = steps.map((s) => mapStep(s));
      const durationSeconds = parseDurationSeconds(route.duration);

      // Routes API anchors a TRANSIT route on the requested arrivalTime; derive
      // departure as arrival − total duration.
      const arrival = new Date(arriveByMs);
      const departure = new Date(arriveByMs - durationSeconds * 1000);

      const firstTransit = legs.find((l) => l.mode === "TRANSIT");
      const summary = firstTransit?.line
        ? `${firstTransit.line} → …`
        : legs.length
        ? "Walk + transit"
        : "Transit";

      return {
        departureTime: departure.toISOString(),
        arrivalTime: arrival.toISOString(),
        durationSeconds,
        summary,
        legs,
      };
    });

    options.sort(
      (a, b) =>
        new Date(a.departureTime).getTime() -
        new Date(b.departureTime).getTime()
    );

    return {
      provider: this.name,
      origin: q.origin,
      destination: q.destination,
      options,
    };
  }
}

function mapStep(s: GoogleStep): JourneyLeg {
  const mode =
    s.travelMode === "TRANSIT"
      ? "TRANSIT"
      : s.travelMode === "WALK"
      ? "WALK"
      : "OTHER";
  const td = s.transitDetails;
  const line = td?.transitLine?.nameShort ?? td?.transitLine?.name;
  return {
    mode,
    line,
    headsign: td?.headsign,
    departureStop: td?.stopDetails?.departureStop?.name,
    departureTime: td?.stopDetails?.departureTime,
    durationSeconds: parseDurationSeconds(s.staticDuration),
  };
}

/** Choose a provider from the environment. Falls back to the mock. */
export function resolveProvider(): TransitProvider {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (key) return new GoogleTransitProvider(key);
  return new MockTransitProvider();
}
