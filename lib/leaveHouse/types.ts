// Core domain types for the Leave House Alarm.
//
// The app's job: look at the next calendar event that has a location, work out
// when the bus/transit that gets you there leaves, and ring two alarms — one to
// start getting ready, one to actually leave the house.

/** A calendar event we might need to leave the house for. */
export interface CalEvent {
  id: string;
  title: string;
  /** Free-text address or place name the transit provider can route to. */
  location: string;
  /** ISO-8601 start datetime. */
  start: string;
  source: "manual" | "ics";
}

export type TransitMode = "WALK" | "TRANSIT" | "OTHER";

/** One stage of a journey (a walk, a bus, a train…). */
export interface JourneyLeg {
  mode: TransitMode;
  /** Human label for a transit leg, e.g. "Bus 12" or "Northern Line". */
  line?: string;
  /** Direction/terminus, e.g. "towards Morden". */
  headsign?: string;
  /** Name of the stop this leg departs from. */
  departureStop?: string;
  /** ISO-8601 — when this leg departs. */
  departureTime?: string;
  durationSeconds: number;
}

/** A single normalized way to make the journey, provider-agnostic. */
export interface JourneyOption {
  /** ISO-8601 — when you must leave the origin to take this option. */
  departureTime: string;
  /** ISO-8601 — when this option gets you to the destination. */
  arrivalTime: string;
  durationSeconds: number;
  /** Short human summary, e.g. "Bus 12 → walk". */
  summary: string;
  legs: JourneyLeg[];
}

/** What a transit provider returns for an origin→destination query. */
export interface JourneyResult {
  provider: string;
  origin: string;
  destination: string;
  /** Earliest first. May be empty if no transit was found. */
  options: JourneyOption[];
}

/** User preferences that drive the alarm maths. */
export interface Prefs {
  /** Where journeys start from (address or place name). */
  homeLocation: string;
  /** Minutes you need to get ready before leaving. */
  prepMinutes: number;
  /** Safety cushion subtracted from the computed departure time. */
  leaveBufferMinutes: number;
  /** Arrive this many minutes before the event actually starts. */
  arrivalBufferMinutes: number;
}

export const DEFAULT_PREFS: Prefs = {
  homeLocation: "",
  prepMinutes: 30,
  leaveBufferMinutes: 3,
  arrivalBufferMinutes: 5,
};

/** The computed plan for a single event: when to get ready, when to leave. */
export interface AlarmPlan {
  event: CalEvent;
  /** The journey option we picked (latest that still arrives in time). */
  chosen: JourneyOption | null;
  /** ISO-8601 — start getting ready. */
  getReadyAt: string;
  /** ISO-8601 — leave the house now. */
  leaveHomeAt: string;
  /** ISO-8601 — the latest you can arrive (event start − arrival buffer). */
  arriveBy: string;
  /** False when no option arrives in time (you'd be late). */
  feasible: boolean;
  /** Human note explaining edge cases (late, no transit found, etc.). */
  note?: string;
}

export type AlarmKind = "getReady" | "leave";
