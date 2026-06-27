// The heart of the app: turn a calendar event + a transit lookup + the user's
// preferences into a concrete plan with two alarm times.

import {
  AlarmPlan,
  CalEvent,
  JourneyOption,
  JourneyResult,
  Prefs,
} from "./types";
import { isAfter, subMinutes } from "./time";

/**
 * Pick the best journey option for an event.
 *
 * We want the *latest* departure that still arrives by `arriveBy` (less waiting
 * around). If nothing arrives in time we fall back to the option that arrives
 * earliest, and the caller flags the plan as not feasible.
 */
export function chooseOption(
  options: JourneyOption[],
  arriveBy: string
): { option: JourneyOption | null; feasible: boolean } {
  if (!options.length) return { option: null, feasible: false };

  const inTime = options.filter((o) => !isAfter(o.arrivalTime, arriveBy));
  if (inTime.length) {
    // Latest departure among the on-time options.
    const best = inTime.reduce((a, b) =>
      isAfter(b.departureTime, a.departureTime) ? b : a
    );
    return { option: best, feasible: true };
  }

  // Nothing makes it in time — surface the option that gets there soonest.
  const earliest = options.reduce((a, b) =>
    isAfter(a.arrivalTime, b.arrivalTime) ? b : a
  );
  return { option: earliest, feasible: false };
}

/**
 * Build the full alarm plan for an event.
 *
 *   arriveBy     = event.start − arrivalBuffer
 *   leaveHomeAt  = chosen.departureTime − leaveBuffer   (cushion to the stop)
 *   getReadyAt   = leaveHomeAt − prepMinutes
 *
 * `journey` may be null (lookup failed / not yet run); we still return a plan so
 * the UI can show the event and an explanatory note.
 */
export function buildPlan(
  event: CalEvent,
  journey: JourneyResult | null,
  prefs: Prefs
): AlarmPlan {
  const arriveBy = subMinutes(event.start, prefs.arrivalBufferMinutes);

  if (!journey || !journey.options.length) {
    // No transit data: assume we can leave at arriveBy and still warn the user.
    return {
      event,
      chosen: null,
      arriveBy,
      leaveHomeAt: arriveBy,
      getReadyAt: subMinutes(arriveBy, prefs.prepMinutes),
      feasible: false,
      note: journey
        ? "No transit route found — times are a rough guess."
        : "Transit not looked up yet.",
    };
  }

  const { option, feasible } = chooseOption(journey.options, arriveBy);
  const chosen = option as JourneyOption;

  const leaveHomeAt = subMinutes(chosen.departureTime, prefs.leaveBufferMinutes);
  const getReadyAt = subMinutes(leaveHomeAt, prefs.prepMinutes);

  return {
    event,
    chosen,
    arriveBy,
    leaveHomeAt,
    getReadyAt,
    feasible,
    note: feasible
      ? undefined
      : "Heads up: the soonest route still arrives after your target time.",
  };
}

/** Pick the soonest upcoming event that has a location. */
export function nextRelevantEvent(
  events: CalEvent[],
  nowIso: string
): CalEvent | null {
  const upcoming = events
    .filter((e) => e.location.trim() && isAfter(e.start, nowIso))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return upcoming[0] ?? null;
}
