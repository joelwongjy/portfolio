// Minimal iCalendar (.ics) parser — enough to pull upcoming VEVENTs with a
// start time and location out of an iCloud/Google "public calendar" URL. No
// dependency; we only need SUMMARY, LOCATION, DTSTART and UID.

import { CalEvent } from "./types";

/** Unfold RFC 5545 line continuations (a leading space/tab continues a line). */
function unfold(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Split "DTSTART;TZID=...:20240601T080000" into name, params, value. */
function splitLine(line: string): { name: string; params: string; value: string } {
  const colon = line.indexOf(":");
  if (colon === -1) return { name: line, params: "", value: "" };
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const semi = left.indexOf(";");
  if (semi === -1) return { name: left, params: "", value };
  return { name: left.slice(0, semi), params: left.slice(semi + 1), value };
}

/**
 * Parse an ICS date value into an ISO string.
 * Handles "YYYYMMDDTHHMMSSZ" (UTC), "YYYYMMDDTHHMMSS" (local/floating) and
 * all-day "YYYYMMDD". TZID params are treated as local (good enough for an
 * alarm UX; the heavy lifting is the relative countdown).
 */
function parseIcsDate(value: string): string | null {
  const m = value.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/
  );
  if (!m) return null;
  const [, y, mo, d, hh = "00", mm = "00", ss = "00", z] = m;
  if (z) {
    return new Date(
      Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss)
    ).toISOString();
  }
  return new Date(+y, +mo - 1, +d, +hh, +mm, +ss).toISOString();
}

function unescape(value: string): string {
  return value
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

export function parseIcs(raw: string): CalEvent[] {
  const lines = unfold(raw);
  const events: CalEvent[] = [];
  let cur: Partial<CalEvent> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = { source: "ics" };
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && cur.start) {
        events.push({
          id: cur.id || `ics-${cur.start}-${cur.title ?? ""}`,
          title: cur.title || "Event",
          location: cur.location || "",
          start: cur.start,
          source: "ics",
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const { name, value } = splitLine(line);
    switch (name) {
      case "UID":
        cur.id = value.trim();
        break;
      case "SUMMARY":
        cur.title = unescape(value).trim();
        break;
      case "LOCATION":
        cur.location = unescape(value).trim();
        break;
      case "DTSTART": {
        const iso = parseIcsDate(value.trim());
        if (iso) cur.start = iso;
        break;
      }
    }
  }

  return events;
}
