// Client-side persistence. Everything the alarm needs (preferences, manually
// added events, the optional ICS feed URL) lives in localStorage — no backend,
// no account. Guarded so it's safe to import during SSR.

import { CalEvent, DEFAULT_PREFS, Prefs } from "./types";

const PREFS_KEY = "lha.prefs.v1";
const EVENTS_KEY = "lha.events.v1";
const ICS_KEY = "lha.icsUrl.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function read<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadPrefs(): Prefs {
  return { ...DEFAULT_PREFS, ...read<Partial<Prefs>>(PREFS_KEY, {}) };
}

export function savePrefs(prefs: Prefs): void {
  write(PREFS_KEY, prefs);
}

export function loadManualEvents(): CalEvent[] {
  return read<CalEvent[]>(EVENTS_KEY, []);
}

export function saveManualEvents(events: CalEvent[]): void {
  write(EVENTS_KEY, events);
}

export function loadIcsUrl(): string {
  return read<string>(ICS_KEY, "");
}

export function saveIcsUrl(url: string): void {
  write(ICS_KEY, url);
}
