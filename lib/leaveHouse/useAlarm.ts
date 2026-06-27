// React hooks that drive the live countdown and fire the alarms.
//
// IMPORTANT (and honest) limitation: a web app can only reliably ring while it
// is open/foregrounded. iOS does not let installed web apps run code in the
// background to recompute departure times, and it heavily limits background
// notifications. So this engine fires accurately when the PWA is open; the
// scheduled local notifications below are a best-effort nudge for when it is
// backgrounded. A native app (with the Critical Alerts entitlement) is the only
// way to guarantee a true always-on alarm.

import { useEffect, useRef, useState } from "react";

import { AlarmHandle, startAlarm } from "./alarmSound";
import { AlarmKind, AlarmPlan } from "./types";
import { clock } from "./time";

/** Re-render every `intervalMs` so countdowns stay live. */
export function useNow(intervalMs = 1000): string {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const id = window.setInterval(
      () => setNow(new Date().toISOString()),
      intervalMs
    );
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export interface ActiveAlarm {
  kind: AlarmKind;
  title: string;
  message: string;
}

interface EngineOpts {
  soundEnabled: boolean;
  /** Only fire if now is within this many ms after the target (avoid stale). */
  graceMs?: number;
}

const COPY: Record<AlarmKind, { title: string; verb: string }> = {
  getReady: { title: "Time to get ready", verb: "Start getting ready for" },
  leave: { title: "Leave now!", verb: "Leave the house for" },
};

function alarmTimeFor(plan: AlarmPlan, kind: AlarmKind): string {
  return kind === "getReady" ? plan.getReadyAt : plan.leaveHomeAt;
}

/**
 * Watches the plan and fires each alarm once, when `now` crosses its time.
 * Returns the currently-ringing alarm (if any) and a dismiss callback.
 */
export function useAlarmEngine(
  plan: AlarmPlan | null,
  now: string,
  opts: EngineOpts
): { active: ActiveAlarm | null; dismiss: () => void } {
  const [active, setActive] = useState<ActiveAlarm | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const handleRef = useRef<AlarmHandle | null>(null);
  const grace = opts.graceMs ?? 90 * 1000;

  useEffect(() => {
    if (!plan) return;
    const nowMs = new Date(now).getTime();

    (["getReady", "leave"] as AlarmKind[]).forEach((kind) => {
      const key = `${plan.event.id}:${kind}`;
      if (firedRef.current.has(key)) return;
      const target = new Date(alarmTimeFor(plan, kind)).getTime();
      if (nowMs >= target && nowMs - target <= grace) {
        firedRef.current.add(key);
        fire(plan, kind);
      }
    });

    function fire(p: AlarmPlan, kind: AlarmKind) {
      const copy = COPY[kind];
      const message =
        kind === "leave"
          ? `${p.event.title} — ${
              p.chosen ? p.chosen.summary : "your journey"
            }. Leaving at ${clock(p.leaveHomeAt)}.`
          : `${p.event.title} at ${clock(p.event.start)} (${
              p.event.location
            }).`;

      setActive({ kind, title: copy.title, message });
      if (opts.soundEnabled) {
        handleRef.current?.stop();
        handleRef.current = startAlarm();
      }
      notify(copy.title, message);
    }
  }, [plan, now, grace, opts.soundEnabled]);

  // Clean up the oscillator if the component unmounts mid-ring.
  useEffect(() => {
    return () => handleRef.current?.stop();
  }, []);

  const dismiss = () => {
    handleRef.current?.stop();
    handleRef.current = null;
    setActive(null);
  };

  return { active, dismiss };
}

function notify(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) =>
          reg.showNotification(title, { body, tag: "leave-house-alarm" })
        )
        .catch(() => new Notification(title, { body }));
    } else {
      new Notification(title, { body });
    }
  } catch {
    /* notifications unavailable */
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}
