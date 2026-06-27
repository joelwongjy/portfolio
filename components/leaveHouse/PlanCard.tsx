// The hero card: the next event and the two alarm countdowns.

import { AlarmPlan } from "@/lib/leaveHouse/types";
import { clock, dayClock, formatMinutes, relative } from "@/lib/leaveHouse/time";

function Countdown({
  label,
  at,
  now,
  accent,
}: {
  label: string;
  at: string;
  now: string;
  accent: string;
}) {
  const past = new Date(at).getTime() <= new Date(now).getTime();
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-sm text-white/60">{label}</span>
      <span className="text-right">
        <span className={`text-lg font-semibold ${accent}`}>{clock(at)}</span>
        <span className="ml-2 text-sm text-white/50">
          {past ? "passed" : relative(at, now)}
        </span>
      </span>
    </div>
  );
}

export function PlanCard({ plan, now }: { plan: AlarmPlan; now: string }) {
  const { event, chosen } = plan;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-card">
      <p className="text-xs uppercase tracking-widest text-white/40">
        Next trip
      </p>
      <h2 className="mt-1 text-2xl font-bold text-white">{event.title}</h2>
      <p className="mt-1 text-sm text-white/60">
        {dayClock(event.start)} · {event.location || "no location"}
      </p>

      <div className="mt-4 divide-y divide-white/5 border-y border-white/5">
        <Countdown
          label="Start getting ready"
          at={plan.getReadyAt}
          now={now}
          accent="text-amber-300"
        />
        <Countdown
          label="Leave the house"
          at={plan.leaveHomeAt}
          now={now}
          accent="text-rose-400"
        />
      </div>

      <div className="mt-4 space-y-1 text-sm text-white/60">
        {chosen ? (
          <p>
            <span className="text-white/80">{chosen.summary}</span> ·{" "}
            {formatMinutes(chosen.durationSeconds)} journey · arrive ~
            {clock(chosen.arrivalTime)}
          </p>
        ) : (
          <p>No transit route yet.</p>
        )}
        {chosen?.legs.find((l) => l.mode === "TRANSIT")?.departureTime && (
          <p>
            Next {chosen.legs.find((l) => l.mode === "TRANSIT")?.line ?? "service"}{" "}
            departs{" "}
            {clock(
              chosen.legs.find((l) => l.mode === "TRANSIT")!.departureTime!
            )}
            {(() => {
              const stop = chosen.legs.find((l) => l.mode === "TRANSIT")
                ?.departureStop;
              return stop ? ` from ${stop}` : "";
            })()}
          </p>
        )}
      </div>

      {plan.note && (
        <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
          {plan.note}
        </p>
      )}
    </section>
  );
}
