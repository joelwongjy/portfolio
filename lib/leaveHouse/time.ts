// Small, dependency-free time helpers. All datetimes are ISO-8601 strings so
// they round-trip cleanly through JSON, localStorage and API routes.

export const MINUTE_MS = 60 * 1000;

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * MINUTE_MS).toISOString();
}

export function subMinutes(iso: string, minutes: number): string {
  return addMinutes(iso, -minutes);
}

export function msBetween(fromIso: string, toIso: string): number {
  return new Date(toIso).getTime() - new Date(fromIso).getTime();
}

export function isAfter(aIso: string, bIso: string): boolean {
  return new Date(aIso).getTime() > new Date(bIso).getTime();
}

export function isBefore(aIso: string, bIso: string): boolean {
  return new Date(aIso).getTime() < new Date(bIso).getTime();
}

/** "in 12 min", "in 2 h 5 min", "5 min ago", "now". */
export function relative(targetIso: string, nowIso: string): string {
  const ms = msBetween(nowIso, targetIso);
  const past = ms < 0;
  const totalMin = Math.round(Math.abs(ms) / MINUTE_MS);
  if (totalMin === 0) return "now";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const parts = [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean);
  const body = parts.join(" ");
  return past ? `${body} ago` : `in ${body}`;
}

/** Clock time like "08:42". Locale-friendly but stable for SSR/tests. */
export function clock(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** "Mon 08:42" style label for an upcoming event. */
export function dayClock(iso: string): string {
  const d = new Date(iso);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${day} ${clock(iso)}`;
}

export function formatMinutes(totalSeconds: number): string {
  const m = Math.round(totalSeconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} h ${rem} min` : `${h} h`;
}
