import Head from "next/head";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { PlanCard } from "@/components/leaveHouse/PlanCard";
import { primeAudio } from "@/lib/leaveHouse/alarmSound";
import { buildPlan, nextRelevantEvent } from "@/lib/leaveHouse/schedule";
import {
  loadIcsUrl,
  loadManualEvents,
  loadPrefs,
  saveIcsUrl,
  saveManualEvents,
  savePrefs,
} from "@/lib/leaveHouse/storage";
import { dayClock } from "@/lib/leaveHouse/time";
import {
  CalEvent,
  JourneyResult,
  Prefs,
} from "@/lib/leaveHouse/types";
import {
  requestNotificationPermission,
  useAlarmEngine,
  useNow,
} from "@/lib/leaveHouse/useAlarm";

export default function LeaveHouseAlarm() {
  const now = useNow(1000);

  // --- persisted state (hydrated on mount to keep SSR markup stable) --------
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [manualEvents, setManualEvents] = useState<CalEvent[]>([]);
  const [icsUrl, setIcsUrl] = useState("");
  const [icsEvents, setIcsEvents] = useState<CalEvent[]>([]);
  const [icsStatus, setIcsStatus] = useState<string>("");

  const [journey, setJourney] = useState<JourneyResult | null>(null);
  const [journeyError, setJourneyError] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    setManualEvents(loadManualEvents());
    setIcsUrl(loadIcsUrl());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/leave-house-sw.js", { scope: "/alarm" })
        .catch(() => {
          /* SW optional; app still works without it */
        });
    }
  }, []);

  // --- derived: the event we're planning for, and its plan -----------------
  const events = useMemo(
    () => [...manualEvents, ...icsEvents],
    [manualEvents, icsEvents]
  );
  // Recompute as time passes so past events drop off. Cheap over a handful of
  // events, and `now` ticks every second.
  const nextEvent = useMemo(
    () => nextRelevantEvent(events, now),
    [events, now]
  );
  const plan = useMemo(
    () => (nextEvent ? buildPlan(nextEvent, journey, prefs) : null),
    [nextEvent, journey, prefs]
  );

  const { active, dismiss } = useAlarmEngine(plan, now, { soundEnabled });

  // --- look up the journey when the target event or home changes -----------
  const lookupKey = nextEvent
    ? `${nextEvent.id}|${nextEvent.location}|${nextEvent.start}|${prefs.homeLocation}|${prefs.arrivalBufferMinutes}`
    : "";
  useEffect(() => {
    if (!nextEvent || !prefs.homeLocation.trim() || !nextEvent.location.trim()) {
      setJourney(null);
      return;
    }
    const arriveBy = new Date(
      new Date(nextEvent.start).getTime() -
        prefs.arrivalBufferMinutes * 60 * 1000
    ).toISOString();
    const params = new URLSearchParams({
      from: prefs.homeLocation,
      to: nextEvent.location,
      arriveBy,
    });
    let cancelled = false;
    setJourneyError("");
    fetch(`/api/journey?${params.toString()}`)
      .then((r) => r.json())
      .then((data: JourneyResult | { error: string }) => {
        if (cancelled) return;
        if ("error" in data) setJourneyError(data.error);
        else setJourney(data);
      })
      .catch((e) => !cancelled && setJourneyError(String(e)));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupKey]);

  // --- handlers -------------------------------------------------------------
  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  const addEvent = useCallback((e: CalEvent) => {
    setManualEvents((prev) => {
      const next = [...prev, e];
      saveManualEvents(next);
      return next;
    });
  }, []);

  const removeEvent = useCallback((id: string) => {
    setManualEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveManualEvents(next);
      return next;
    });
  }, []);

  const refreshIcs = useCallback(async (url: string) => {
    saveIcsUrl(url);
    setIcsUrl(url);
    if (!url.trim()) {
      setIcsEvents([]);
      setIcsStatus("");
      return;
    }
    setIcsStatus("Loading…");
    try {
      const r = await fetch(`/api/calendar?url=${encodeURIComponent(url)}`);
      const data = await r.json();
      if ("error" in data) {
        setIcsStatus(`Error: ${data.error}`);
        setIcsEvents([]);
      } else {
        setIcsEvents(data.events);
        setIcsStatus(`Loaded ${data.events.length} event(s).`);
      }
    } catch (err) {
      setIcsStatus(`Error: ${String(err)}`);
    }
  }, []);

  const enableSound = useCallback(() => {
    setSoundEnabled(primeAudio());
  }, []);

  const enableNotifications = useCallback(async () => {
    setNotifyEnabled(await requestNotificationPermission());
  }, []);

  // -------------------------------------------------------------------------
  return (
    <>
      <Head>
        <title>Leave House Alarm</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="description" content="Calendar-aware leave-the-house alarm." />
        <meta name="theme-color" content="#0b0b0d" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Leave Alarm" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>

      <main className="mx-auto min-h-screen max-w-md px-4 py-6 text-white">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-white">🏃 Leave House Alarm</h1>
          <p className="mt-1 text-sm text-white/50">
            Knows your next event, finds the bus, rings when to get ready and
            when to leave.
          </p>
        </header>

        {plan ? (
          <PlanCard plan={plan} now={now} />
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/60">
            No upcoming event with a location yet. Add one below or connect a
            calendar feed.
          </section>
        )}

        {journeyError && (
          <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            Transit lookup failed: {journeyError}
          </p>
        )}

        <EnableBar
          soundEnabled={soundEnabled}
          notifyEnabled={notifyEnabled}
          onSound={enableSound}
          onNotify={enableNotifications}
        />

        <Settings prefs={prefs} onChange={updatePrefs} />

        <CalendarFeed
          url={icsUrl}
          status={icsStatus}
          onRefresh={refreshIcs}
          count={icsEvents.length}
        />

        <EventManager
          events={manualEvents}
          onAdd={addEvent}
          onRemove={removeEvent}
        />

        <Disclaimer />
      </main>

      {active && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/90 px-6 text-center backdrop-blur">
          <div
            className={`text-5xl ${
              active.kind === "leave" ? "animate-pulse" : ""
            }`}
          >
            {active.kind === "leave" ? "🚪🏃" : "⏰"}
          </div>
          <h2 className="text-3xl font-extrabold text-white">{active.title}</h2>
          <p className="max-w-sm text-white/70">{active.message}</p>
          <button
            onClick={dismiss}
            className="rounded-full bg-white px-8 py-3 text-lg font-semibold text-black active:scale-95"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

// --- small inline UI pieces -------------------------------------------------

function EnableBar({
  soundEnabled,
  notifyEnabled,
  onSound,
  onNotify,
}: {
  soundEnabled: boolean;
  notifyEnabled: boolean;
  onSound: () => void;
  onNotify: () => void;
}) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        onClick={onSound}
        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
          soundEnabled
            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
            : "border-white/15 bg-white/5 text-white/80"
        }`}
      >
        {soundEnabled ? "🔊 Sound on" : "🔈 Enable sound"}
      </button>
      <button
        onClick={onNotify}
        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
          notifyEnabled
            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
            : "border-white/15 bg-white/5 text-white/80"
        }`}
      >
        {notifyEnabled ? "🔔 Notifications on" : "🔕 Enable notifications"}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-white/40">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-white/30";

function Settings({
  prefs,
  onChange,
}: {
  prefs: Prefs;
  onChange: (patch: Partial<Prefs>) => void;
}) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-sm font-semibold text-white/80">Setup</h3>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <Field label="Home / start location">
          <input
            className={inputClass}
            placeholder="e.g. 10 Downing St, London"
            value={prefs.homeLocation}
            onChange={(e) => onChange({ homeLocation: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Get ready (min)">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={prefs.prepMinutes}
              onChange={(e) =>
                onChange({ prepMinutes: clampNum(e.target.value, 30) })
              }
            />
          </Field>
          <Field label="Leave buffer">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={prefs.leaveBufferMinutes}
              onChange={(e) =>
                onChange({ leaveBufferMinutes: clampNum(e.target.value, 3) })
              }
            />
          </Field>
          <Field label="Arrive early">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={prefs.arrivalBufferMinutes}
              onChange={(e) =>
                onChange({ arrivalBufferMinutes: clampNum(e.target.value, 5) })
              }
            />
          </Field>
        </div>
      </div>
    </section>
  );
}

function CalendarFeed({
  url,
  status,
  count,
  onRefresh,
}: {
  url: string;
  status: string;
  count: number;
  onRefresh: (url: string) => void;
}) {
  const [draft, setDraft] = useState(url);
  useEffect(() => setDraft(url), [url]);
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-sm font-semibold text-white/80">
        Calendar feed (optional)
      </h3>
      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs text-white/40">
          Paste an iCloud “Public Calendar” or Google “iCal address” URL. Events
          with a location are pulled in automatically.
        </p>
        <input
          className={inputClass}
          placeholder="webcal://… or https://…/basic.ics"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => onRefresh(draft)}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            Refresh feed
          </button>
          <span className="text-xs text-white/50">
            {status || (count ? `${count} event(s)` : "")}
          </span>
        </div>
      </div>
    </section>
  );
}

function EventManager({
  events,
  onAdd,
  onRemove,
}: {
  events: CalEvent[];
  onAdd: (e: CalEvent) => void;
  onRemove: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [start, setStart] = useState("");

  const submit = () => {
    if (!title.trim() || !start) return;
    onAdd({
      id: `manual-${start}-${title}`,
      title: title.trim(),
      location: location.trim(),
      start: new Date(start).toISOString(),
      source: "manual",
    });
    setTitle("");
    setLocation("");
    setStart("");
  };

  return (
    <section className="mt-6">
      <h3 className="mb-2 text-sm font-semibold text-white/80">Your events</h3>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="space-y-2">
          <input
            className={inputClass}
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Location / address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            type="datetime-local"
            className={inputClass}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <button
            onClick={submit}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black active:scale-95"
          >
            Add event
          </button>
        </div>

        {events.length > 0 && (
          <ul className="divide-y divide-white/5 border-t border-white/5 pt-1">
            {events.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate text-white/90">
                    {e.title}
                  </span>
                  <span className="block truncate text-xs text-white/40">
                    {dayClock(e.start)} · {e.location || "no location"}
                  </span>
                </span>
                <button
                  onClick={() => onRemove(e.id)}
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <footer className="mt-8 space-y-2 text-xs leading-relaxed text-white/35">
      <p>
        ⚠️ A web app can only ring reliably while it’s open on screen. iOS limits
        background activity for installed web apps, so keep this open (or
        re-open it in the morning) for guaranteed alarms. A native iOS app with
        Critical Alerts is the only way to get a true always-on alarm.
      </p>
      <p>
        Transit uses Google Routes when a server API key is configured,
        otherwise a built-in demo schedule. Citymapper’s public API was
        discontinued in 2023, so it can’t be used here.
      </p>
    </footer>
  );
}

function clampNum(value: string, fallback: number): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
